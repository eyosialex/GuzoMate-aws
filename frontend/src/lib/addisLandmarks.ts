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
];

export function searchAddisLandmarks(query: string): AddisLandmark[] {
  const clean = query.trim().toLowerCase();
  if (!clean) return [];

  return ADDIS_LANDMARKS.filter(
    (l) =>
      l.name.toLowerCase().includes(clean) ||
      l.address.toLowerCase().includes(clean)
  ).slice(0, 8);
}
