const { createClient } = require("@supabase/supabase-js");

// You'll need to get these from your Supabase dashboard
const supabaseUrl = "https://bwscgiglgzggtitxulej.supabase.co";
const supabaseKey = "your-anon-key"; // Get this from Settings → API

async function testSupabaseConnection() {
  try {
    console.log("Testing Supabase client connection...");

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Test a simple query
    const { data, error } = await supabase.from("users").select("*").limit(1);

    if (error) {
      console.error("❌ Supabase query failed:", error);
    } else {
      console.log("✅ Supabase connection successful!");
      console.log("Data:", data);
    }
  } catch (error) {
    console.error("❌ Supabase connection failed:", error.message);
  }
}

testSupabaseConnection();
