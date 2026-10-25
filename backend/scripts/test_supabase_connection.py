import os
import sys
import psycopg2

if sys.stdout.encoding and sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

DATABASE_URL = os.environ.get( "DATABASE_URL" )

def test_connection():
    print("Connecting to Supabase Cloud Database...")
    try:
        conn = psycopg2.connect(DATABASE_URL, connect_timeout=10)
        cur = conn.cursor()
        cur.execute("SELECT COUNT(*) FROM addis_geo_points;")
        count = cur.fetchone()[0]
        print(f"SUCCESS! Connected to Supabase. Total places available: {count}")
        
        # Test a query for named amenities
        cur.execute("""
            SELECT id, latitude, longtiude, content 
            FROM addis_geo_points 
            WHERE content LIKE '%Amharic name%' 
            LIMIT 3;
        """)
        print("\nSample records with Amharic names:")
        for r in cur.fetchall():
            preview = r[3].replace('\n', ' | ')[:90]
            print(f"- [ID: {r[0]}] ({r[1]}, {r[2]}): {preview}")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Connection failed: {e}")

if __name__ == "__main__":
    test_connection()