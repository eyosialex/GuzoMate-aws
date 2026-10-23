import os
import sys
import ssl

# Ensure UTF-8 console output for Amharic and Afaan Oromo characters on Windows
if sys.stdout.encoding.lower() != 'utf-8':
    sys.stdout.reconfigure(encoding='utf-8')

ssl._create_default_https_context = ssl._create_unverified_context
os.environ["CURL_CA_BUNDLE"] = ""
os.environ["REQUESTS_CA_BUNDLE"] = ""
os.environ["PYTHONHTTPSVERIFY"] = "0"
os.environ["HF_HUB_DISABLE_SYMLINKS_WARNING"] = "1"

import urllib3
urllib3.disable_warnings()

import httpx
_old_init = httpx.Client.__init__
def _new_init(self, *args, **kwargs):
    kwargs["verify"] = False
    _old_init(self, *args, **kwargs)
httpx.Client.__init__ = _new_init

import numpy as np
import psycopg2
from langchain_huggingface import HuggingFaceEmbeddings

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "guzomate")
DB_USER = os.environ.get("DB_USER", "guzomate")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "guzomate_dev_password")

def cosine_similarity(v1, v2):
    dot = np.dot(v1, v2)
    norm1 = np.linalg.norm(v1)
    norm2 = np.linalg.norm(v2)
    return float(dot / (norm1 * norm2)) if norm1 and norm2 else 0.0

def hybrid_search(query_text, user_lat=9.03, user_lon=38.74, top_k=5):
    print(f"\n=======================================================")
    print(f"User Query: '{query_text}'")
    print(f"User Location: (Lat: {user_lat}, Lon: {user_lon})")
    print(f"=======================================================\n")
    
    print("Generating query vector with BAAI/bge-m3...")
    model = HuggingFaceEmbeddings(
        model_name="BAAI/bge-m3",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True}
    )
    query_vector = np.array(model.embed_query(query_text))

    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        dbname=DB_NAME,
        user=DB_USER,
        password=DB_PASSWORD
    )
    cur = conn.cursor()

    # Single-table search directly on unified addis_geo_points table
    sql = """
        SELECT 
            a.id,
            a.latitude,
            a.longtiude,
            a.content,
            a.embedding,
            ROUND(ST_Distance(
                ST_SetSRID(ST_MakePoint(a.longtiude, a.latitude), 4326)::geography,
                ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography
            )::numeric, 1) AS distance_meters
        FROM addis_geo_points a
        WHERE a.embedding IS NOT NULL;
    """
    cur.execute(sql, (user_lon, user_lat))
    rows = cur.fetchall()

    scored = []
    for row in rows:
        place_id, lat, lon, content, emb_list, dist_m = row
        sim = cosine_similarity(query_vector, np.array(emb_list))
        scored.append({
            "id": place_id,
            "lat": lat,
            "lon": lon,
            "content": content,
            "similarity": sim,
            "distance_m": dist_m
        })

    # Sort primarily by semantic similarity
    scored.sort(key=lambda x: x["similarity"], reverse=True)
    top_results = scored[:top_k]

    for rank, item in enumerate(top_results, 1):
        content_preview = item["content"].replace("\n", " | ")
        print(f"{rank}. [Semantic Match: {item['similarity']:.4f} | Distance: {item['distance_m']}m]")
        print(f"   Coords: ({item['lat']}, {item['lon']})")
        print(f"   Details: {content_preview}\n")

    cur.close()
    conn.close()

if __name__ == '__main__':
    query = sys.argv[1] if len(sys.argv) > 1 else "ባህላዊ የቡና ቦታ" # Traditional coffee place in Amharic
    hybrid_search(query)
