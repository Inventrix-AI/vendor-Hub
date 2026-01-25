#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env file
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    line = line.trim();
    // Skip comments and empty lines
    if (!line || line.startsWith('#')) return;
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
      const key = match[1].trim();
      const value = match[2].trim().replace(/^["']|["']$/g, '');
      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  });
}

async function runMigration() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in environment');
    console.error('Please check your .env file');
    process.exit(1);
  }

  console.log('🔗 Database:', dbUrl.includes('supabase') ? 'Supabase' : 'PostgreSQL');

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('supabase.co') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected successfully!');

    console.log('\n📄 Reading migration file...');
    const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'add_certificate_types.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    console.log('⚡ Executing migration...');
    console.log('─'.repeat(60));
    await client.query(migration);
    console.log('─'.repeat(60));
    console.log('✅ Migration completed successfully!');

    console.log('\n📊 Verifying changes...');

    // Check if columns were added to vendor_applications
    const colCheck = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'vendor_applications'
      AND column_name IN ('gender', 'age')
      ORDER BY column_name
    `);

    console.log('\n✅ Columns added to vendor_applications:');
    colCheck.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });

    // Check if certificate_type column was added
    const certColCheck = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'certificates'
      AND column_name = 'certificate_type'
    `);

    console.log('\n✅ Column added to certificates:');
    certColCheck.rows.forEach(row => {
      console.log(`   - ${row.column_name} (${row.data_type})`);
    });

    // Check how many vendors were updated
    const vendorCheck = await client.query(`
      SELECT COUNT(*) as count, COALESCE(gender, 'NULL') as gender
      FROM vendor_applications
      GROUP BY gender
      ORDER BY gender
    `);

    console.log('\n📊 Vendor gender distribution:');
    vendorCheck.rows.forEach(row => {
      console.log(`   - ${row.gender}: ${row.count} vendor(s)`);
    });

    // Check how many vendors from specific cities
    const cityVendors = await client.query(`
      SELECT city, COUNT(*) as count
      FROM vendor_applications
      WHERE city ILIKE ANY(ARRAY['%bhopal%', '%jabalpur%', '%gwalior%', '%indore%', '%mandsour%', '%rewa%', '%ujjain%'])
      AND status = 'approved'
      GROUP BY city
    `);

    if (cityVendors.rows.length > 0) {
      console.log('\n📍 Approved vendors from specific cities (will get 2 certificates):');
      cityVendors.rows.forEach(row => {
        console.log(`   - ${row.city}: ${row.count} vendor(s)`);
      });
    }

    client.release();
    await pool.end();

    console.log('\n✅ Migration completed successfully!');
    console.log('\n📝 Summary:');
    console.log('   - All existing vendors set to gender = "male"');
    console.log('   - Male vendors from Bhopal/Jabalpur/Gwalior/Indore/Mandsour/Rewa/Ujjain → 2 certs (MP + City)');
    console.log('   - Female vendors (future) → 2 certs (MP + Mahila Ekta)');
    console.log('   - Other male vendors → 1 cert (MP only)');
    console.log('\n💡 Next step: Old certificates will be automatically regenerated when viewed in admin/vendor dashboard');

  } catch (error) {
    console.error('\n❌ Migration failed!');
    console.error('Error:', error.message);
    if (error.code) {
      console.error('Code:', error.code);
    }
    await pool.end();
    process.exit(1);
  }
}

console.log('🚀 Starting database migration...\n');
runMigration();
