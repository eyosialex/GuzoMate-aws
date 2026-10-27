# GuzoMate Incidents Module — Frontend Integration Guide 🚨

## 1. Overview & Architecture

The **Incidents Module** is the core crowdsourced road safety engine of GuzoMate. It enables travelers to report road hazards in real time, view nearby road alerts using PostGIS spatial indexing, and monitor verification status.

- **Base URL:** `/api/v1/incidents`
- **Rate Limit:** 30 incident creations per hour per IP on `POST /`
- **Duplicate Protection:** Automatically blocks duplicate reports within **500 meters** of the same incident type created in the last **2 hours**.
- **Automated Lifecycle Expiration:** Reports automatically expire based on their type (e.g., Heavy Traffic: 2 hours, Accidents: 4 hours, Floods: 8 hours, Construction: 72 hours).

---

## 2. Incident Statuses & Enums

### Incident Types (`type`)
- `ACCIDENT` — Vehicle collision or overturn
- `ROAD_BLOCK` — Road blocked by barriers, protests, or fallen trees
- `ROAD_CLOSURE` — Planned closure or government detour
- `FLOODING` — Water accumulation or submerged road
- `LANDSLIDE` — Mud, rockfall, or embankment collapse
- `ROAD_DAMAGE` — Deep potholes, asphalt failure, or open trench
- `CONSTRUCTION` — Active roadwork or equipment blockage
- `HEAVY_TRAFFIC` — Gridlock or crawl-speed congestion
- `HAZARD` — Animals on road, debris, slippery surface, unlit hazard
- `OTHER` — Miscellaneous road emergency

### Severity Levels (`severity`)
- `LOW` — Minor slowdown; passable with caution
- `MEDIUM` — Significant slowdown or lane obstruction (Default)
- `HIGH` — Major hazard, lane fully blocked or dangerous condition
- `CRITICAL` — Completely impassable road or imminent danger to life

### Verification Status (`verification`)
- `UNVERIFIED` — Newly reported; awaiting community or moderator consensus
- `COMMUNITY_CONFIRMED` — Received $\ge 3$ community confirmations
- `MODERATOR_VERIFIED` — Explicitly approved by a GuzoMate moderator or admin

### Incident Status (`status`)
- `PENDING` — Awaiting initial confirmations (default upon creation)
- `ACTIVE` — Confirmed and active on live traveler maps
- `RESOLVED` — Hazard cleared or road reopened
- `REJECTED` — Disputed or flagged as invalid by moderation
- `EXPIRED` — Exceeded time-to-live expiration window

---

## 3. Endpoints Reference

### 3.1 Create Incident Report

Submits a new crowdsourced road incident. If another incident of the same type was reported within 500 meters in the past 2 hours, the API rejects it with `409 Conflict`.

- **Endpoint:** `POST /api/v1/incidents`
- **Auth Required:** Yes (`Bearer <accessToken>`)
- **Rate Limit:** 30 per hour
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "type": "FLOODING",
  "description": "Heavy water accumulation near Gotera interchange underpass. Small vehicles cannot pass.",
  "severity": "HIGH",
  "lat": 9.0014,
  "lon": 38.7512,
  "occurredAt": "2026-10-27T10:30:00.000Z",
  "evidenceUrl": "https://example.com/images/flooding-gotera.jpg"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `type` | `IncidentType` | **Yes** | Valid incident type enum. |
