"""
GuzoMate GTFS Transit & Knowledge Ingestion Pipeline
Embeds related GTFS transit data and pushes 1,024-dim vectors to Supabase.
"""

import os
import csv
import json
import time
import psycopg2
from psycopg2.extras import execute_values

def get_env_config():
    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, '..', '..', '..'))
    env_path = os.path.join(root_dir, 'backend', '.env')

    config = {
        'DATABASE_URL': os.environ.get('DATABASE_URL'),
        'EMBEDDING_MODEL': os.environ.get('EMBEDDING_MODEL', 'BAAI/bge-m3'),
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

def parse_gtfs_dataset(bus_dir: str):
    print(f"[*] Parsing GTFS transit relations from: {bus_dir}")

    # 1. Routes (routes.txt)
    routes = {}
    with open(os.path.join(bus_dir, 'routes.txt'), 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            r_id = row['route_id']
            routes[r_id] = {
                'id': r_id,
                'short_name': row.get('route_short_name', ''),
                'long_name': row.get('route_long_name', ''),
                'desc': row.get('route_desc', ''),
            }

    # 2. Trips (trips.txt: maps trip_id -> route_id)
    trip_to_route = {}
    with open(os.path.join(bus_dir, 'trips.txt'), 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            trip_to_route[row['trip_id']] = row['route_id']

    # 3. Frequencies (frequencies.txt: hours & headway)
    frequencies = {}
    with open(os.path.join(bus_dir, 'frequencies.txt'), 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            t_id = row['trip_id']
            frequencies[t_id] = {
                'start_time': row.get('start_time', '05:00:00'),
                'end_time': row.get('end_time', '22:00:00'),
                'headway_secs': int(row.get('headway_secs', 1800)),
            }

    # 4. Stops (stops.txt)
    stops = {}
    with open(os.path.join(bus_dir, 'stops.txt'), 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            s_id = row['stop_id']
            stops[s_id] = {
                'id': s_id,
                'name': row.get('stop_name', ''),
                'lat': float(row.get('stop_lat', 0)),
                'lon': float(row.get('stop_lon', 0)),
            }

    # 5. Stop Times (stop_times.txt: correlates route sequence and stop routes)
    stop_to_routes = {}   # stop_id -> set of route_ids
    route_stop_seq = {}   # route_id -> list of stop_ids in sequence
    with open(os.path.join(bus_dir, 'stop_times.txt'), 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            t_id = row['trip_id']
            s_id = row['stop_id']
            r_id = trip_to_route.get(t_id)

            if r_id:
                if s_id not in stop_to_routes:
                    stop_to_routes[s_id] = set()
                stop_to_routes[s_id].add(r_id)

                if r_id not in route_stop_seq:
                    route_stop_seq[r_id] = []
                if s_id not in route_stop_seq[r_id]:
                    route_stop_seq[r_id].append(s_id)

    print(f"[*] Correlated {len(routes)} routes with {len(stops)} stops across Addis Ababa.")
    return routes, stops, frequencies, stop_to_routes, route_stop_seq

def build_knowledge_documents(routes, stops, frequencies, stop_to_routes, route_stop_seq):
    print("[*] Generating unified high-context RAG documents with related transit fields...")
    documents = []

    # 1. Bus Routes (connecting route -> stops sequence -> hours -> frequencies)
    for r_id, r in routes.items():
        stop_ids = route_stop_seq.get(r_id, [])
        stop_names = [stops[s]['name'] for s in stop_ids if s in stops]

        headway_min = 30
        operating_hours = "05:00 - 22:00"
        if r_id in frequencies:
            freq = frequencies[r_id]
            headway_min = freq['headway_secs'] // 60
            operating_hours = f"{freq['start_time'][:5]} - {freq['end_time'][:5]}"

        if len(stop_names) > 6:
            stops_preview = f"{stop_names[0]} -> {stop_names[len(stop_names)//2]} -> {stop_names[-1]} (serving {len(stop_names)} stops in total)"
        elif len(stop_names) > 0:
            stops_preview = " -> ".join(stop_names)
        else:
            stops_preview = "Central transit stops"

        title = f"Bus Line {r['short_name']}: {r['long_name']}".strip(": ")
        content = (
            f"Addis Ababa Public Bus Line {r['short_name']} ({r['long_name']}). "
            f"Major transit corridor connecting stations in Addis Ababa. "
            f"Route stops in order: {stops_preview}. Total stops served: {len(stop_names)}. "
            f"Service hours: {operating_hours} with departures every ~{headway_min} minutes. "
            f"Operated by Anbessa City Bus & Sheger Bus."
        )

        documents.append({
            'source_type': 'bus_route',
            'source_id': f"route_{r_id}",
            'language': 'en',
            'title': title,
            'content': content,
            'metadata': json.dumps({
                'route_id': r_id,
                'short_name': r['short_name'],
                'long_name': r['long_name'],
                'stops_count': len(stop_names),
                'operating_hours': operating_hours,
                'headway_mins': headway_min,
                'category': 'transit_route',
            })
        })

    # 2. Bus Stops (connecting stop -> coordinates -> all routes passing through this stop)
    for s_id, s in stops.items():
        connected_r_ids = stop_to_routes.get(s_id, set())
        connected_routes = [
            routes[rid]['short_name'] or routes[rid]['long_name']
            for rid in connected_r_ids if rid in routes
        ]

        routes_str = ", ".join(connected_routes[:8]) if connected_routes else "Local transit"
        title = f"Bus Stop: {s['name']}"
        content = (
            f"Addis Ababa bus stop \"{s['name']}\" (ID: {s_id}) located at coordinates "
            f"(Latitude: {s['lat']:.5f}, Longitude: {s['lon']:.5f}). "
            f"Served by bus lines: {routes_str}. "
            f"Provides boarding and transit connections for travelers across Addis Ababa."
        )

        documents.append({
            'source_type': 'bus_stop',
            'source_id': f"stop_{s_id}",
            'language': 'en',
            'title': title,
            'content': content,
            'metadata': json.dumps({
                'stop_id': s_id,
                'lat': s['lat'],
                'lon': s['lon'],
                'routes': connected_routes[:8],
                'category': 'bus_station',
            })
        })

    # 3. Curated Travel Guides (EN, AM, OM)
    curated = [
        {
            'source_type': 'travel_guide',
            'source_id': 'transport_aalrt_en',
            'language': 'en',
            'title': 'Addis Ababa Light Rail Transit (AALRT)',
            'content': 'The Light Rail Transit in Addis Ababa consists of two main lines: the Blue Line (North-South from Menelik II Square to Kaliti) and the Green Line (East-West from Ayat to Tor Hailoch). Both lines intersect at Stadium station. Tickets are purchased at designated station kiosks prior to boarding.',
            'metadata': json.dumps({'category': 'transport', 'region': 'Addis Ababa', 'tags': ['train', 'metro', 'transit']})
        },
        {
            'source_type': 'travel_guide',
            'source_id': 'transport_aalrt_am',
            'language': 'am',
            'title': 'የአዲስ አበባ ቀላል ባቡር ትራንዚት',
            'content': 'የአዲስ አበባ ቀላል ባቡር ሁለት መስመሮች አሉት፡ ሰማያዊ መስመር (ከዳግማዊ ምኒልክ አደባባይ እስከ ቃሊቲ) እና አረንጓዴ መስመር (ከአያት እስከ ጦር ኃይሎች)። ሁለቱም መስመሮች በስታዲየም ጣቢያ ይገናኛሉ። ትኬቶች ባቡር ከመሳፈርዎ በፊት በጣቢያዎች ባሉ የትኬት መቁረጫዎች ይገዛሉ።',
            'metadata': json.dumps({'category': 'transport', 'region': 'Addis Ababa', 'tags': ['ባቡር', 'መጓጓዣ']})
        },
        {
            'source_type': 'travel_guide',
            'source_id': 'transport_aalrt_om',
            'language': 'om',
            'title': 'Baabura Salphaa Finfinnee (AALRT)',
            'content': 'Tajaajilli baabura salphaa Finfinnee sararoota gurguddoo lama qaba: Sarara Cuquliisa (Addabaabayii Minilik Lammaffaa irraa gara Qaallittiitti) fi Sarara Magariisa (Ayaat irraa gara Xoor-Haayiloochitti). Sararoonni lamaan buufata Istaadiyeemitti wal-argu. Tikeetiin osoo baabura hin yaabbatin dura buufataalee keessaa bitama.',
            'metadata': json.dumps({'category': 'transport', 'region': 'Finfinnee', 'tags': ['baabura', 'tiraanzitii']})
        },
        {
            'source_type': 'travel_guide',
            'source_id': 'transport_minibus_en',
            'language': 'en',
            'title': 'Blue & White Minibuses and Ride-hailing',
            'content': 'Blue and white minibuses are the most common public transit mode in Addis Ababa. Fare collectors (called Woyalas) call out destinations from the door. Major transit hubs include Mexico Square, Megenagna, Piazza, and Bole. For direct private transport, ride-hailing apps like Ride and Feres are widely available and accept cash or local mobile payments.',
            'metadata': json.dumps({'category': 'transport', 'region': 'Addis Ababa', 'tags': ['taxi', 'minibus', 'ride']})
        },
        {
            'source_type': 'travel_guide',
            'source_id': 'culture_coffee_en',
            'language': 'en',
            'title': 'Traditional Ethiopian Coffee Ceremony',
            'content': 'The traditional coffee ceremony (Buna) is an essential social and cultural ritual. Fresh beans are roasted over coals, ground by hand, and brewed in a clay pot called a Jebena. Coffee is traditionally served in three successive rounds: Abol, Tona, and Bereka.',
            'metadata': json.dumps({'category': 'culture', 'region': 'Ethiopia', 'tags': ['coffee', 'culture', 'buna']})
        },
        {
            'source_type': 'travel_guide',
            'source_id': 'health_altitude_en',
            'language': 'en',
            'title': 'Altitude & Climate in Addis Ababa',
            'content': 'Addis Ababa is located at an altitude of approximately 2,355 meters (7,726 feet) above sea level. Travelers may experience mild breathlessness or dehydration during the first 48 hours. Staying well-hydrated, avoiding strenuous exertion on day one, and dressing in layers for cool evenings is strongly recommended.',
            'metadata': json.dumps({'category': 'health', 'region': 'Addis Ababa', 'tags': ['altitude', 'health', 'weather']})
        }
    ]
    documents.extend(curated)

    print(f"[*] Prepared {len(documents)} total documents to be embedded and pushed.")
    return documents

def run_embedding_and_push():
    config = get_env_config()
    env_model = config['EMBEDDING_MODEL']
    target_dim = config['EMBEDDING_DIMENSION']
    db_url = config['DATABASE_URL']

    print(f"=======================================================")
    print(f" GuzoMate Embedding & Ingestion Pipeline")
    print(f" Model specified in .env: {env_model}")
    print(f" Vector Dimension: {target_dim}")
    print(f" Database: Supabase PostgreSQL (PostGIS + pgvector)")
    print(f"=======================================================")

    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, '..', '..', '..'))
    bus_dir = os.path.join(root_dir, 'et-addisababa-bus')

    # 1. Parse & synthesize
    routes, stops, frequencies, stop_to_routes, route_stop_seq = parse_gtfs_dataset(bus_dir)
    documents = build_knowledge_documents(routes, stops, frequencies, stop_to_routes, route_stop_seq)

    # 2. Initialize 1024-dimensional model
    from fastembed import TextEmbedding
    supported = [m['model'] for m in TextEmbedding.list_supported_models()]

    if env_model in supported:
        chosen_model = env_model
    else:
        # Resolving to high-performance 1024-dimensional model
        chosen_model = "Qdrant/constella-nano"
        print(f"[*] FastEmbed preset: Loading 1024-dimensional model engine ({chosen_model})...")

    model = TextEmbedding(model_name=chosen_model)
    print(f"[*] FastEmbed model '{chosen_model}' ready (Dimension: {target_dim}).")

    # 3. Generate embeddings
    texts = [doc['content'] for doc in documents]
    batch_size = 64
    total = len(texts)
    print(f"[*] Generating {total} vector embeddings in batches of {batch_size}...")

    embeddings = []
    start_time = time.time()
    for i in range(0, total, batch_size):
        batch = texts[i:i + batch_size]
        batch_embs = list(model.embed(batch))
        embeddings.extend([emb.tolist() for emb in batch_embs])
        elapsed = time.time() - start_time
        pct = (min(i + batch_size, total) / total) * 100
        print(f"    Progress: {min(i + batch_size, total)}/{total} ({pct:.1f}%) in {elapsed:.1f}s")

    print(f"[*] All {len(embeddings)} vectors computed with dimension {len(embeddings[0])}.")

    # 4. Connect to Supabase
    print("[*] Connecting to Supabase cloud database...")
    conn = psycopg2.connect(db_url)
    cursor = conn.cursor()

    # 5. Clean prior records for clean idempotent run
    print("[*] Refreshing transit records in rag_documents...")
    cursor.execute("DELETE FROM rag_documents WHERE source_type IN ('bus_route', 'bus_stop', 'travel_guide');")
    conn.commit()

    # 6. Insert into rag_documents in batches with upsert (ON CONFLICT)
    print(f"[*] Pushing {len(documents)} embedded records into Supabase rag_documents...")
    insert_sql = """
        INSERT INTO rag_documents (source_type, source_id, language, title, content, metadata, embedding)
        VALUES %s
        ON CONFLICT (source_type, source_id) DO UPDATE SET
            language = EXCLUDED.language,
            title = EXCLUDED.title,
            content = EXCLUDED.content,
            metadata = EXCLUDED.metadata,
            embedding = EXCLUDED.embedding,
            updated_at = NOW()
    """

    records = []
    for idx, doc in enumerate(documents):
        vec_str = f"[{','.join(str(x) for x in embeddings[idx])}]"
        records.append((
            doc['source_type'],
            doc['source_id'],
            doc['language'],
            doc['title'],
            doc['content'],
            doc['metadata'],
            vec_str
        ))

    insert_batch_size = 100
    for i in range(0, len(records), insert_batch_size):
        batch_records = records[i:i + insert_batch_size]
        execute_values(cursor, insert_sql, batch_records, template="(%s, %s, %s, %s, %s, %s, %s::vector)")
        conn.commit()
        print(f"    Pushed {min(i + insert_batch_size, len(records))}/{len(records)} records to Supabase...")

    # 7. Verification
    cursor.execute("SELECT count(*) FROM rag_documents;")
    final_count = cursor.fetchone()[0]
    cursor.close()
    conn.close()

    print(f"\n=======================================================")
    print(f" SUCCESS: Ingested & Embedded into Supabase!")
    print(f" Total records now live in rag_documents: {final_count}")
    print(f"=======================================================")

if __name__ == '__main__':
    run_embedding_and_push()
