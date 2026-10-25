#!/usr/bin/env python3
"""
GuzoMate POI Cleaner & Deduplication Pipeline
=============================================
1. Ingests Dataset A: Humanitarian OpenStreetMap (HOTOSM) 35,947 features GeoJSON.
2. Ingests Dataset B: Live Overpass API for Addis Ababa POIs (Healthcare, Sustenance, Tourism, Services).
3. Cleans, standardizes, and deduplicates BOTH datasets BEFORE embedding:
   - Deduplication by normalized OSM ID (node_id / way_id).
   - Deduplication by spatial proximity (< 35m) and name matching / fuzzy containment.
   - Cleans missing names, unclassified infrastructure, and junk entries.
4. Enriches metadata (Amharic names, English names, subcity, street address, phone, opening hours).
5. Outputs clean, merged POIs to ai-ml/data/cleaned_addis_pois.json.
"""

import os
import json
import re
import math
import time
import urllib.request
import urllib.parse
from typing import List, Dict, Any, Optional, Tuple

# Bounding box for Addis Ababa metropolitan area
MIN_LAT, MAX_LAT = 8.80, 9.15
MIN_LON, MAX_LON = 38.65, 38.95

CATEGORY_MAP = {
    # Healthcare
    'hospital': 'hospital',
    'clinic': 'clinic',
    'pharmacy': 'pharmacy',
    'doctors': 'clinic',
    'dentist': 'clinic',
    'health_post': 'clinic',
    
    # Food & Drink
    'restaurant': 'restaurant',
    'cafe': 'cafe',
    'fast_food': 'restaurant',
    'bar': 'bar',
    'pub': 'bar',
    'bakery': 'bakery',
    'coffee_shop': 'cafe',
    'food_court': 'restaurant',
    
    # Accommodations & Tourism
    'hotel': 'hotel',
    'guest_house': 'hotel',
    'hostel': 'hotel',
    'motel': 'hotel',
    'apartment': 'hotel',
    'attraction': 'attraction',
    'museum': 'museum',
    
    # Commerce & Services
    'bank': 'bank',
    'atm': 'bank',
    'supermarket': 'supermarket',
    'convenience': 'supermarket',
    'mall': 'mall',
    'department_store': 'mall',
    'fuel': 'fuel_station',
    
    # Education & Civic
    'school': 'school',
    'college': 'college',
    'university': 'university',
    'embassy': 'embassy',
    'police': 'police_station',
    'place_of_worship': 'place_of_worship',
}

