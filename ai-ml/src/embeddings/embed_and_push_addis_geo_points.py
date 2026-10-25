#!/usr/bin/env python3
"""
GuzoMate POI Ingestion Engine: addis_geo_points
==============================================
Pushes cleaned, merged, and deduplicated POIs directly into the `addis_geo_points` table:
1. Loads 6,450 cleaned & deduplicated POIs from `ai-ml/data/cleaned_addis_pois.json`.
2. Connects to Supabase PostgreSQL (`addis_geo_points` table).
3. Deduplicates against existing `addis_geo_points` rows:
   - Matches within 35m spatial radius and normalized name.
   - Updates existing records with richer attributes (phone, hours, Amharic name, 1024-dim embedding).
   - Inserts brand new records with sequential IDs starting from MAX(id) + 1.
4. Computes 1,024-dimensional dense vector embeddings using FastEmbed (Qdrant/constella-nano).
5. Batches updates and inserts with transaction commits.
6. Verifies live counts and category coverage.
"""

import os
import sys
import json
import time
import math
import re
import psycopg2
from psycopg2.extras import execute_values
from typing import Dict, Any, List, Tuple

def get_db_url() -> str:
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, '..', '..', '..'))
    env_path = os.path.join(root_dir, 'backend', '.env')

    db_url = os.environ.get('DATABASE_URL')
    if not db_url and os.path.exists(env_path):
        with open(env_path, 'r', encoding='utf-8') as f:
            for line in f:
                if line.strip().startswith('DATABASE_URL='):
                    db_url = line.split('=', 1)[1].strip().strip('"').strip("'")
                    break

    if not db_url:
        raise ValueError("DATABASE_URL not found in backend/.env or environment.")
    return db_url

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    R = 6371000
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lon2 - lon1)
    a = math.sin(dp / 2.0) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2.0) ** 2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

def normalize_name(name: str) -> str:
    if not name:
        return ''
    cleaned = re.sub(r'[\(\)\[\]\{\}\-\_\,\.\:\;\"\'\/\\]+', ' ', name).lower().strip()
    noise = {'restaurant', 'cafe', 'hotel', 'hospital', 'clinic', 'pharmacy', 'bar', 'branch', 'plc', 'ltd'}
    tokens = [t for t in cleaned.split() if t not in noise]
    return ' '.join(tokens) if tokens else cleaned

def format_other_tags(item: Dict[str, Any]) -> str:
    meta = item.get('metadata') or {}
    name = meta.get('name') or item.get('name') or ''
    name_en = meta.get('name_en') or item.get('name_en') or ''
    name_am = meta.get('name_am') or item.get('name_am') or ''
    cat = meta.get('category') or item.get('category') or 'place'
    subcity = meta.get('subcity') or item.get('subcity') or ''
    street = meta.get('street') or item.get('street') or ''
    address = meta.get('address') or item.get('address') or ''
    phone = meta.get('phone') or item.get('phone') or ''
    hours = meta.get('opening_hours') or item.get('opening_hours') or ''
    osm_id = meta.get('osm_id') or item.get('source_id') or ''
    source = meta.get('source_dataset') or 'osm'

    def clean_val(v: str) -> str:
        return v.replace('"', '').replace('=>', '->').strip()

    pairs = []
    if name:
        pairs.append(f'"name"=>"{clean_val(name)}"')
    if name_en and name_en != name:
        pairs.append(f'"name:en"=>"{clean_val(name_en)}"')
    if name_am:
        pairs.append(f'"name:am"=>"{clean_val(name_am)}"')
    if cat:
        pairs.append(f'"amenity"=>"{clean_val(cat)}"')
    if cat in ('hospital', 'clinic', 'pharmacy', 'doctors', 'dentist'):
        pairs.append(f'"healthcare"=>"{clean_val(cat)}"')
    elif cat in ('hotel', 'guest_house', 'hostel', 'motel', 'attraction', 'museum'):
        pairs.append(f'"tourism"=>"{clean_val(cat)}"')
    elif cat in ('supermarket', 'mall', 'bakery', 'convenience', 'clothes'):
        pairs.append(f'"shop"=>"{clean_val(cat)}"')

    if phone:
        pairs.append(f'"phone"=>"{clean_val(phone)}"')
        pairs.append(f'"contact:phone"=>"{clean_val(phone)}"')
    if hours:
        pairs.append(f'"opening_hours"=>"{clean_val(hours)}"')
    if street:
        pairs.append(f'"addr:street"=>"{clean_val(street)}"')
    if subcity:
        pairs.append(f'"addr:subcity"=>"{clean_val(subcity)}"')
    if address:
        pairs.append(f'"addr:description"=>"{clean_val(address)}"')
    pairs.append('"addr:city"=>"Addis Ababa"')
    if osm_id:
        pairs.append(f'"osm_id"=>"{clean_val(str(osm_id))}"')
    pairs.append(f'"source"=>"{clean_val(source)}"')

    return ','.join(pairs)