| `description` | `string` | **Yes** | 5 to 2000 characters. |
| `severity` | `IncidentSeverity`| No | `"LOW"`, `"MEDIUM"`, `"HIGH"`, `"CRITICAL"`. Default: `"MEDIUM"`. |
| `lat` | `number` | **Yes** | Latitude between -90 and 90. |
| `lon` | `number` | **Yes** | Longitude between -180 and 180. |
| `occurredAt` | `ISO string` | No | Timestamp when observed (defaults to current time). |
| `evidenceUrl` | `string (URL)`| No | Photo or media URL (max 1024 chars). |

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "c71e21b0-449e-4e4a-b5e1-8f5bc65181a9",
    "type": "FLOODING",
    "description": "Heavy water accumulation near Gotera interchange underpass. Small vehicles cannot pass.",
    "severity": "HIGH",
    "status": "PENDING",
    "verification": "UNVERIFIED",
    "location": {
      "lat": 9.0014,
      "lon": 38.7512
    },
    "confirmationsCount": 0,
    "disputesCount": 0,
    "occurredAt": "2026-10-27T10:30:00.000Z",
    "expiresAt": "2026-10-27T18:30:00.000Z",
    "evidenceUrl": "https://example.com/images/flooding-gotera.jpg",
    "reporter": {
      "id": "e6a578bc-3212-4299-8cfb-665e729a8f21",
      "name": "Abebe Bikila"
    },
    "createdAt": "2026-10-27T10:30:00.000Z",
    "updatedAt": "2026-10-27T10:30:00.000Z"
  }
}
```

#### Duplicate Report Error (`409 Conflict`)
```json
{
  "success": false,
  "error": {
    "code": "DUPLICATE_REPORT",
    "message": "A similar incident was recently reported near this location. You can confirm or dispute the existing report."
  }
}
```
> [!TIP]
> **Frontend UX Tip:** When catching `DUPLICATE_REPORT`, show a prompt: *"A similar report already exists nearby. Would you like to confirm the existing report instead?"* and trigger `GET /incidents/nearby` to display it.

---

### 3.2 Get Nearby Incidents (PostGIS Geospatial Query)

Queries all active and pending incidents within a radius, sorted in ascending order of proximity (`distanceMeters`).

- **Endpoint:** `GET /api/v1/incidents/nearby`
- **Auth Required:** No (Public)
- **Query Parameters:**

| Parameter | Type | Required | Default | Description |
| :--- | :--- | :--- | :--- | :--- |
| `lat` | `number` | **Yes** | — | Center latitude (-90 to 90). |
| `lon` | `number` | **Yes** | — | Center longitude (-180 to 180). |
| `radius` | `number` | No | `5000` | Search radius in meters (100m to 50,000m). |
| `type` | `string` | No | — | Filter by specific `IncidentType`. |
| `severity` | `string` | No | — | Filter by `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`. |
| `status` | `string` | No | — | Filter by status (`PENDING`, `ACTIVE`, etc.). |
| `page` | `integer` | No | `1` | Pagination page number ($\ge 1$). |
| `limit` | `integer` | No | `20` | Items per page (max 100). |

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "c71e21b0-449e-4e4a-b5e1-8f5bc65181a9",
        "type": "FLOODING",
        "description": "Heavy water accumulation near Gotera interchange underpass.",
        "severity": "HIGH",
        "status": "PENDING",
        "verification": "UNVERIFIED",
        "location": {
          "lat": 9.0014,
          "lon": 38.7512
        },
        "distanceMeters": 420.5,
        "confirmationsCount": 2,
        "disputesCount": 0,
        "occurredAt": "2026-10-27T10:30:00.000Z",
        "expiresAt": "2026-10-27T18:30:00.000Z",
        "evidenceUrl": null,
        "createdAt": "2026-10-27T10:30:00.000Z",
        "updatedAt": "2026-10-27T10:35:00.000Z"
      }
    ]
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

---

### 3.3 List Incidents (Filter & Feed)

General listing endpoint with sorting and date filters. Excludes `REJECTED` and `EXPIRED` incidents by default unless explicitly specified.

- **Endpoint:** `GET /api/v1/incidents`
- **Auth Required:** No (Public)
- **Query Parameters:**
  - `type`: Incident category
  - `severity`: Severity enum
  - `status`: Incident status
  - `startDate`: ISO 8601 string
  - `endDate`: ISO 8601 string
  - `sortBy`: `"newest"` (default), `"oldest"`, or `"severity"`
  - `page`: default `1`
  - `limit`: default `20`

---

### 3.4 Get Incident by ID

Fetches single incident details. If the traveler sends an `Authorization: Bearer <token>` header, the response includes `userVote` showing whether this user previously voted (`"CONFIRM"` | `"DISPUTE"` | `null`).

- **Endpoint:** `GET /api/v1/incidents/:id`
- **Auth Required:** Optional (`Bearer <token>`)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "c71e21b0-449e-4e4a-b5e1-8f5bc65181a9",
    "type": "FLOODING",
    "description": "Heavy water accumulation near Gotera interchange underpass.",
    "severity": "HIGH",
    "status": "ACTIVE",
    "verification": "COMMUNITY_CONFIRMED",
    "location": {
      "lat": 9.0014,
      "lon": 38.7512
    },
    "confirmationsCount": 4,
    "disputesCount": 0,
    "occurredAt": "2026-10-27T10:30:00.000Z",
    "expiresAt": "2026-10-27T18:30:00.000Z",
    "evidenceUrl": null,
    "reporter": {
      "id": "e6a578bc-3212-4299-8cfb-665e729a8f21",
      "name": "Abebe Bikila"
    },
    "userVote": "CONFIRM",
    "createdAt": "2026-10-27T10:30:00.000Z",
    "updatedAt": "2026-10-27T10:40:00.000Z"
  }
}
```