def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculates great-circle distance between two coordinates in meters."""
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = math.sin(delta_phi / 2.0) ** 2 + \
        math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

def normalize_name(name: str) -> str:
    """Normalizes place names for accurate deduplication comparison."""
    if not name:
        return ''
    cleaned = re.sub(r'[\(\)\[\]\{\}\-\_\,\.\:\;\"\'\/\\]+', ' ', name)
    cleaned = re.sub(r'\s+', ' ', cleaned).strip().lower()
    # Remove common category noise words
    noise = ['restaurant', 'cafe', 'hotel', 'pharmacy', 'hospital', 'clinic', 'bar', 'branch', 'plc', 'ltd']
    tokens = [t for t in cleaned.split() if t not in noise]
    return ' '.join(tokens) if tokens else cleaned

def clean_hotosm_dataset(filepath: str) -> List[Dict[str, Any]]:
    """Ingests and cleans Dataset 1: HOTOSM 35k GeoJSON."""
    print(f"[*] Reading HOTOSM GeoJSON: {filepath}...")
    if not os.path.exists(filepath):
        print(f"[!] Warning: File {filepath} not found.")
        return []

    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    raw_features = data.get('features', [])
    print(f"    Raw features loaded: {len(raw_features)}")

    cleaned: List[Dict[str, Any]] = []
    skipped_unnamed = 0
    skipped_out_of_bounds = 0
    skipped_infrastructure = 0

    for feat in raw_features:
        props = feat.get('properties') or {}
        geom = feat.get('geometry') or {}
        coords = geom.get('coordinates')
        if not coords or len(coords) < 2:
            continue

        # Extract lat/lon handling Points and Polygons
        if isinstance(coords[0], (int, float)):
            lon, lat = float(coords[0]), float(coords[1])
        elif isinstance(coords[0], list) and len(coords[0]) > 0 and isinstance(coords[0][0], (int, float)):
            lon, lat = float(coords[0][0]), float(coords[0][1])
        else:
            continue

        # Geographic boundary check for Addis Ababa
        is_addis_adm = (props.get('adm1_name') or '').lower() == 'addis ababa'
        is_addis_bbox = (MIN_LAT <= lat <= MAX_LAT and MIN_LON <= lon <= MAX_LON)
        if not (is_addis_adm or is_addis_bbox):
            skipped_out_of_bounds += 1
            continue

        # Extract names
        name = props.get('name') or props.get('name_en') or props.get('name_latin') or props.get('name_am')
        if not name or not name.strip() or len(name.strip()) < 2:
            skipped_unnamed += 1
            continue

        # Filter out generic infrastructure (crossings, poles, benches)
        raw_cat = (props.get('amenity') or props.get('shop') or props.get('tourism') or props.get('healthcare') or '').lower()
        if raw_cat in ('crossing', 'bench', 'waste_basket', 'pole', 'street_lamp'):
            skipped_infrastructure += 1
            continue

        # Standardize category
        category = CATEGORY_MAP.get(raw_cat, raw_cat if raw_cat else 'point_of_interest')

        # Normalize OSM ID
        raw_id = str(props.get('id') or '')
        osm_id = raw_id.replace('/', '_').strip()
        if not osm_id:
            osm_id = f"hotosm_{lat:.5f}_{lon:.5f}"

        # Address & subcity
        subcity = props.get('adm3_name') or props.get('adm2_name')
        addr_street = props.get('addr_street')
        addr_full = props.get('addr_full')
        opening_hours = props.get('opening_hours')

        cleaned.append({
            'source_dataset': 'hotosm',
            'osm_id': osm_id,
            'name': name.strip(),
            'name_en': props.get('name_en'),
            'name_am': props.get('name_am'),
            'category': category,
            'lat': round(lat, 6),
            'lon': round(lon, 6),
            'subcity': subcity,
            'street': addr_street,
            'address': addr_full or (f"{addr_street}, {subcity}" if addr_street and subcity else subcity),
            'opening_hours': opening_hours,
            'phone': None,
            'website': None,
            'tags': {
                'source': 'hotosm',
                'raw_category': raw_cat,
                'adm3': subcity,
            }
        })

    print(f"    HOTOSM Ingestion Finished:")
    print(f"      Kept Clean Addis Places: {len(cleaned)}")
    print(f"      Skipped Out of Bounds: {skipped_out_of_bounds}")
    print(f"      Skipped Unnamed: {skipped_unnamed}")
    print(f"      Skipped Non-POI Infrastructure: {skipped_infrastructure}")
    return cleaned

def fetch_and_clean_overpass(cache_file: str) -> List[Dict[str, Any]]:
    """Ingests and cleans Dataset 2: Overpass API."""
    print("[*] Ingesting Overpass POI dataset...")

    # Check cache first
    raw_elements = None
    if os.path.exists(cache_file):
        print(f"[*] Found cached Overpass data at {cache_file}, loading...")
        try:
            with open(cache_file, 'r', encoding='utf-8') as f:
                raw_elements = json.load(f)
            print(f"    Loaded {len(raw_elements)} raw elements from cache.")
        except Exception as e:
            print(f"[!] Cache read failed ({e}), refetching...")

    if not raw_elements:
        categories = [
            '["amenity"~"hospital|clinic|pharmacy|doctors|dentist"]',
            '["amenity"~"restaurant|cafe|fast_food|bar|pub|food_court"]',
            '["tourism"~"hotel|guest_house|hostel|motel|attraction|museum"]',
            '["amenity"~"bank|fuel|police|embassy|school|college|university"]',
            '["shop"~"supermarket|mall|bakery|chemist|convenience|clothes"]',
        ]

        all_elems: Dict[str, Any] = {}
        mirrors = [
            "https://overpass-api.de/api/interpreter",
            "https://overpass.kumi.systems/api/interpreter",
            "https://lz4.overpass-api.de/api/interpreter"
        ]

        for idx, cat_filter in enumerate(categories):
            print(f"    Fetching Overpass Batch {idx+1}/{len(categories)} ({cat_filter})...")
            query = f"""
            [out:json][timeout:60];
            (
              node{cat_filter}({MIN_LAT},{MIN_LON},{MAX_LAT},{MAX_LON});
            );
            out body;
            """

            batch_success = False
            for mirror in mirrors:
                try:
                    req = urllib.request.Request(
                        mirror,
                        data=query.encode("utf-8"),
                        headers={"User-Agent": "GuzoMate-POI-Pipeline/1.0"}
                    )
                    with urllib.request.urlopen(req, timeout=45) as resp:
                        batch_data = json.loads(resp.read().decode("utf-8"))
                        elems = batch_data.get("elements", [])
                        for el in elems:
                            el_id = f"node_{el.get('id')}"
                            all_elems[el_id] = el
                        print(f"      Batch {idx+1} fetched: {len(elems)} elements from {mirror}")
                        batch_success = True
                        time.sleep(1.5)  # Respect polite request interval
                        break
                except Exception as e:
                    print(f"      Mirror {mirror} error: {e}, trying next...")
                    time.sleep(2)

            if not batch_success:
                print(f"[!] Warning: Could not fetch batch {idx+1} from any mirror.")

        raw_elements = list(all_elems.values())
        print(f"[*] Total raw Overpass elements collected: {len(raw_elements)}")
        # Save cache
        try:
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(raw_elements, f)
            print(f"[*] Saved Overpass cache to {cache_file}")
        except Exception as e:
            print(f"[!] Could not write cache: {e}")

    # Clean Overpass elements
    cleaned: List[Dict[str, Any]] = []
    skipped_unnamed = 0

    for el in raw_elements:
        tags = el.get('tags') or {}
        name = tags.get('name') or tags.get('name:en') or tags.get('name:am') or tags.get('name:om')
        if not name or not name.strip() or len(name.strip()) < 2:
            skipped_unnamed += 1
            continue

        lat = el.get('lat')
        lon = el.get('lon')
        if lat is None or lon is None:
            continue

        raw_cat = tags.get('amenity') or tags.get('healthcare') or tags.get('tourism') or tags.get('shop') or 'place'
        category = CATEGORY_MAP.get(raw_cat.lower(), raw_cat.lower())

        el_type = el.get('type', 'node')
        el_id = el.get('id')
        osm_id = f"{el_type}_{el_id}"

        # Address components
        addr_parts = [
            tags.get('addr:housenumber'),
            tags.get('addr:street'),
            tags.get('addr:subcity'),
            tags.get('addr:city', 'Addis Ababa')
        ]
        addr_str = ', '.join([p for p in addr_parts if p]) or tags.get('addr:description')

        phone = tags.get('phone') or tags.get('contact:phone') or tags.get('contact:mobile')
        opening_hours = tags.get('opening_hours')
        website = tags.get('website') or tags.get('contact:website')

        cleaned.append({
            'source_dataset': 'overpass',
            'osm_id': osm_id,
            'name': name.strip(),
            'name_en': tags.get('name:en'),
            'name_am': tags.get('name:am'),
            'category': category,
            'lat': round(float(lat), 6),
            'lon': round(float(lon), 6),
            'subcity': tags.get('addr:subcity'),
            'street': tags.get('addr:street'),
            'address': addr_str,
            'opening_hours': opening_hours,
            'phone': phone,
            'website': website,
            'tags': tags
        })

    print(f"    Overpass Cleaning Finished:")
    print(f"      Kept Clean Addis Places: {len(cleaned)}")
    print(f"      Skipped Unnamed: {skipped_unnamed}")
    return cleaned

def merge_and_deduplicate(hotosm_items: List[Dict[str, Any]], overpass_items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    Deduplicates both datasets BEFORE embedding:
    1. Exact OSM ID matching (node_123 / way_123).
    2. Spatial proximity (< 35m) and name matching / containment.
    """
    print("\n[*] Starting Deduplication & Merging Phase...")
    merged_by_id: Dict[str, Dict[str, Any]] = {}
    id_duplicates_merged = 0

    # 1. Index Overpass items first (richer live contact/hours attributes)
    for op in overpass_items:
        osm_id = op['osm_id']
        merged_by_id[osm_id] = op

    # 2. Merge HOTOSM items by exact OSM ID
    unmatched_hotosm: List[Dict[str, Any]] = []
    for ho in hotosm_items:
        osm_id = ho['osm_id']
        if osm_id in merged_by_id:
            id_duplicates_merged += 1
            existing = merged_by_id[osm_id]
            # Enrich existing with HOTOSM administrative details if missing
            if not existing.get('subcity') and ho.get('subcity'):
                existing['subcity'] = ho['subcity']
            if not existing.get('name_am') and ho.get('name_am'):
                existing['name_am'] = ho['name_am']
            if not existing.get('opening_hours') and ho.get('opening_hours'):
                existing['opening_hours'] = ho['opening_hours']
        else:
            unmatched_hotosm.append(ho)

    print(f"    Phase 1 (OSM ID Matching): Merged {id_duplicates_merged} identical OSM ID duplicates.")

    # Combined candidate pool for Spatial & Fuzzy Name Deduplication
    candidates: List[Dict[str, Any]] = list(merged_by_id.values())
    spatial_duplicates_merged = 0

    for ho in unmatched_hotosm:
        ho_lat, ho_lon = ho['lat'], ho['lon']
        ho_norm_name = normalize_name(ho['name'])
        is_duplicate = False

        # Check proximity against existing candidates
        for cand in candidates:
            # Fast bounding box pre-filter (~50 meters is ~0.0005 deg)
            if abs(cand['lat'] - ho_lat) > 0.0005 or abs(cand['lon'] - ho_lon) > 0.0005:
                continue

            dist_m = haversine_distance_meters(ho_lat, ho_lon, cand['lat'], cand['lon'])
            if dist_m <= 35.0:
                cand_norm_name = normalize_name(cand['name'])

                # Compare normalized names or Amharic names
                name_match = (
                    ho_norm_name == cand_norm_name or
                    (len(ho_norm_name) > 3 and ho_norm_name in cand_norm_name) or
                    (len(cand_norm_name) > 3 and cand_norm_name in ho_norm_name)
                )

                amharic_match = (
                    ho.get('name_am') and cand.get('name_am') and
                    ho['name_am'].strip() == cand['name_am'].strip()
                )

                if name_match or amharic_match:
                    spatial_duplicates_merged += 1
                    is_duplicate = True
                    # Merge administrative metadata into canonical record
                    if not cand.get('subcity') and ho.get('subcity'):
                        cand['subcity'] = ho['subcity']
                    if not cand.get('name_am') and ho.get('name_am'):
                        cand['name_am'] = ho['name_am']
                    break

        if not is_duplicate:
            candidates.append(ho)

    print(f"    Phase 2 (Spatial < 35m & Name Matching): Merged {spatial_duplicates_merged} spatial duplicates.")
    print(f"[*] Total Cleaned & Deduplicated Places: {len(candidates)}")
    return candidates

