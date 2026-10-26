import { Place, Incident, RouteOption, WeatherData } from '../types';

export const MOCK_USER_LOCATION = {
  lat: 9.0054, // Bole Medhanialem area, Addis Ababa
  lon: 38.7885,
};

export const MOCK_PLACES: Place[] = [
  {
    id: 'place-01',
    name: 'Tomoca Coffee Bole',
    category: 'cafe',
    location: { lat: 9.0062, lon: 38.7876 },
    distanceMeters: 140,
    address: 'Cameroon St, Bole, Addis Ababa',
    tags: { amenity: 'cafe', cuisine: 'coffee_shop', takeaway: 'yes' },
    source: 'openstreetmap',
    osm: { type: 'node', id: 'osm_552144' },
    isSaved: false,
  },
  {
    id: 'place-02',
    name: 'Korean Hospital (MCM General Hospital)',
    category: 'hospital',
    location: { lat: 9.0210, lon: 38.8055 },
    distanceMeters: 2300,
    address: 'Gerji, Bole Subcity, Addis Ababa',
    tags: { amenity: 'hospital', healthcare: 'hospital', emergency: 'yes' },
    source: 'openstreetmap',
    osm: { type: 'way', id: 'osm_891234' },
    isSaved: true,
  },
  {
    id: 'place-03',
    name: '2000 Habesha Cultural Restaurant',
    category: 'restaurant',
    location: { lat: 9.0012, lon: 38.7842 },
    distanceMeters: 620,
    address: 'Namibia St, Bole, Addis Ababa',
    tags: { amenity: 'restaurant', cuisine: 'ethiopian_traditional', live_music: 'yes' },
    source: 'openstreetmap',
    osm: { type: 'node', id: 'osm_124890' },
    isSaved: false,
  },
  {
    id: 'place-04',
    name: 'Sheraton Addis Luxury Collection',
    category: 'hotel',
    location: { lat: 9.0195, lon: 38.7612 },
    distanceMeters: 3400,
    address: 'Taitu St, Kirkos, Addis Ababa',
    tags: { tourism: 'hotel', stars: '5', internet_access: 'wlan' },
    source: 'openstreetmap',
    osm: { type: 'way', id: 'osm_998124' },
    isSaved: false,
  },
  {
    id: 'place-05',
    name: 'Lion Pharmacy Bole Branch',
    category: 'pharmacy',
    location: { lat: 9.0078, lon: 38.7899 },
    distanceMeters: 310,
    address: 'Africa Ave, Bole, Addis Ababa',
    tags: { amenity: 'pharmacy', dispensing: 'yes', opening_hours: '24/7' },
    source: 'openstreetmap',
    osm: { type: 'node', id: 'osm_445892' },
    isSaved: false,
  },
  {
    id: 'place-06',
    name: 'TotalEnergies Bole Fuel & Service',
    category: 'fuel',
    location: { lat: 9.0031, lon: 38.7820 },
    distanceMeters: 750,
    address: 'Airport Rd, Bole, Addis Ababa',
    tags: { amenity: 'fuel', brand: 'TotalEnergies', fuel_diesel: 'yes' },
    source: 'openstreetmap',
    osm: { type: 'node', id: 'osm_771829' },
    isSaved: false,
  },
  {
    id: 'place-07',
    name: 'Meskel Square Central Plaza',
    category: 'all',
    location: { lat: 9.0108, lon: 38.7628 },
    distanceMeters: 2900,
    address: 'Meskel Square, Kirkos, Addis Ababa',
    tags: { leisure: 'park', historic: 'yes' },
    source: 'openstreetmap',
    osm: { type: 'relation', id: 'osm_332190' },
    isSaved: false,
  },
  {
    id: 'place-08',
    name: 'Commercial Bank of Ethiopia (CBE) Headquarters',
    category: 'bank',
    location: { lat: 9.0255, lon: 38.7523 },
    distanceMeters: 4500,
    address: 'Ras Desta Damtew St, Addis Ababa',
    tags: { amenity: 'bank', atm: 'yes', building: 'commercial' },
    source: 'openstreetmap',
    osm: { type: 'way', id: 'osm_665431' },
    isSaved: false,
  }
];

