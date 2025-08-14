import psycopg2
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_connection():
    try:
        # Get database URL from environment
        database_url = os.getenv('DATABASE_URL')
        if not database_url:
            print("❌ DATABASE_URL not found in environment variables")
            return False
            
        print(f"🔗 Connecting to database...")
        print(f"Connection string: {database_url[:50]}...")
        
        # Connect to database
        conn = psycopg2.connect(database_url)
        cursor = conn.cursor()
        
        # Test the connection
        cursor.execute("SELECT version();")
        version = cursor.fetchone()
        print(f"✅ Successfully connected to PostgreSQL!")
        print(f"Database version: {version[0]}")
        
        # Check if tables exist
        cursor.execute("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name;
        """)
        tables = cursor.fetchall()
        
        if tables:
            print(f"📊 Found {len(tables)} existing tables:")
            for table in tables:
                print(f"  - {table[0]}")
        else:
            print("📋 No tables found - database is empty (ready for schema initialization)")
        
        # Close connection
        cursor.close()
        conn.close()
        
        print("🎉 Database connection test successful!")
        return True
        
    except Exception as e:
        print(f"❌ Database connection failed: {str(e)}")
        return False

if __name__ == "__main__":
    test_connection()