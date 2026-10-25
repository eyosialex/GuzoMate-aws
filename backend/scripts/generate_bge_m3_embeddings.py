import torch
torch.set_num_threads(8)

import os
import re
import ssl
import time

# Bypass SSL verification issues for HuggingFace downloads on Windows corporate/proxy environments
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

import psycopg2
from psycopg2.extras import execute_batch
from langchain_huggingface import HuggingFaceEmbeddings

DB_HOST = os.environ.get("DB_HOST", "localhost")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_NAME = os.environ.get("DB_NAME", "guzomate")
DB_USER = os.environ.get("DB_USER", "guzomate")
DB_PASSWORD = os.environ.get("DB_PASSWORD", "guzomate_dev_password")

def parse_other_tags(tag_str):
    tags = {}
    if not tag_str:
        return tags
    pattern = re.compile(r'"((?:\\.|[^"\\])*)"=>"((?:\\.|[^"\\])*)"')
    for match in pattern.finditer(tag_str):
        k, v = match.groups()
        k = k.replace('\\"', '"').strip()
        v = v.replace('\\"', '"').strip()
        tags[k] = v
    return tags

def prepare_place_text(tags):
    parts = []
    if 'name' in tags:
        parts.append(f"Place name: {tags['name']}")
    if 'name:en' in tags and tags['name:en'] != tags.get('name'):
        parts.append(f"English name: {tags['name:en']}")
    if 'name:am' in tags:
        parts.append(f"Amharic name: {tags['name:am']}")
    if 'name:om' in tags:
        parts.append(f"Oromo name: {tags['name:om']}")

    for key in ['amenity', 'shop', 'tourism', 'healthcare', 'place', 'highway', 'historic', 'barrier', 'leisure']:
        if key in tags:
            parts.append(f"{key.capitalize()}: {tags[key]}")

    for key in ['cuisine', 'operator']:
        if key in tags:
            parts.append(f"{key}: {tags[key]}")

    return "\n".join(parts)

def get_connection():
    while True:
        try:
            conn = psycopg2.connect(
                host=DB_HOST,
                port=DB_PORT,
                dbname=DB_NAME,
                user=DB_USER,
                password=DB_PASSWORD
            )
            conn.autocommit = True
            return conn
        except Exception as e:
            print(f"Database unavailable ({e}), retrying in 5s...", flush=True)
            time.sleep(5)

def main():
    print("Connecting to PostgreSQL...")
    conn = get_connection()
    cur = conn.cursor()

    cur.execute("""
        CREATE TABLE IF NOT EXISTS place_embeddings (
            place_id INT PRIMARY KEY REFERENCES addis_geo_points(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            embedding DOUBLE PRECISION[] NOT NULL
        );
    """)

    # Process all remaining locations from addis_geo_points
    cur.execute("""
        SELECT a.id, a.other_tags 
        FROM addis_geo_points a
        LEFT JOIN place_embeddings pe ON a.id = pe.place_id
        WHERE pe.place_id IS NULL AND a.other_tags IS NOT NULL AND a.other_tags != ''
        ORDER BY a.id ASC;
    """)
    rows = cur.fetchall()
    total_rows = len(rows)
    print(f"Generating BGE-M3 embeddings for ALL remaining {total_rows} locations...")

    if total_rows == 0:
        print("Records are already embedded!")
        return

    print("Loading HuggingFace BAAI/bge-m3 embedding model...")
    embeddings_model = HuggingFaceEmbeddings(
        model_name="BAAI/bge-m3",
        model_kwargs={"device": "cpu"},
        encode_kwargs={"normalize_embeddings": True}
    )

    batch_size = 128
    insert_sql = """
        INSERT INTO place_embeddings (place_id, content, embedding)
        VALUES (%s, %s, %s)
        ON CONFLICT (place_id) DO UPDATE SET
            content = EXCLUDED.content,
            embedding = EXCLUDED.embedding;
    """

    for i in range(0, total_rows, batch_size):
        batch = rows[i:i + batch_size]
        batch_records = []
        batch_texts = []
        place_ids = []

        for place_id, raw_tags in batch:
            tags = parse_other_tags(raw_tags)
            text_desc = prepare_place_text(tags)
            if not text_desc.strip():
                text_desc = "Point of interest in Addis Ababa"
            batch_texts.append(text_desc)
            place_ids.append(place_id)

        vectors = embeddings_model.embed_documents(batch_texts)

        for p_id, text, vec in zip(place_ids, batch_texts, vectors):
            batch_records.append((p_id, text, vec))

        # Safe batch insert with auto-reconnect if DB connection ever drops
        inserted = False
        while not inserted:
            try:
                execute_batch(cur, insert_sql, batch_records)
                inserted = True
            except (psycopg2.OperationalError, psycopg2.DatabaseError) as err:
                print(f"\n[Warning] Database connection lost ({err}). Auto-reconnecting in 5s...", flush=True)
                time.sleep(5)
                conn = get_connection()
                cur = conn.cursor()

        print(f"Embedded & stored: {min(i + batch_size, total_rows)} / {total_rows} places", flush=True)

    print("\nSuccessfully finished generating BGE-M3 multilingual embeddings!")
    cur.close()
    conn.close()

if __name__ == '__main__':
    main()
