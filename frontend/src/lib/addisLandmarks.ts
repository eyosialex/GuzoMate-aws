import { GeoLocation } from '../types';

export interface AddisLandmark {
  id: string;
  name: string;
  address: string;
  location: GeoLocation;
}

export const ADDIS_LANDMARKS: AddisLandmark[] = [
  {
    id: 'lm-bole-medhanialem',
    name: 'Bole Medhanialem',
    address: 'Cameroon St, Bole, Addis Ababa',
    location: { lat: 8.9984, lon: 38.7869 },
  },
  {
    id: 'lm-edna-mall',
    name: 'Edna Mall / Bole Atlas',
    address: 'Namibia St, Bole, Addis Ababa',
    location: { lat: 8.9998, lon: 38.7885 },
  },
  {
    id: 'lm-bole-airport',
    name: 'Bole International Airport',
    address: 'Airport Rd, Bole, Addis Ababa',
    location: { lat: 8.9778, lon: 38.7993 },
  },
  {
    id: 'lm-meskel-square',
    name: 'Meskel Square',
    address: 'Meskel Square, Kirkos, Addis Ababa',
    location: { lat: 9.0108, lon: 38.7618 },
  },
  {
    id: 'lm-megenagna',
    name: 'Megenagna Roundabout',
    address: 'Ring Rd / Yeka, Addis Ababa',
    location: { lat: 9.0205, lon: 38.8020 },
  },
  {
    id: 'lm-piazza',
    name: 'Piazza / Churchill Avenue',
    address: 'Churchill Ave, Arada, Addis Ababa',
    location: { lat: 9.0305, lon: 38.7515 },
  },
  {
    id: 'lm-mexico',
    name: 'Mexico Square',
    address: 'Ras Abebe Aregay St, Kirkos / Lideta',
    location: { lat: 9.0115, lon: 38.7445 },
  },
  {
    id: 'lm-gotera',
    name: 'Gotera Interchange',
    address: 'Debre Zeit Rd / Ring Rd, Kirkos',
    location: { lat: 8.9950, lon: 38.7540 },
  },
  {
    id: 'lm-kazanchis',
    name: 'Kazanchis / UNECA',
    address: 'Menelik II Ave, Kirkos, Addis Ababa',
    location: { lat: 9.0185, lon: 38.7695 },
  },
  {
    id: 'lm-saris',
    name: 'Saris Abo',
    address: 'Debre Zeit Rd, Nifas Silk-Lafto',
    location: { lat: 8.9565, lon: 38.7590 },
  },
  {
    id: 'lm-cmc',
    name: 'CMC Roundabout',
    address: 'CMC Michael, Bole / Yeka',
    location: { lat: 9.0255, lon: 38.8510 },
  },
  {
    id: 'lm-arat-kilo',
    name: 'Arat Kilo',
    address: 'King George VI St, Arada, Addis Ababa',
    location: { lat: 9.0335, lon: 38.7625 },
  },
  {
    id: 'lm-sidist-kilo',
    name: 'Sidist Kilo / Yekatit 12',
    address: 'University Main Campus, Gulele',
    location: { lat: 9.0465, lon: 38.7615 },
  },
  {
    id: 'lm-tor-hailoch',
    name: 'Tor Hailoch',
    address: 'Jimma Rd, Kolfe Keranio',
    location: { lat: 9.0105, lon: 38.7210 },
  },
  {
    id: 'lm-lebu',
    name: 'Lebu Mebrathail',
    address: 'Lebu, Nifas Silk-Lafto',
    location: { lat: 8.9680, lon: 38.7245 },
  },
  {
    id: 'lm-haya-hulet',
    name: '22 Mazoria / Haya Hulet',
    address: 'Haile Gebreselassie Ave, Yeka',
    location: { lat: 9.0190, lon: 38.7845 },
  },
  {
    id: 'lm-merkato',
    name: 'Addis Merkato',
    address: 'Addis Ketema, Addis Ababa',
    location: { lat: 9.0300, lon: 38.7360 },
  },
  {
    id: 'lm-gerji',
    name: 'Gerji Imperial',
    address: 'Gerji, Bole, Addis Ababa',
    location: { lat: 9.0010, lon: 38.8120 },
  },
  {
    id: 'lm-ayat',
    name: 'Ayat Roundabout',
    address: 'Ayat, Yeka, Addis Ababa',
    location: { lat: 9.0275, lon: 38.8790 },
  },
  {
    id: 'lm-kality',
    name: 'Kality Interchange',
    address: 'Debre Zeit Rd / Ring Rd, Akaki-Kality',
    location: { lat: 8.9180, lon: 38.7620 },
  },
  {
    id: 'lm-summit',
    name: 'Summit Condominium',
    address: 'Summit, Bole, Addis Ababa',
    location: { lat: 9.0125, lon: 38.8710 },
  },
  {
    id: 'lm-bulbula',
    name: 'Bole Bulbula',
    address: 'Bulbula, Bole, Addis Ababa',
    location: { lat: 8.9550, lon: 38.7920 },
  },
  {
    id: 'lm-atlas',
    name: 'Bole Atlas',
    address: 'Cape Verde St, Bole, Addis Ababa',
    location: { lat: 9.0020, lon: 38.7820 },
  },
  {
    id: 'lm-shiromeda',
    name: 'Shiromeda / Entoto',
    address: 'Entoto Ave, Gulele, Addis Ababa',
    location: { lat: 9.0620, lon: 38.7620 },
  },
  {
    id: 'lm-jemo',
    name: 'Jemo Michael',
    address: 'Jemo 1, Nifas Silk-Lafto',
    location: { lat: 8.9590, lon: 38.7050 },
  },
  {
    id: 'lm-alert',
    name: 'ALERT Hospital / Zenebework',
    address: 'Zenebework, Kolfe Keranio',
    location: { lat: 8.9880, lon: 38.7030 },
  },
];