def format_content(item: Dict[str, Any]) -> str:
    meta = item.get('metadata') or {}
    name = meta.get('name') or item.get('name') or ''
    name_en = meta.get('name_en') or item.get('name_en') or ''
    name_am = meta.get('name_am') or item.get('name_am') or ''
    cat = (meta.get('category') or item.get('category') or 'place').lower()
    subcity = meta.get('subcity') or item.get('subcity') or ''
    street = meta.get('street') or item.get('street') or ''
    address = meta.get('address') or item.get('address') or ''
    phone = meta.get('phone') or item.get('phone') or ''
    hours = meta.get('opening_hours') or item.get('opening_hours') or ''

    lines = [f"Place name: {name}"]
    if name_en and name_en != name:
        lines.append(f"English name: {name_en}")
    if name_am:
        lines.append(f"Amharic name: {name_am}")
    lines.append(f"Amenity: {cat}")

    if cat in ('hospital', 'clinic', 'pharmacy', 'doctors', 'dentist'):
        lines.append(f"Healthcare: {cat}")
    elif cat in ('hotel', 'guest_house', 'hostel', 'motel', 'attraction', 'museum'):
        lines.append(f"Tourism: {cat}")
    elif cat in ('supermarket', 'mall', 'bakery', 'convenience', 'clothes'):
        lines.append(f"Shop: {cat}")

    if street:
        lines.append(f"Street: {street}")
    if subcity:
        lines.append(f"Subcity: {subcity}")
    if address and address != subcity and address != street:
        lines.append(f"Address: {address}")
    if phone:
        lines.append(f"Contact phone: {phone}")
    if hours:
        lines.append(f"Opening hours: {hours}")

    return "\n".join(lines)

