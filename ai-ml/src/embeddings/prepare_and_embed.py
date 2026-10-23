"""
GuzoMate GTFS Transit & Curated Travel Knowledge Embedding Pipeline
Loads GTFS relations (routes, trips, stops, stop_times, frequencies),
synthesizes high-context documents, computes 1024-dim embeddings via fastembed,
and outputs JSON for Supabase ingestion.
"""

import os
import csv
import json
import time

def parse_gtfs_data(bus_dir: str):
    print(f"[1/4] Parsing GTFS transit relations from: {bus_dir}")

    # 1. Routes
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

    # 2. Trips (mapping trip_id -> route_id)
    trip_to_route = {}
    trip_headsigns = {}
    with open(os.path.join(bus_dir, 'trips.txt'), 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            t_id = row['trip_id']
            r_id = row['route_id']
            trip_to_route[t_id] = r_id
            trip_headsigns[t_id] = row.get('trip_headsign', '')

    # 3. Frequencies (mapping trip_id -> headway & hours)
    frequencies = {}
    with open(os.path.join(bus_dir, 'frequencies.txt'), 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            t_id = row['trip_id']
            frequencies[t_id] = {
                'start_time': row.get('start_time', '05:00:00'),
                'end_time': row.get('end_time', '22:00:00'),
                'headway_secs': int(row.get('headway_secs', 1800)),
            }

    # 4. Stops
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

    # 5. Stop Times (mapping route -> sequence of stops, and stop -> routes)
    stop_to_routes = {}   # stop_id -> set of route_ids
    route_stop_seq = {}   # route_id -> list of stop_ids in order
    with open(os.path.join(bus_dir, 'stop_times.txt'), 'r', encoding='utf-8') as f:
        for row in csv.DictReader(f):
            t_id = row['trip_id']
            s_id = row['stop_id']
            seq = int(row.get('stop_sequence', 0))
            r_id = trip_to_route.get(t_id)

            if r_id:
                if s_id not in stop_to_routes:
                    stop_to_routes[s_id] = set()
                stop_to_routes[s_id].add(r_id)

                if r_id not in route_stop_seq:
                    route_stop_seq[r_id] = []
                if s_id not in route_stop_seq[r_id]:
                    route_stop_seq[r_id].append(s_id)

    print(f"Loaded {len(routes)} routes, {len(stops)} stops, across transit networks.")
    return routes, stops, trip_to_route, frequencies, stop_to_routes, route_stop_seq

def build_documents(routes, stops, frequencies, stop_to_routes, route_stop_seq):
    print("[2/4] Synthesizing high-context RAG knowledge documents...")
    documents = []

    # A. Bus Routes (199 routes)
    for r_id, r in routes.items():
        stop_ids = route_stop_seq.get(r_id, [])
        stop_names = [stops[s]['name'] for s in stop_ids if s in stops]

        # Determine operating hours from frequencies
        headway_min = 30
        operating_hours = "05:00 - 22:00"
        if r_id in frequencies:
            freq = frequencies[r_id]
            headway_min = freq['headway_secs'] // 60
            operating_hours = f"{freq['start_time'][:5]} - {freq['end_time'][:5]}"

        # Key stops preview
        if len(stop_names) > 6:
            key_stops = f"{stop_names[0]} -> {stop_names[len(stop_names)//2]} -> {stop_names[-1]} (plus {len(stop_names)-3} intermediate stops)"
        elif len(stop_names) > 0:
            key_stops = " -> ".join(stop_names)
        else:
            key_stops = "Central transit stops"

        title = f"Bus Line {r['short_name']}: {r['long_name']}".strip(": ")
        content = (
            f"Addis Ababa Public Bus Line {r['short_name']} ({r['long_name']}). "
            f"Transit corridor connecting key destinations. Key stops along the route: {key_stops}. "
            f"Total stops on line: {len(stop_names)}. Operating hours: {operating_hours} "
            f"with departures approximately every {headway_min} minutes. Serves Anbessa/Sheger City Bus."
        )

        documents.append({
            'source_type': 'bus_route',
            'source_id': f"route_{r_id}",
            'language': 'en',
            'title': title,
            'content': content,
            'metadata': {
                'route_id': r_id,
                'short_name': r['short_name'],
                'long_name': r['long_name'],
                'stops_count': len(stop_names),
                'operating_hours': operating_hours,
                'category': 'transit_route',
            }
        })

    # B. Bus Stops (1,355 stops)
    for s_id, s in stops.items():
        connected_r_ids = stop_to_routes.get(s_id, set())
        connected_routes = [
            routes[rid]['short_name'] or routes[rid]['long_name']
            for rid in connected_r_ids if rid in routes
        ]

        routes_str = ", ".join(connected_routes[:10]) if connected_routes else "Local feeder line"
        title = f"Bus Stop: {s['name']}"
        content = (
            f"Addis Ababa bus stop \"{s['name']}\" (ID: {s_id}) located at coordinates "
            f"(Latitude: {s['lat']:.5f}, Longitude: {s['lon']:.5f}). "
            f"Served by bus routes: {routes_str}. "
            f"Provides boarding and transit access for passengers in Addis Ababa."
        )

        documents.append({
            'source_type': 'bus_stop',
            'source_id': f"stop_{s_id}",
            'language': 'en',
            'title': title,
            'content': content,
            'metadata': {
                'stop_id': s_id,
                'lat': s['lat'],
                'lon': s['lon'],
                'routes': connected_routes[:10],
                'category': 'bus_station',
            }
        })

    # C. Curated Multilingual Knowledge Base
    curated = [
        {
            'source_type': 'travel_guide',
            'source_id': 'transport_aalrt_en',
            'language': 'en',
            'title': 'Addis Ababa Light Rail Transit (AALRT)',
            'content': 'The Light Rail Transit in Addis Ababa consists of two main lines: the Blue Line (North-South from Menelik II Square to Kaliti) and the Green Line (East-West from Ayat to Tor Hailoch). Both lines intersect at Stadium station. Tickets are purchased at designated station kiosks prior to boarding.',
            'metadata': {'category': 'transport', 'region': 'Addis Ababa', 'tags': ['train', 'metro', 'transit']}
        },
        {
            'source_type': 'travel_guide',
            'source_id': 'transport_aalrt_am',
            'language': 'am',
            'title': 'የአዲስ አበባ ቀላል ባቡር ትራንዚት',
            'content': 'የአዲስ አበባ ቀላል ባቡር ሁለት መስመሮች አሉት፡ ሰማያዊ መስመር (ከዳግማዊ ምኒልክ አደባባይ እስከ ቃሊቲ) እና አረንጓዴ መስመር (ከአያት እስከ ጦር ኃይሎች)። ሁለቱም መስመሮች በስታዲየም ጣቢያ ይገናኛሉ። ትኬቶች ባቡር ከመሳፈርዎ በፊት በጣቢያዎች ባሉ የትኬት መቁረጫዎች ይገዛሉ።',
            'metadata': {'category': 'transport', 'region': 'Addis Ababa', 'tags': ['ባቡር', 'መጓጓዣ']}
        },
        {
            'source_type': 'travel_guide',
            'source_id': 'transport_aalrt_om',
            'language': 'om',
            'title': 'Baabura Salphaa Finfinnee (AALRT)',
            'content': 'Tajaajilli baabura salphaa Finfinnee sararoota gurguddoo lama qaba: Sarara Cuquliisa (Addabaabayii Minilik Lammaffaa irraa gara Qaallittiitti) fi Sarara Magariisa (Ayaat irraa gara Xoor-Haayiloochitti). Sararoonni lamaan buufata Istaadiyeemitti wal-argu. Tikeetiin osoo baabura hin yaabbatin dura buufataalee keessaa bitama.',
            'metadata': {'category': 'transport', 'region': 'Finfinnee', 'tags': ['baabura', 'tiraanzitii']}
        },
        {
            'source_type': 'travel_guide',
            'source_id': 'transport_minibus_en',
            'language': 'en',
            'title': 'Blue & White Minibuses and Ride-hailing',
            'content': 'Blue and white minibuses are the most common public transit mode in Addis Ababa. Fare collectors (called Woyalas) call out destinations from the door. Major transit hubs include Mexico Square, Megenagna, Piazza, and Bole. For direct private transport, ride-hailing apps like Ride and Feres are widely available and accept cash or local mobile payments.',
            'metadata': {'category': 'transport', 'region': 'Addis Ababa', 'tags': ['taxi', 'minibus', 'ride']}
        },
        {
            'source_type': 'travel_guide',
            'source_id': 'culture_coffee_en',
            'language': 'en',
            'title': 'Traditional Ethiopian Coffee Ceremony',
            'content': 'The traditional coffee ceremony (Buna) is an essential social and cultural ritual. Fresh beans are roasted over coals, ground by hand, and brewed in a clay pot called a Jebena. Coffee is traditionally served in three successive rounds: Abol, Tona, and Bereka.',
            'metadata': {'category': 'culture', 'region': 'Ethiopia', 'tags': ['coffee', 'culture', 'buna']}
        },
        {
            'source_type': 'travel_guide',
            'source_id': 'health_altitude_en',
            'language': 'en',
            'title': 'Altitude & Climate in Addis Ababa',
            'content': 'Addis Ababa is located at an altitude of approximately 2,355 meters (7,726 feet) above sea level. Travelers may experience mild breathlessness or dehydration during the first 48 hours. Staying well-hydrated, avoiding strenuous exertion on day one, and dressing in layers for cool evenings is strongly recommended.',
            'metadata': {'category': 'health', 'region': 'Addis Ababa', 'tags': ['altitude', 'health', 'weather']}
        }
    ]
    documents.extend(curated)

    print(f"Synthesized {len(documents)} total documents to be embedded.")
    return documents

def generate_embeddings_and_save(documents, output_file: str):
    print("[3/4] Initializing BAAI/bge-large-en-v1.5 embedding model (1024 dimensions)...")
    from fastembed import TextEmbedding

    model = TextEmbedding(model_name="BAAI/bge-large-en-v1.5")
    print("Model initialized successfully!")

    texts = [doc['content'] for doc in documents]
    batch_size = 64
    total = len(texts)
    print(f"Generating embeddings for {total} documents in batches of {batch_size}...")

    start_time = time.time()
    embeddings_list = []
    for i in range(0, total, batch_size):
        batch = texts[i:i + batch_size]
        batch_embeddings = list(model.embed(batch))
        embeddings_list.extend([emb.tolist() for emb in batch_embeddings])
        if (i // batch_size) % 5 == 0 or i + batch_size >= total:
            elapsed = time.time() - start_time
            print(f"  Embedded {min(i + batch_size, total)}/{total} documents ({elapsed:.1f}s)")

    print(f"Generated {len(embeddings_list)} embeddings! Attaching to documents...")

    for idx, doc in enumerate(documents):
        doc['embedding'] = embeddings_list[idx]

    os.makedirs(os.path.dirname(output_file), exist_ok=True)
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(documents, f, ensure_ascii=False)

    print(f"[4/4] Saved embedded dataset to: {output_file} ({os.path.getsize(output_file) / (1024*1024):.2f} MB)")

if __name__ == '__main__':
    root_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))
    bus_dir = os.path.join(root_dir, 'et-addisababa-bus')
    out_file = os.path.join(root_dir, 'ai-ml', 'datasets', 'embedded_transit_knowledge.json')

    routes, stops, trip_to_route, frequencies, stop_to_routes, route_stop_seq = parse_gtfs_data(bus_dir)
    docs = build_documents(routes, stops, frequencies, stop_to_routes, route_stop_seq)
    generate_embeddings_and_save(docs, out_file)