---

### 3.5 Update Incident Report

Enables editing the description, severity, or photo.
- **Allowed Users:** The original reporter (only if report is still `PENDING`), or any Moderator/Admin.
- **Endpoint:** `PATCH /api/v1/incidents/:id`
- **Auth Required:** Yes

#### Request Body
```json
{
  "description": "Updated: water has receded to single lane, vehicles can slowly pass now.",
  "severity": "MEDIUM",
  "evidenceUrl": "https://example.com/updated-photo.jpg"
}
```

---

### 3.6 Withdraw or Delete Incident

- **Allowed Users:** Original reporter (only if `PENDING`), or Admin.
- **Endpoint:** `DELETE /api/v1/incidents/:id`
- **Auth Required:** Yes

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "c71e21b0-449e-4e4a-b5e1-8f5bc65181a9",
    "deleted": true
  }
}
```

---

## 4. TypeScript Interfaces for Frontend

```typescript
export type IncidentType =
  | 'ACCIDENT'
  | 'ROAD_BLOCK'
  | 'ROAD_CLOSURE'
  | 'FLOODING'
  | 'LANDSLIDE'
  | 'ROAD_DAMAGE'
  | 'CONSTRUCTION'
  | 'HEAVY_TRAFFIC'
  | 'HAZARD'
  | 'OTHER';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type IncidentStatus = 'PENDING' | 'ACTIVE' | 'RESOLVED' | 'REJECTED' | 'EXPIRED';
export type VerificationStatus = 'UNVERIFIED' | 'COMMUNITY_CONFIRMED' | 'MODERATOR_VERIFIED';

export interface IncidentLocation {
  lat: number;
  lon: number;
}

export interface Incident {
  id: string;
  type: IncidentType;
  description: string;
  severity: IncidentSeverity;
  status: IncidentStatus;
  verification: VerificationStatus;
  location: IncidentLocation;
  distanceMeters?: number;
  confirmationsCount: number;
  disputesCount: number;
  occurredAt?: string;
  expiresAt?: string;
  evidenceUrl?: string | null;
  reporter?: {
    id: string;
    name: string | null;
  };
  userVote?: 'CONFIRM' | 'DISPUTE' | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIncidentPayload {
  type: IncidentType;
  description: string;
  severity?: IncidentSeverity;
  lat: number;
  lon: number;
  occurredAt?: string;
  evidenceUrl?: string;
}

export interface NearbyIncidentsParams {
  lat: number;
  lon: number;
  radius?: number;
  type?: IncidentType;
  severity?: IncidentSeverity;
  status?: IncidentStatus;
  page?: number;
  limit?: number;
}
```

---

## 5. Map & UI Integration Guidelines

### 5.1 Color Scheme & Icons by Severity & Type
```typescript
export const SEVERITY_COLORS: Record<IncidentSeverity, string> = {
  LOW: '#10B981',      // Green / Info
  MEDIUM: '#F59E0B',   // Amber / Warning
  HIGH: '#EF4444',     // Red / Danger
  CRITICAL: '#7F1D1D', // Dark Red / Severe
};

export const INCIDENT_TYPE_ICONS: Record<IncidentType, string> = {
  ACCIDENT: 'car-crash',
  ROAD_BLOCK: 'barrier',
  ROAD_CLOSURE: 'no-entry',
  FLOODING: 'water-alert',
  LANDSLIDE: 'rockfall',
  ROAD_DAMAGE: 'cone',
  CONSTRUCTION: 'hard-hat',
  HEAVY_TRAFFIC: 'traffic-jam',
  HAZARD: 'alert-triangle',
  OTHER: 'alert-circle',
};
```

### 5.2 React Hook for Live Nearby Incidents (Map View)
```typescript
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { Incident } from '../types/incidents';

export function useNearbyIncidents(lat: number, lon: number, radius = 5000) {
  return useQuery<{ items: Incident[]; total: number }>({
    queryKey: ['incidents', 'nearby', { lat, lon, radius }],
    queryFn: async () => {
      const res = await apiClient.get('/incidents/nearby', {
        params: { lat, lon, radius, limit: 50 },
      });
      return {
        items: res.data.data.items,
        total: res.data.meta.total,
      };
    },
    refetchInterval: 30000, // Poll every 30s while map is active
    staleTime: 15000,
  });
}
```
