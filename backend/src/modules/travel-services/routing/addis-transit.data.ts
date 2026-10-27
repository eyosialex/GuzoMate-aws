export interface TransitStation {
  name: string;
  nameAm: string;
  line: 'EAST_WEST' | 'NORTH_SOUTH' | 'COMMON';
  lat: number;
  lon: number;
}

// Addis Ababa Light Rail Transit (LRT) Stations
export const ADDIS_LRT_STATIONS: TransitStation[] = [
  // Common / Interchange Section
  { name: 'Stadium', nameAm: 'ስታዲየም', line: 'COMMON', lat: 9.0135, lon: 38.7562 },
  { name: 'Mexico', nameAm: 'ሜክሲኮ', line: 'COMMON', lat: 9.0108, lon: 38.7441 },
  { name: 'Lideta', nameAm: 'ልደታ', line: 'COMMON', lat: 9.0118, lon: 38.7368 },
  { name: 'Tegbare-ed', nameAm: 'ተግባረ እድ', line: 'COMMON', lat: 9.0111, lon: 38.7401 },

  // East-West Line (Ayat <-> Tor Hailoch)
  { name: 'Ayat', nameAm: 'አያት', line: 'EAST_WEST', lat: 9.0272, lon: 38.8681 },
  { name: 'Meri', nameAm: 'መሪ', line: 'EAST_WEST', lat: 9.0256, lon: 38.8519 },
  { name: 'CMC', nameAm: 'ሲኤምሲ', line: 'EAST_WEST', lat: 9.0245, lon: 38.8351 },
  { name: 'Civil Service', nameAm: 'ሲቪል ሰርቪስ', line: 'EAST_WEST', lat: 9.0223, lon: 38.8242 },
  { name: 'Salite Mihret', nameAm: 'ስላሴ ምህረት', line: 'EAST_WEST', lat: 9.0211, lon: 38.8145 },
  { name: 'Gurd Shola', nameAm: 'ጉርድ ሾላ', line: 'EAST_WEST', lat: 9.0185, lon: 38.7994 },
  { name: 'Management Institute', nameAm: 'ማኔጅመንት ኢንስቲትዩት', line: 'EAST_WEST', lat: 9.0195, lon: 38.7915 },
  { name: 'Megenagna', nameAm: 'መገናኛ', line: 'EAST_WEST', lat: 9.0205, lon: 38.7842 },
  { name: 'Lem Hotel', nameAm: 'ለም ሆቴል', line: 'EAST_WEST', lat: 9.0192, lon: 38.7765 },
  { name: 'Hayahulet 1', nameAm: 'ሃያ ሁለት ፩', line: 'EAST_WEST', lat: 9.0181, lon: 38.7698 },
  { name: 'Hayahulet 2', nameAm: 'ሃያ ሁለት ፪', line: 'EAST_WEST', lat: 9.0175, lon: 38.7654 },
  { name: 'Urael', nameAm: 'ኡራኤል', line: 'EAST_WEST', lat: 9.0162, lon: 38.7612 },
  { name: 'Bambis', nameAm: 'ባምቢስ', line: 'EAST_WEST', lat: 9.0145, lon: 38.7589 },
  { name: 'Coca Cola', nameAm: 'ኮካ ኮላ', line: 'EAST_WEST', lat: 9.0098, lon: 38.7291 },
  { name: 'Tor Hailoch', nameAm: 'ጦር ኃይሎች', line: 'EAST_WEST', lat: 9.0082, lon: 38.7214 },

  // North-South Line (Menelik II Square <-> Kality)
  { name: 'Menelik II Square', nameAm: 'ዳግማዊ ምኒልክ አደባባይ', line: 'NORTH_SOUTH', lat: 9.0361, lon: 38.7525 },
  { name: 'Atikilt Tera', nameAm: 'አትክልት ተራ', line: 'NORTH_SOUTH', lat: 9.0315, lon: 38.7495 },
  { name: 'Habte Giyorgis', nameAm: 'ሀብተ ጊዮርጊስ ድልድይ', line: 'NORTH_SOUTH', lat: 9.0275, lon: 38.7468 },
  { name: 'Abenet', nameAm: 'አበነት', line: 'NORTH_SOUTH', lat: 9.0212, lon: 38.7425 },
  { name: 'Sebategna', nameAm: 'ሰባተኛ', line: 'NORTH_SOUTH', lat: 9.0245, lon: 38.7385 },
  { name: 'Autobis Tera', nameAm: 'አውቶቡስ ተራ', line: 'NORTH_SOUTH', lat: 9.0285, lon: 38.7365 },
  { name: 'Meskel Square', nameAm: 'መስቀል አደባባይ', line: 'NORTH_SOUTH', lat: 9.0105, lon: 38.7585 },
  { name: 'Gotera', nameAm: 'ጎተራ', line: 'NORTH_SOUTH', lat: 8.9885, lon: 38.7575 },
  { name: 'Nefas Silk', nameAm: 'ንፋስ ስልክ', line: 'NORTH_SOUTH', lat: 8.9725, lon: 38.7588 },
  { name: 'Lancia', nameAm: 'ላንቻ', line: 'NORTH_SOUTH', lat: 8.9975, lon: 38.7581 },
  { name: 'Saris', nameAm: 'ሳሪስ', line: 'NORTH_SOUTH', lat: 8.9555, lon: 38.7615 },
  { name: 'Abo Mazoria', nameAm: 'አቦ ማዞሪያ', line: 'NORTH_SOUTH', lat: 8.9412, lon: 38.7635 },
  { name: 'Adey Abeba', nameAm: 'አደይ አበባ', line: 'NORTH_SOUTH', lat: 8.9285, lon: 38.7655 },
  { name: 'Kality', nameAm: 'ቃሊቲ', line: 'NORTH_SOUTH', lat: 8.9165, lon: 38.7675 },
];

/**
 * Calculates straight-line distance in meters between two coordinates (Haversine formula).
 */
export function calculateDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000; // Earth radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}

/**
 * Finds the nearest LRT station to coordinates within maxDistanceMeters.
 */
export function findNearestLrtStation(
  lat: number,
  lon: number,
  maxDistanceMeters = 1500
): { station: TransitStation; distanceMeters: number } | null {
  let nearest: TransitStation | null = null;
  let minDistance = Infinity;

  for (const station of ADDIS_LRT_STATIONS) {
    const d = calculateDistanceMeters(lat, lon, station.lat, station.lon);
    if (d < minDistance) {
      minDistance = d;
      nearest = station;
    }
  }

  if (nearest && minDistance <= maxDistanceMeters) {
    return { station: nearest, distanceMeters: minDistance };
  }
  return null;
}

/**
 * Calculates official LRT fare (ETB) based on station count.
 * Official tariff:
 *  - 1 to 8 stations: 5 ETB
 *  - 9 to 16 stations: 8 ETB
 *  - 17+ stations: 10 ETB
 */
export function calculateLrtFare(stationCount: number): number {
  if (stationCount <= 8) return 5;
  if (stationCount <= 16) return 8;
  return 10;
}
