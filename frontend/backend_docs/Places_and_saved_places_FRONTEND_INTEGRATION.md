# GuzoMate Places & Saved Places Module — Frontend Integration Guide 📍⭐

## 1. Overview & Architecture

The **Places & Saved Places Module** powers point-of-interest (POI) discovery across Addis Ababa and personalized user bookmarking. It indexes 13,800+ curated geospatial points from OpenStreetMap (`addis_geo_points`) and allows travelers to save favorites (e.g. Work, Home, Cafes, Hospitals, Bus Stations).

- **Saved Places Base URL:** `/api/v1/saved-places`
- **Places Discovery Base URL:** `/api/v1/places`
- **Authentication:**
  - `/api/v1/places/*`: Public (no auth required)
  - `/api/v1/saved-places/*`: Requires `Authorization: Bearer <accessToken>`

---

## 2. POI Search & Discovery Endpoints

### 2.1 Discover Nearby Places (PostGIS Spatial POI Query)

Queries nearby points of interest within a given radius, filterable by category and keyword search.

- **Endpoint:** `GET /api/v1/places/nearby`
- **Auth Required:** No (Public)
- **Query Parameters:**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `lat` | `number` | **Yes** | — | Center latitude (e.g. `9.03`). |
| `lon` | `number` | **Yes** | — | Center longitude (e.g. `38.74`). |
| `radiusMeters` or `radius`| `number` | No | `5000` | Search radius in meters. |
| `category` | `string` | No | `""` | Category filter (see supported categories below). |
| `query` | `string` | No | `""` | Search text / partial place name. |
| `limit` | `integer` | No | `20` | Max results (up to 100). |

#### Supported Category Keywords
- `cafe` (Cafes, coffee houses, *buna*, pastry)
- `restaurant` (Restaurants, eateries, fast food)
- `hotel` (Hotels, hostels, guest houses)
- `hospital` (Hospitals, clinics, healthcare, doctors)
- `pharmacy` (Pharmacies, chemists)
- `bank` (Banks, ATMs)
- `fuel` (Gas stations, petrol)
- `mechanic` (Car repair, tyres, auto mechanics)
- `all` (Everything)

#### Success Response (`200 OK`)
```json
{
  "items": [
    {
      "id": "10492812",
      "name": "Tomoca Coffee",
      "category": "cafe",
      "location": {
        "lat": 9.0315,
        "lon": 38.7521
      },
      "distanceMeters": 350.2,
      "address": "Wereda 01, Kirkos Subcity, Addis Ababa",
      "tags": {
        "amenity": "cafe",
        "cuisine": "coffee_shop",
        "opening_hours": "07:00-20:00"
      },
      "source": "openstreetmap",
      "osm": {
        "type": "node",
        "id": "10492812"
      }
    }
  ],
  "count": 1,
  "nextCursor": null,
  "attribution": "© OpenStreetMap contributors"
}
```

---

### 2.2 Get Single Place Details

- **Endpoint:** `GET /api/v1/places/:id`
- **Auth Required:** No (Public)
- **URL Parameter:** `id` — The place identifier (e.g., `"10492812"`)

#### Success Response (`200 OK`)
```json
{
  "id": "10492812",
  "name": "Tomoca Coffee",
  "category": "cafe",
  "location": {
    "lat": 9.0315,
    "lon": 38.7521
  },
  "distanceMeters": 0,
  "address": "Wereda 01, Kirkos Subcity, Addis Ababa",
  "tags": {
    "amenity": "cafe",
    "cuisine": "coffee_shop"
  },
  "source": "openstreetmap",
  "osm": {
    "type": "node",
    "id": "10492812"
  }
}
```

---

## 3. Saved Places Endpoints (Bookmarks)

### 3.1 List Saved Places

Retrieves all saved bookmarks for the authenticated user, ordered from newest to oldest.

- **Endpoint:** `GET /api/v1/saved-places`
- **Auth Required:** Yes (`Bearer <accessToken>`)

#### Success Response (`200 OK`)
```json
{
  "items": [
    {
      "id": "10492812",
      "savedId": "58c89bdf-28eb-4cfd-bfa2-378342894101",
      "name": "Tomoca Coffee",
      "category": "cafe",
      "address": "Kirkos Subcity, Addis Ababa",
      "latitude": 9.0315,
      "longitude": 38.7521,
      "createdAt": "2026-10-27T08:00:00.000Z"
    }
  ],
  "total": 1
}
```

---

### 3.2 Save a Place (Bookmark)

Saves a place into the traveler's bookmarked list. Idempotent (`ON CONFLICT DO NOTHING`).

- **Endpoint:** `POST /api/v1/saved-places`
- **Auth Required:** Yes (`Bearer <accessToken>`)
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "placeId": "10492812"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `placeId` | `string` | **Yes** | ID from `/places/nearby` or OpenStreetMap POI. |

#### Success Response (`201 Created`)
```json
{
  "placeId": "10492812",
  "saved": true,
  "createdAt": "2026-10-27T10:48:00.000Z"
}
```

---

### 3.3 Remove Saved Place (Unbookmark)

Removes a bookmarked place by its `placeId`.

- **Endpoint:** `DELETE /api/v1/saved-places/:placeId`
- **Auth Required:** Yes (`Bearer <accessToken>`)
- **URL Parameter:** `placeId` — The ID of the place to remove.

#### Success Response (`204 No Content`)
HTTP 204 with empty body.

---

## 4. TypeScript Interfaces for Frontend

```typescript
export interface GeoPoint {
  lat: number;
  lon: number;
}

export interface PlaceItem {
  id: string;
  name: string;
  category: string;
  location: GeoPoint;
  distanceMeters: number;
  address: string | null;
  tags: Record<string, string>;
  source: string;
  osm: {
    type: string;
    id: string;
  };
}

export interface SavedPlaceItem {
  id: string; // placeId
  savedId: string; // bookmark UUID
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
  createdAt: string;
}

export interface NearbyPlacesResponse {
  items: PlaceItem[];
  count: number;
  nextCursor: string | null;
  attribution: string;
}

export interface SavedPlacesResponse {
  items: SavedPlaceItem[];
  total: number;
}
```

---

## 5. Frontend UI Integration Pattern

### Bookmark Toggle Button Component (React)
```tsx
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';

interface BookmarkProps {
  placeId: string;
  isSaved: boolean;
}

export const BookmarkButton: React.FC<BookmarkProps> = ({ placeId, isSaved }) => {
  const queryClient = useQueryClient();

  const toggleMutation = useMutation({
    mutationFn: async () => {
      if (isSaved) {
        await apiClient.delete(`/saved-places/${placeId}`);
      } else {
        await apiClient.post('/saved-places', { placeId });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-places'] });
    },
  });

  return (
    <button
      onClick={() => toggleMutation.mutate()}
      disabled={toggleMutation.isPending}
      className={`p-2 rounded-full border transition ${
        isSaved
          ? 'bg-amber-500 text-white border-amber-600'
          : 'bg-white text-gray-400 border-gray-200 hover:text-amber-500'
      }`}
      title={isSaved ? 'Remove from saved' : 'Save place'}
    >
      <svg className="w-5 h-5 fill-current" viewBox="0 0 20 20">
        <path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z" />
      </svg>
    </button>
  );
};
```