def format_rag_document_content(p: Dict[str, Any]) -> Tuple[str, str, Dict[str, Any]]:
    """
    Synthesizes rich, structured content for vector embedding and RAG generation.
    """
    name = p['name']
    name_am = p.get('name_am')
    name_en = p.get('name_en')
    category = p['category'].replace('_', ' ').capitalize()
    lat = p['lat']
    lon = p['lon']
    subcity = p.get('subcity')
    street = p.get('street')
    address = p.get('address')
    hours = p.get('opening_hours')
    phone = p.get('phone')
    website = p.get('website')

    # Construct clean title
    if name_am and name_am != name:
        title = f"{name} ({name_am})"
    elif name_en and name_en != name:
        title = f"{name} / {name_en}"
    else:
        title = name

    # Build comprehensive grounded facts block
    lines = [
        f"Place Name: {title}",
        f"Category: {category}",
        f"Coordinates: Latitude {lat:.5f}, Longitude {lon:.5f}",
    ]
    if subcity:
        lines.append(f"Subcity: {subcity}, Addis Ababa")
    if street:
        lines.append(f"Street: {street}")
    if address and address != subcity and address != street:
        lines.append(f"Address: {address}")
    if phone:
        lines.append(f"Contact Phone: {phone}")
    if hours:
        lines.append(f"Operating Hours: {hours}")
    if website:
        lines.append(f"Website: {website}")

    # Natural language grounding summary
    loc_desc = f"in {subcity} Subcity, Addis Ababa" if subcity else "in Addis Ababa"
    contact_desc = f" Contact: {phone}." if phone else ""
    hours_desc = f" Operating hours: {hours}." if hours else ""
    lines.append(
        f"Summary: {title} is a verified {category.lower()} located {loc_desc} "
        f"at coordinates ({lat:.5f}, {lon:.5f}).{contact_desc}{hours_desc}"
    )

    content = '\n'.join(lines)

    metadata = {
        'osm_id': p['osm_id'],
        'name': name,
        'name_am': name_am,
        'category': p['category'],
        'lat': lat,
        'lon': lon,
        'subcity': subcity,
        'address': address,
        'phone': phone,
        'opening_hours': hours,
        'source_dataset': p['source_dataset'],
    }

    return title, content, metadata