def run_pipeline():
    print("================================================================")
    print(" GuzoMate Addis Geo Points POI Ingestion & Vector Pipeline")
    print(" Target Table: addis_geo_points")
    print(" Target Embedding Dimension: 1,024 (float8[])")
    print("================================================================")

    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, '..', '..', '..'))
    json_path = os.path.join(root_dir, 'ai-ml', 'data', 'cleaned_addis_pois.json')

    if not os.path.exists(json_path):
        print(f"[!] Error: {json_path} not found.")
        sys.exit(1)

    with open(json_path, 'r', encoding='utf-8') as f:
        clean_pois = json.load(f)

    total_clean = len(clean_pois)
    print(f"[*] Loaded {total_clean} cleaned & deduplicated POIs from JSON.")

    db_url = get_db_url()
    conn = psycopg2.connect(db_url)
    cur = conn.cursor()

    # 1. Inspect existing addis_geo_points records
    cur.execute("SELECT max(id) FROM addis_geo_points;")
    max_id_row = cur.fetchone()
    current_max_id = max_id_row[0] if max_id_row and max_id_row[0] else 0
    print(f"[*] Current MAX(id) in addis_geo_points: {current_max_id}")

    print("[*] Loading existing addis_geo_points for spatial & name deduplication...")
    cur.execute("""
        SELECT id, latitude, longtiude, content, other_tags 
        FROM addis_geo_points 
        WHERE latitude IS NOT NULL AND longtiude IS NOT NULL;
    """)
    existing_rows = cur.fetchall()
    print(f"    Loaded {len(existing_rows)} existing rows from addis_geo_points.")

    # 2. Build spatial grid index of existing records (~1km bins)
    grid: Dict[Tuple[int, int], List[Dict[str, Any]]] = {}
    for r in existing_rows:
        r_id, r_lat, r_lon, r_content, r_tags = r
        cell = (int(round(r_lat * 100)), int(round(r_lon * 100)))
        if cell not in grid:
            grid[cell] = []

        # Extract name from other_tags or content
        name = ''
        if r_tags:
            m = re.search(r'"name"=>"([^"]+)"', r_tags)
            if m:
                name = m.group(1)
        if not name and r_content:
            m = re.search(r'Place name:\s*([^\n]+)', r_content)
            if m:
                name = m.group(1)

        grid[cell].append({
            'id': r_id,
            'lat': r_lat,
            'lon': r_lon,
            'name': name,
            'norm_name': normalize_name(name)
        })

    # 3. Deduplicate clean POIs against existing addis_geo_points
    print("[*] Matching clean POIs against existing addis_geo_points records...")
    to_update: List[Tuple[int, Dict[str, Any]]] = []  # (existing_id, poi_data)
    to_insert: List[Dict[str, Any]] = []

    for poi in clean_pois:
        meta = poi.get('metadata') or {}
        p_lat = float(meta.get('lat') or poi.get('lat', 0))
        p_lon = float(meta.get('lon') or poi.get('lon', 0))
        p_name = normalize_name(meta.get('name') or poi.get('title') or '')
        p_am = (meta.get('name_am') or '').strip()

        cell_lat = int(round(p_lat * 100))
        cell_lon = int(round(p_lon * 100))

        matched_id: Optional[int] = None
        for dlat in (-1, 0, 1):
            for dlon in (-1, 0, 1):
                neighbor = (cell_lat + dlat, cell_lon + dlon)
                for cand in grid.get(neighbor, []):
                    # Fast bounding box pre-filter (~50m)
                    if abs(cand['lat'] - p_lat) > 0.0005 or abs(cand['lon'] - p_lon) > 0.0005:
                        continue

                    dist = haversine_distance_meters(p_lat, p_lon, cand['lat'], cand['lon'])
                    if dist <= 35.0:
                        c_name = cand['norm_name']
                        if p_name and c_name and (p_name == c_name or (len(p_name) > 3 and p_name in c_name) or (len(c_name) > 3 and c_name in p_name)):
                            matched_id = cand['id']
                            break
                if matched_id:
                    break
            if matched_id:
                break

        if matched_id:
            to_update.append((matched_id, poi))
        else:
            to_insert.append(poi)

    print(f"    Deduplication Results:")
    print(f"      Matched existing records to update: {len(to_update)}")
    print(f"      Brand new POIs to insert:           {len(to_insert)}")

    # 4. Generate 1,024-dimensional dense vector embeddings with FastEmbed
    print("\n[*] Initializing FastEmbed Qdrant/constella-nano (1024-dim)...")
    from fastembed import TextEmbedding
    model = TextEmbedding(model_name="Qdrant/constella-nano")
    print("[*] Embedding model loaded successfully.")

    # Prepare embedding text for all items
    all_items = [poi for _, poi in to_update] + to_insert
    embedding_texts = []
    for item in all_items:
        meta = item.get('metadata') or {}
        name = meta.get('name') or item.get('title') or ''
        name_am = meta.get('name_am') or ''
        cat = meta.get('category') or 'place'
        subcity = meta.get('subcity') or ''
        address = meta.get('address') or ''
        txt = f"{name} {name_am} {cat} {subcity} {address}".strip()
        embedding_texts.append(txt)

    batch_size = 128
    total_to_embed = len(embedding_texts)
    print(f"[*] Generating vector embeddings for {total_to_embed} places...")
    start_time = time.time()
    embeddings = []

    for i in range(0, total_to_embed, batch_size):
        batch = embedding_texts[i:i + batch_size]
        res = list(model.embed(batch))
        for emb in res:
            embeddings.append(emb.tolist())
        elapsed = time.time() - start_time
        curr = min(i + batch_size, total_to_embed)
        print(f"    Embedded {curr}/{total_to_embed} ({curr/total_to_embed*100:.1f}%) in {elapsed:.1f}s")

    print(f"[*] All {len(embeddings)} vectors computed. Dimension: {len(embeddings[0])}")

    # Split embeddings between updates and inserts
    num_updates = len(to_update)
    update_embeddings = embeddings[:num_updates]
    insert_embeddings = embeddings[num_updates:]

    # 5. Apply Updates to existing addis_geo_points
    if to_update:
        print(f"\n[*] Updating {len(to_update)} existing addis_geo_points with enriched attributes...")
        update_sql = """
            UPDATE addis_geo_points
            SET content = v.content,
                other_tags = v.other_tags,
                embedding = v.embedding::float8[]
            FROM (VALUES %s) AS v(id, content, other_tags, embedding)
            WHERE addis_geo_points.id = v.id;
        """
        update_rows = []
        for idx, (ex_id, poi) in enumerate(to_update):
            cnt = format_content(poi)
            tags = format_other_tags(poi)
            emb_str = '{' + ','.join(str(x) for x in update_embeddings[idx]) + '}'
            update_rows.append((ex_id, cnt, tags, emb_str))

        up_batch_size = 200
        for i in range(0, len(update_rows), up_batch_size):
            chunk = update_rows[i:i + up_batch_size]
            execute_values(cur, update_sql, chunk, template="(%s, %s, %s, %s)")
            conn.commit()
            print(f"    Updated {min(i + up_batch_size, len(update_rows))}/{len(update_rows)} existing records...")

    # 6. Insert Brand New POIs into addis_geo_points
    if to_insert:
        print(f"\n[*] Inserting {len(to_insert)} new POIs into addis_geo_points...")
        insert_sql = """
            INSERT INTO addis_geo_points (id, latitude, longtiude, content, other_tags, embedding)
            VALUES %s;
        """
        insert_rows = []
        next_id = current_max_id + 1

        for idx, poi in enumerate(to_insert):
            meta = poi.get('metadata') or {}
            p_lat = round(float(meta.get('lat') or poi.get('lat', 0)), 6)
            p_lon = round(float(meta.get('lon') or poi.get('lon', 0)), 6)
            cnt = format_content(poi)
            tags = format_other_tags(poi)
            emb_str = '{' + ','.join(str(x) for x in insert_embeddings[idx]) + '}'

            insert_rows.append((
                next_id,
                p_lat,
                p_lon,
                cnt,
                tags,
                emb_str
            ))
            next_id += 1

        in_batch_size = 200
        for i in range(0, len(insert_rows), in_batch_size):
            chunk = insert_rows[i:i + in_batch_size]
            execute_values(cur, insert_sql, chunk, template="(%s, %s, %s, %s, %s, %s::float8[])")
            conn.commit()
            print(f"    Inserted {min(i + in_batch_size, len(insert_rows))}/{len(insert_rows)} new records...")

    # 7. Verification & Summary
    cur.execute("SELECT count(*) FROM addis_geo_points;")
    final_count = cur.fetchone()[0]

    cur.execute("SELECT count(*) FROM addis_geo_points WHERE content ILIKE '%hospital%' OR other_tags ILIKE '%hospital%';")
    hosp_count = cur.fetchone()[0]

    cur.execute("SELECT count(*) FROM addis_geo_points WHERE content ILIKE '%pharmacy%' OR other_tags ILIKE '%pharmacy%';")
    pharm_count = cur.fetchone()[0]

    cur.execute("SELECT count(*) FROM addis_geo_points WHERE content ILIKE '%restaurant%' OR other_tags ILIKE '%restaurant%';")
    rest_count = cur.fetchone()[0]

    cur.execute("SELECT count(*) FROM addis_geo_points WHERE content ILIKE '%hotel%' OR other_tags ILIKE '%hotel%';")
    hotel_count = cur.fetchone()[0]

    cur.execute("SELECT count(*) FROM addis_geo_points WHERE content ILIKE '%bank%' OR other_tags ILIKE '%bank%';")
    bank_count = cur.fetchone()[0]

    cur.close()
    conn.close()

    print("\n================================================================")
    print(" INGESTION TO addis_geo_points SUCCESSFUL!")
    print(f" Total records in addis_geo_points: {final_count}")
    print(f" Verified Hospitals:                {hosp_count}")
    print(f" Verified Pharmacies:               {pharm_count}")
    print(f" Verified Restaurants:              {rest_count}")
    print(f" Verified Hotels:                   {hotel_count}")
    print(f" Verified Banks:                    {bank_count}")
    print("================================================================")

if __name__ == '__main__':
    run_pipeline()