export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function getClosestLandmark(coords: GeoLocation): { landmark: AddisLandmark; distanceKm: number } {
  let closest = ADDIS_LANDMARKS[0];
  let minDistance = calculateDistanceKm(coords.lat, coords.lon, closest.location.lat, closest.location.lon);

  for (let i = 1; i < ADDIS_LANDMARKS.length; i++) {
    const lm = ADDIS_LANDMARKS[i];
    const dist = calculateDistanceKm(coords.lat, coords.lon, lm.location.lat, lm.location.lon);
    if (dist < minDistance) {
      minDistance = dist;
      closest = lm;
    }
  }

  return { landmark: closest, distanceKm: minDistance };
}

export function formatLocationName(coords: GeoLocation): string {
  const { landmark, distanceKm } = getClosestLandmark(coords);
  if (distanceKm <= 0.6) {
    return `${landmark.name}, Addis Ababa`;
  }
  if (distanceKm <= 3.5) {
    return `Near ${landmark.name}, Addis Ababa`;
  }
  // Check if within wider Addis Ababa boundary
  if (coords.lat >= 8.85 && coords.lat <= 9.15 && coords.lon >= 38.65 && coords.lon <= 38.95) {
    return `${landmark.name} Area, Addis Ababa`;
  }
  return `GPS (${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)})`;
}

export function estimateElevationMeters(lat: number, _lon: number): number {
  const base = 2355;
  const delta = (lat - 8.98) * 4500;
  const estimated = Math.round(base + delta);
  return Math.min(Math.max(estimated, 2100), 3100);
}

export async function reverseGeocode(coords: GeoLocation): Promise<string> {
  const fallback = formatLocationName(coords);
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${coords.lat}&lon=${coords.lon}&zoom=16&addressdetails=1`,
      {
        headers: { 'Accept-Language': 'en' },
        signal: controller.signal,
      }
    );
    clearTimeout(timeoutId);
    if (res.ok) {
      const data = await res.json();
      const addr = data.address;
      if (addr) {
        const placePart = addr.suburb || addr.neighbourhood || addr.quarter || addr.commercial || addr.road || addr.city_district;
        const cityPart = addr.city || addr.town || addr.municipality || 'Addis Ababa';
        if (placePart && cityPart) {
          return `${placePart}, ${cityPart}`;
        }
        if (data.name) {
          return `${data.name}, ${cityPart}`;
        }
      }
    }
  } catch {
    // Gracefully ignore network error or abort
  }
  return fallback;
}

export function searchAddisLandmarks(query: string): AddisLandmark[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  return ADDIS_LANDMARKS.filter(
    (l) =>
      l.name.toLowerCase().includes(clean) ||
      l.address.toLowerCase().includes(clean)
  ).slice(0, 8);
}
