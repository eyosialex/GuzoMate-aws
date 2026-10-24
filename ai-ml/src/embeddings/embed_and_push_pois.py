#!/usr/bin/env python3
"""
GuzoMate POI Embedding & Supabase Vector Push Pipeline
=====================================================
1. Loads cleaned & deduplicated Addis Ababa POIs from ai-ml/data/cleaned_addis_pois.json.
2. Generates 1,024-dimensional dense vector embeddings using FastEmbed (Qdrant/constella-nano).
3. Connects to Supabase PostgreSQL (pgvector + PostGIS).
4. Inserts records into `rag_documents` with source_type = 'poi_place' using ON CONFLICT upsert.
5. Verifies live vector records in Supabase.
"""

import os
import sys
import json
import time
import psycopg2
from psycopg2.extras import execute_values
from typing import Dict, Any, List

def get_env_config() -> Dict[str, Any]:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, '..', '..', '..'))
    env_path = os.path.join(root_dir, 'backend', '.env')

    config = {
        'DATABASE_URL': os.environ.get('DATABASE_URL'),
        'EMBEDDING_MODEL': os.environ.get('EMBEDDING_MODEL', 'Qdrant/constella-nano'),
        'EMBEDDING_DIMENSION': int(os.environ.get('EMBEDDING_DIMENSION', '1024')),
    }

    if os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if line.startswith('DATABASE_URL='):
                    config['DATABASE_URL'] = line.split('=', 1)[1].strip().strip('"').strip("'")
                elif line.startswith('EMBEDDING_MODEL='):
                    config['EMBEDDING_MODEL'] = line.split('=', 1)[1].strip().strip('"').strip("'")
                elif line.startswith('EMBEDDING_DIMENSION='):
                    try:
                        config['EMBEDDING_DIMENSION'] = int(line.split('=', 1)[1].strip().strip('"').strip("'"))
                    except ValueError:
                        pass

    if not config['DATABASE_URL']:
        raise ValueError("DATABASE_URL not found in backend/.env or environment.")

    return config

def run_poi_embedding_and_push():
    config = get_env_config()
    db_url = config['DATABASE_URL']
    target_dim = config['EMBEDDING_DIMENSION']

    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, '..', '..', '..'))
    json_path = os.path.join(root_dir, 'ai-ml', 'data', 'cleaned_addis_pois.json')

    print("================================================================")
    print(" GuzoMate POI Dense Vector Embedding & Supabase Ingestion")
    print("================================================================")
    print(f" Target Model Dimension: {target_dim}")
    print(f" Input Data: {json_path}")

    if not os.path.exists(json_path):
        print(f"[!] Error: Cleaned data file not found at {json_path}")
        print("    Please run ai-ml/src/embeddings/clean_and_merge_pois.py first.")
        sys.exit(1)

    with open(json_path, 'r', encoding='utf-8') as f:
        documents: List[Dict[str, Any]] = json.load(f)

    total_docs = len(documents)
    print(f"[*] Loaded {total_docs} cleaned and deduplicated POI documents.")

    if total_docs == 0:
        print("[!] No documents to embed.")
        sys.exit(0)

    # 1. Initialize FastEmbed 1024-dim model engine
    from fastembed import TextEmbedding
    supported = [m['model'] for m in TextEmbedding.list_supported_models()]
    chosen_model = "Qdrant/constella-nano"
    if chosen_model not in supported:
        chosen_model = supported[0]

    print(f"[*] Initializing FastEmbed engine ({chosen_model}) for 1024-dim vector generation...")
    embedder = TextEmbedding(model_name=chosen_model)
    print(f"[*] Model loaded successfully.")

    # 2. Generate embeddings in batches
    batch_size = 128
    texts = [doc['content'] for doc in documents]
    embeddings: List[List[float]] = []

    print(f"[*] Generating embeddings for {total_docs} POIs in batches of {batch_size}...")
    start_time = time.time()

    for i in range(0, total_docs, batch_size):
        batch_texts = texts[i:i + batch_size]
        batch_results = list(embedder.embed(batch_texts))
        for emb in batch_results:
            embeddings.append(emb.tolist())

        elapsed = time.time() - start_time
        curr_count = min(i + batch_size, total_docs)
        pct = (curr_count / total_docs) * 100
        rate = curr_count / elapsed if elapsed > 0 else 0
        print(f"    Progress: {curr_count}/{total_docs} ({pct:.1f}%) | {rate:.1f} POIs/sec | Elapsed: {elapsed:.1f}s")

    dim_verified = len(embeddings[0])
    print(f"[*] All embeddings calculated. Vector dimension: {dim_verified}")
    if dim_verified != target_dim:
        print(f"[!] Warning: Dimension mismatch: got {dim_verified}, expected {target_dim}")

    # 3. Connect to Supabase PostgreSQL
    print("[*] Connecting to Supabase Cloud PostgreSQL database...")
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()

    # 4. Prepare SQL Upsert
    insert_sql = """
        INSERT INTO rag_documents (source_type, source_id, language, title, content, metadata, embedding)
        VALUES %s
        ON CONFLICT (source_type, source_id) DO UPDATE SET
            language = EXCLUDED.language,
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata,
            embedding = EXCLUDED.embedding,
            updated_at = NOW();
    """

    records = []
    for idx, doc in enumerate(documents):
        vec_str = f"[{','.join(str(x) for x in embeddings[idx])}]"
        meta = json.dumps(doc['metadata'], ensure_ascii=False) if isinstance(doc['metadata'], dict) else doc['metadata']
        records.append((
            doc['source_type'],
            str(doc['source_id']),
            doc.get('language', 'en'),
            doc['title'],
            doc['content'],
            meta,
            vec_str
        ))

    # 5. Insert in transaction batches
    insert_batch_size = 200
    total_records = len(records)
    print(f"[*] Inserting {total_records} POI records into `rag_documents`...")
    insert_start = time.time()

    for i in range(0, total_records, insert_batch_size):
        chunk = records[i:i + insert_batch_size]
        execute_values(cursor, insert_sql, chunk, template="(%s, %s, %s, %s, %s, %s, %s::vector)")
        conn.commit()
        done = min(i + insert_batch_size, total_records)
        print(f"    Pushed {done}/{total_records} records to Supabase...")

    insert_elapsed = time.time() - insert_start
    print(f"[*] Push completed in {insert_elapsed:.1f}s.")

    # 6. Verify row count and sample query
    cursor.execute("SELECT count(*) FROM rag_documents WHERE source_type = 'poi_place';")
    poi_count = cursor.fetchone()[0]

    cursor.execute("SELECT count(*) FROM rag_documents;")
    total_count = cursor.fetchone()[0]

    cursor.execute("""
        SELECT title, language, source_id
        FROM rag_documents
        WHERE source_type = 'poi_place'
        ORDER BY created_at DESC
        LIMIT 3;
    """)
    samples = cursor.fetchall()

    cursor.close()
    conn.close()

    print("\n================================================================")
    print(" INGESTION SUCCESSFUL")
    print(f" Live POI Records in rag_documents: {poi_count}")
    print(f" Total Records in rag_documents:     {total_count}")
    print(" Sample POI records:")
    for s in samples:
        print(f"   - [{s[1]}] {s[0]} (ID: {s[2]})")
    print("================================================================")

if __name__ == '__main__':
    run_poi_embedding_and_push()