def run_cleaning_and_merging():
    print("================================================================")
    print(" GuzoMate Multi-Source POI Cleaning & Deduplication Engine")
    print("================================================================")

    current_dir = os.path.dirname(os.path.abspath(__file__))
    root_dir = os.path.abspath(os.path.join(current_dir, '..', '..', '..'))
    data_dir = os.path.join(root_dir, 'ai-ml', 'data')
    os.makedirs(data_dir, exist_ok=True)

    hotosm_path = os.path.join(root_dir, 'hotosm_eth_points_of_interest_osm_geojson', 'points_of_interest.geojson')
    overpass_cache = os.path.join(data_dir, 'overpass_raw.json')
    output_path = os.path.join(data_dir, 'cleaned_addis_pois.json')

    # 1. Clean HOTOSM dataset
    hotosm_clean = clean_hotosm_dataset(hotosm_path)

    # 2. Clean Overpass dataset
    overpass_clean = fetch_and_clean_overpass(overpass_cache)

    # 3. Deduplicate and merge BOTH datasets BEFORE embedding
    merged_pois = merge_and_deduplicate(hotosm_clean, overpass_clean)

    # 4. Prepare RAG documents
    rag_docs = []
    for item in merged_pois:
        title, content, metadata = format_rag_document_content(item)
        rag_docs.append({
            'source_type': 'poi_place',
            'source_id': item['osm_id'],
            'language': 'am' if item.get('name_am') else 'en',
            'title': title,
            'content': content,
            'metadata': metadata
        })

    # 5. Save final deduplicated collection
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(rag_docs, f, indent=2, ensure_ascii=False)

    print(f"\n================================================================")
    print(f" SUCCESS: Cleaned & Deduplicated {len(rag_docs)} POIs!")
    print(f" Output written to: {output_path}")
    print(f" Ready for 1024-dimensional FastEmbed embedding & Supabase push.")
    print(f"================================================================")

if __name__ == '__main__':
    run_cleaning_and_merging()
