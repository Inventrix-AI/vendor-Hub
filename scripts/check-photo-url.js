#!/usr/bin/env node

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

// Load env
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
      if (!process.env[key]) process.env[key] = value;
    }
  });
}

async function checkPhotoUrl() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('supabase.co') ? { rejectUnauthorized: false } : false
  });

  const client = await pool.connect();

  const photo = await client.query(`
    SELECT d.storage_url, d.file_path, d.file_name
    FROM documents d
    JOIN vendor_applications va ON d.application_id = va.id
    WHERE va.application_id = 'APP17685487954474NPXFZ'
    AND d.document_type = 'passport_photo'
  `);

  if (photo.rows.length > 0) {
    const photoData = photo.rows[0];
    console.log('🖼️  Passport Photo Details:\n');
    console.log('Full Storage URL:');
    console.log(photoData.storage_url);
    console.log('\nFile Path:');
    console.log(photoData.file_path);
    console.log('\nFile Name:');
    console.log(photoData.file_name);

    // Parse URL
    console.log('\n📋 URL Analysis:');
    const url = photoData.storage_url;

    if (url.includes('/storage/v1/object/public/')) {
      console.log('✅ Contains: /storage/v1/object/public/');
      const parts = url.split('/storage/v1/object/public/');
      console.log('Bucket and path:', parts[1]);
    } else {
      console.log('❌ Does NOT contain: /storage/v1/object/public/');
      console.log('Checking for other patterns...');

      if (url.includes('/storage/v1/object/')) {
        console.log('⚠️  Contains: /storage/v1/object/ (but not public)');
        const parts = url.split('/storage/v1/object/');
        console.log('After /storage/v1/object/:', parts[1]);
      }
    }
  } else {
    console.log('❌ No passport photo found');
  }

  client.release();
  await pool.end();
}

checkPhotoUrl().catch(console.error);
