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

async function checkDocuments() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('supabase.co') ? { rejectUnauthorized: false } : false
  });

  const client = await pool.connect();

  console.log('📄 Checking documents for Anupam Pan Bhandar (APP17685487954474NPXFZ)\n');

  // Get actual document details
  const allDocs = await client.query(`
    SELECT d.id, d.document_type, d.file_name, d.storage_url, d.file_path,
           LENGTH(d.storage_url) as url_length
    FROM documents d
    JOIN vendor_applications va ON d.application_id = va.id
    WHERE va.application_id = 'APP17685487954474NPXFZ'
    ORDER BY d.document_type
  `);

  console.log(`Found ${allDocs.rows.length} document(s):\n`);
  allDocs.rows.forEach((row, idx) => {
    console.log(`${idx + 1}. Document Type: ${row.document_type}`);
    console.log(`   File Name: ${row.file_name || 'NULL'}`);
    console.log(`   Storage URL: ${row.storage_url ? `${row.storage_url.substring(0, 60)}...` : 'NULL'}`);
    console.log(`   File Path: ${row.file_path || 'NULL'}`);
    console.log(`   Has URL: ${row.storage_url ? 'YES' : 'NO'}`);
    console.log('');
  });

  client.release();
  await pool.end();
}

checkDocuments().catch(console.error);
