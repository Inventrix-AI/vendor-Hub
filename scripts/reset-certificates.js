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

async function resetCertificates() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL not found in environment');
    process.exit(1);
  }

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: dbUrl.includes('supabase.co') ? { rejectUnauthorized: false } : false
  });

  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();
    console.log('✅ Connected!');

    // Check existing certificates
    const existingCerts = await client.query(`
      SELECT c.id, c.certificate_number, c.certificate_type, va.business_name, va.city
      FROM certificates c
      JOIN vendor_applications va ON c.application_id = va.id
    `);

    console.log('\n📋 Current certificates:');
    existingCerts.rows.forEach(row => {
      console.log(`   - ${row.business_name} (${row.city}): ${row.certificate_type || 'mp'}`);
    });

    console.log(`\n⚠️  Found ${existingCerts.rows.length} certificate(s) to delete`);
    console.log('   These will be regenerated automatically when viewed in dashboard');

    // Delete all existing certificates
    console.log('\n🗑️  Deleting old certificates...');
    const deleteResult = await client.query('DELETE FROM certificates');
    console.log(`✅ Deleted ${deleteResult.rowCount} certificate(s)`);

    client.release();
    await pool.end();

    console.log('\n✅ Certificate reset completed!');
    console.log('\n📝 Next steps:');
    console.log('   1. Visit admin dashboard for any approved vendor');
    console.log('   2. Certificates will be auto-generated with correct types');
    console.log('   3. Bhopal/Jabalpur/etc male vendors → 2 certs (MP + City)');
    console.log('   4. Other male vendors → 1 cert (MP only)');

  } catch (error) {
    console.error('\n❌ Reset failed!');
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
}

console.log('🚀 Resetting certificates...\n');
resetCertificates();