export const MOCK_INCIDENTS: Incident[] = [
  {
    id: 'inc-01',
    title: 'Gotera Peak Hour Congestion',
    type: 'HEAVY_TRAFFIC',
    description: 'Heavy congestion due to peak-hour slowdown near Gotera Interchange.',
    status: 'ACTIVE',
    verification: 'COMMUNITY_CONFIRMED',
    location: { lat: 8.9950, lon: 38.7540 },
    locationName: 'Gotera Interchange, Kirkos',
    distanceMeters: 3900,
    createdAt: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    confirmationsCount: 14,
  },
  {
    id: 'inc-02',
    title: 'Churchill Avenue Corridor Construction',
    type: 'ROAD_CLOSURE',
    description: 'Corridor construction work on Churchill Avenue. Lane diverted toward Piazza.',
    status: 'ACTIVE',
    verification: 'OFFICIALLY_VERIFIED',
    location: { lat: 9.0280, lon: 38.7510 },
    locationName: 'Churchill Avenue, Arada',
    distanceMeters: 4800,
    createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    confirmationsCount: 28,
  },
  {
    id: 'inc-03',
    title: 'Megenagna Underpass Flooding',
    type: 'FLOODING',
    description: 'Water accumulation on low underpass near Megenagna round-about after heavy afternoon rain.',
    status: 'PENDING',
    verification: 'UNVERIFIED',
    location: { lat: 9.0205, lon: 38.8020 },
    locationName: 'Megenagna Roundabout, Yeka',
    distanceMeters: 2100,
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    confirmationsCount: 3,
  },
  {
    id: 'inc-04',
    title: 'Mexico Square Fender Bender',
    type: 'ACCIDENT',
    description: 'Minor two-vehicle fender bender near Mexico Square. Traffic officers on scene.',
    status: 'RESOLVED',
    verification: 'COMMUNITY_CONFIRMED',
    location: { lat: 9.0115, lon: 38.7445 },
    locationName: 'Mexico Square, Lideta',
    distanceMeters: 4900,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    confirmationsCount: 19,
  }
];

