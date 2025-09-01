const { Pool } = require("pg");

async function testConnection() {
  const pool = new Pool({
    connectionString:
      "postgresql://postgres:Password_agrawalsamaj21@db.bwscgiglgzggtitxulej.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false },
    // Force IPv4 connection
    family: 4,
  });

  try {
    console.log("Attempting to connect to Supabase...");
    const client = await pool.connect();
    console.log("✅ Successfully connected to Supabase!");

    const result = await client.query("SELECT NOW()");
    console.log("✅ Database query successful:", result.rows[0]);

    client.release();
    await pool.end();
  } catch (error) {
    console.error("❌ Connection failed:", error.message);
    console.error("Error details:", error);
  }
}

testConnection();