export const MOCK_ROUTES: RouteOption[] = [
  {
    id: 'route-transit-01',
    provider: 'addis-transit',
    mode: 'transit',
    durationSeconds: 1560, // 26 min
    distanceMeters: 6400,
    summary: 'Bole Medhanialem → Light Rail / Sheger Express → Piazza St George',
    segments: [
      {
        id: 'seg-1',
        instruction: 'Walk 4 minutes (280m) from Bole Medhanialem to Edna Mall Transit Stop',
        mode: 'walking',
        distanceMeters: 280,
        durationSeconds: 240,
        fromStop: 'Bole Medhanialem',
        toStop: 'Edna Mall Stop',
        coordinates: [
          [9.0054, 38.7885],
          [9.0065, 38.7870]
        ]
      },
      {
        id: 'seg-2',
        instruction: 'Board Sheger Express Bus Line 14 toward Meskel Square',
        mode: 'transit',
        distanceMeters: 3800,
        durationSeconds: 720,
        fromStop: 'Edna Mall Stop',
        toStop: 'Stadium / Meskel Square Station',
        lineName: 'Sheger Line 14',
        coordinates: [
          [9.0065, 38.7870],
          [9.0108, 38.7628]
        ]
      },
      {
        id: 'seg-3',
        instruction: 'Transfer to Addis Ababa Light Rail (East-West Line) toward Menelik II Square',
        mode: 'transit',
        distanceMeters: 2320,
        durationSeconds: 600,
        fromStop: 'Stadium LRT',
        toStop: 'Piazza / Menelik II Station',
        lineName: 'LRT East-West Line',
        coordinates: [
          [9.0108, 38.7628],
          [9.0340, 38.7510]
        ]
      }
    ],
    sourceUpdatedAt: new Date().toISOString(),
    limitations: ['Transit frequency may vary by 5-10 minutes during peak hours']
  },
  {
    id: 'route-driving-01',
    provider: 'addis-transit',
    mode: 'driving',
    durationSeconds: 1140, // 19 min
    distanceMeters: 7200,
    summary: 'Via Africa Avenue and Churchill Road',
    segments: [
      {
        id: 'seg-d1',
        instruction: 'Head northwest on Africa Ave toward Meskel Square',
        mode: 'driving',
        distanceMeters: 3900,
        durationSeconds: 480,
        coordinates: [
          [9.0054, 38.7885],
          [9.0108, 38.7628]
        ]
      },
      {
        id: 'seg-d2',
        instruction: 'Continue onto Churchill Ave toward Piazza St George Cathedral',
        mode: 'driving',
        distanceMeters: 3300,
        durationSeconds: 660,
        coordinates: [
          [9.0108, 38.7628],
          [9.0340, 38.7510]
        ]
      }
    ],
    sourceUpdatedAt: new Date().toISOString(),
    limitations: ['Churchill Ave has lane diversion due to urban corridor work']
  },
  {
    id: 'route-walking-01',
    provider: 'addis-transit',
    mode: 'walking',
    durationSeconds: 4680, // 78 min
    distanceMeters: 6100,
    summary: 'Pedestrian walkway via Africa Ave & National Theatre',
    segments: [
      {
        id: 'seg-w1',
        instruction: 'Walk along pedestrian walkway on Africa Ave toward Meskel Square',
        mode: 'walking',
        distanceMeters: 3200,
        durationSeconds: 2400,
        coordinates: [
          [9.0054, 38.7885],
          [9.0108, 38.7628]
        ]
      },
      {
        id: 'seg-w2',
        instruction: 'Continue past National Theatre up Ras Desta Damtew St to Piazza',
        mode: 'walking',
        distanceMeters: 2900,
        durationSeconds: 2280,
        coordinates: [
          [9.0108, 38.7628],
          [9.0340, 38.7510]
        ]
      }
    ],
    sourceUpdatedAt: new Date().toISOString(),
    limitations: ['Steep incline after Mexico/Stadium area']
  }
];

export const MOCK_WEATHER: WeatherData = {
  location: { lat: 9.0054, lon: 38.7885 },
  current: {
    temperatureC: 22,
    condition: 'Partly Cloudy',
    precipitationMm: 0.2,
    windKph: 11,
    humidity: 58,
  },
  forecast: [
    {
      date: new Date().toISOString().split('T')[0],
      hourly: [
        { time: '13:00', temperatureC: 23, condition: 'Partly Cloudy', precipitationProbability: 15 },
        { time: '14:00', temperatureC: 24, condition: 'Scattered Showers', precipitationProbability: 45 },
        { time: '15:00', temperatureC: 21, condition: 'Thunderstorm', precipitationProbability: 75 },
        { time: '16:00', temperatureC: 19, condition: 'Rain', precipitationProbability: 60 },
        { time: '17:00', temperatureC: 18, condition: 'Light Rain', precipitationProbability: 30 },
        { time: '18:00', temperatureC: 17, condition: 'Cloudy', precipitationProbability: 10 },
      ]
    }
  ],
  arrivalAdvice: {
    arrivalTime: new Date(Date.now() + 45 * 60 * 1000).toISOString(),
    forecast: {
      temperatureC: 21,
      condition: 'Possible Rain',
      precipitationProbability: 65,
    },
    suggestions: [
      {
        type: 'accessory',
        text: 'Carry an umbrella or raincoat',
        reason: '65% probability of afternoon rain showers around 15:00 in central Addis'
      },
      {
        type: 'route',
        text: 'Use covered Light Rail or Sheger transit',
        reason: 'Roads around Megenagna and Churchill Ave may experience localized puddling'
      }
    ],
    language: 'en',
    provider: 'weatherapi',
    retrievedAt: new Date().toISOString()
  },
  provider: 'weatherapi',
  retrievedAt: new Date().toISOString(),
  cached: true
};
