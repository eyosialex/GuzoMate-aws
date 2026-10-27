# GuzoMate Users Module — Frontend Integration Guide 👤

## 1. Overview & Architecture

The **Users Module** manages traveler profile details, language preferences, geospatial push notification subscriptions (alert radius & incident type filters), community activity stats, and administrator-level user moderation.

- **Base URL:** `/api/v1/users`
- **Authentication:** All endpoints require an `Authorization: Bearer <accessToken>` header.
- **Admin Access:** User listing and status modification endpoints require `role: ADMIN`.

---

## 2. Endpoints Reference

### 2.1 Get Current User Profile & Stats

Fetches the traveler's complete profile along with aggregated community participation counts.

- **Endpoint:** `GET /api/v1/users/me`
- **Auth Required:** Yes (`USER`, `MODERATOR`, or `ADMIN`)

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "e6a578bc-3212-4299-8cfb-665e729a8f21",
    "email": "traveler@example.com",
    "name": "Abebe Bikila",
    "role": "USER",
    "status": "ACTIVE",
    "preferredLanguage": "am",
    "createdAt": "2026-10-27T07:45:00.000Z",
    "updatedAt": "2026-10-27T07:45:00.000Z",
    "stats": {
      "reportedIncidentsCount": 14,
      "confirmationsCount": 38,
      "savedPlacesCount": 7
    }
  }
}
```

---

### 2.2 Update Profile Information

Updates the traveler's display name and preferred app UI/audio language.

- **Endpoint:** `PATCH /api/v1/users/me`
- **Auth Required:** Yes
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "name": "Abebe B.",
  "preferredLanguage": "om"
}
```

| Field | Type | Required | Rules |
| :--- | :--- | :--- | :--- |
| `name` | `string` | No | Min 2 characters, max 100 characters. |
| `preferredLanguage` | `string` | No | One of: `"en"`, `"am"`, `"om"`. |

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "e6a578bc-3212-4299-8cfb-665e729a8f21",
    "email": "traveler@example.com",
    "name": "Abebe B.",
    "role": "USER",
    "status": "ACTIVE",
    "preferredLanguage": "om",
    "updatedAt": "2026-10-27T08:12:00.000Z"
  }
}
```

---

### 2.3 Get Notification Preferences

Retrieves the current user's incident push alert settings (geographic radius and incident categories of interest).

- **Endpoint:** `GET /api/v1/users/me/notification-preferences`
- **Auth Required:** Yes

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "radiusMeters": 5000,
    "incidentTypes": ["ACCIDENT", "FLOODING", "ROAD_BLOCK"],
    "updatedAt": "2026-10-27T07:45:00.000Z"
  }
}
```

> [!NOTE]
> If `incidentTypes` is an empty array `[]`, the backend treats it as subscribing to **all** incident types.

---

### 2.4 Update Notification Preferences

Allows the traveler to toggle notifications, adjust their geofence radius slider (500m to 50km), and select specific incident types.

- **Endpoint:** `PATCH /api/v1/users/me/notification-preferences`
- **Auth Required:** Yes
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "enabled": true,
  "radiusMeters": 10000,
  "incidentTypes": ["ACCIDENT", "ROAD_BLOCK", "FLOODING", "CONSTRUCTION"]
}
```

| Field | Type | Required | Constraints |
| :--- | :--- | :--- | :--- |
| `enabled` | `boolean` | No | Enables or disables all alerts. |
| `radiusMeters` | `integer` | No | Min `500` (500 meters), max `50000` (50 km). |
| `incidentTypes` | `string[]` | No | Array of valid incident enums (see enum list below). |

#### Incident Types Enum
- `ACCIDENT`
- `ROAD_BLOCK`
- `ROAD_CLOSURE`
- `FLOODING`
- `LANDSLIDE`
- `ROAD_DAMAGE`
- `CONSTRUCTION`
- `HEAVY_TRAFFIC`
- `HAZARD`
- `OTHER`

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "enabled": true,
    "radiusMeters": 10000,
    "incidentTypes": ["ACCIDENT", "ROAD_BLOCK", "FLOODING", "CONSTRUCTION"],
    "updatedAt": "2026-10-27T08:15:00.000Z"
  }
}
```

---

### 2.5 Admin: List Users (`ADMIN` only)

Paginated list of users with filtering and search capabilities.

- **Endpoint:** `GET /api/v1/users`
- **Auth Required:** Yes (`ADMIN` role only)
- **Query Parameters:**

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `page` | `integer` | `1` | Page number ($\ge 1$). |
| `limit` | `integer` | `20` | Max results per page (1 to 100). |
| `role` | `string` | — | Filter by `"USER"`, `"MODERATOR"`, or `"ADMIN"`. |
| `status` | `string` | — | Filter by `"ACTIVE"` or `"SUSPENDED"`. |
| `search` | `string` | — | Partial match against email or name (case-insensitive). |

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "e6a578bc-3212-4299-8cfb-665e729a8f21",
        "email": "traveler@example.com",
        "name": "Abebe Bikila",
        "role": "USER",
        "status": "ACTIVE",
        "preferredLanguage": "am",
        "createdAt": "2026-10-27T07:45:00.000Z"
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

### 2.6 Admin: Change Role or Suspend User (`ADMIN` only)

Promotes/demotes user roles, or suspends/reactivates traveler accounts with an audit log reason.

- **Endpoint:** `PATCH /api/v1/users/:id/status`
- **Auth Required:** Yes (`ADMIN` role only)

#### Request Body
```json
{
  "role": "MODERATOR",
  "status": "ACTIVE",
  "reason": "Promoted to area community moderator"
}
```

| Field | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `role` | `string` | No | `"USER"`, `"MODERATOR"`, or `"ADMIN"`. |
| `status` | `string` | No | `"ACTIVE"` or `"SUSPENDED"`. |
| `reason` | `string` | No | Reason recorded in immutable audit log (max 500 chars). |

> [!CAUTION]
> Administrators cannot suspend their own account. Attempting to do so returns `400 Bad Request`.

---

## 3. TypeScript Interfaces for Frontend

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

export interface UserStats {
  reportedIncidentsCount: number;
  confirmationsCount: number;
  savedPlacesCount: number;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string | null;
  role: 'USER' | 'MODERATOR' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  preferredLanguage: 'en' | 'am' | 'om';
  createdAt: string;
  updatedAt: string;
  stats: UserStats;
}

export interface NotificationPreferences {
  enabled: boolean;
  radiusMeters: number;
  incidentTypes: IncidentType[];
  updatedAt: string;
}

export interface UpdateProfilePayload {
  name?: string;
  preferredLanguage?: 'en' | 'am' | 'om';
}

export interface UpdatePreferencesPayload {
  enabled?: boolean;
  radiusMeters?: number;
  incidentTypes?: IncidentType[];
}
```

---

## 4. Frontend Implementation Recipes

### 4.1 React Hook for Notification Preferences (TanStack Query)
```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { NotificationPreferences, UpdatePreferencesPayload } from '../types/users';

export function useNotificationPreferences() {
  const queryClient = useQueryClient();

  const query = useQuery<NotificationPreferences>({
    queryKey: ['user', 'notification-preferences'],
    queryFn: async () => {
      const res = await apiClient.get('/users/me/notification-preferences');
      return res.data.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (payload: UpdatePreferencesPayload) => {
      const res = await apiClient.patch('/users/me/notification-preferences', payload);
      return res.data.data;
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(['user', 'notification-preferences'], updated);
    },
  });

  return {
    preferences: query.data,
    isLoading: query.isLoading,
    updatePreferences: mutation.mutateAsync,
    isUpdating: mutation.isPending,
  };
}
```

### 4.2 Distance Slider UI Helper
```typescript
// Format meters to human-readable kilometers for the UI slider
export function formatRadius(meters: number): string {
  if (meters >= 1000) {
    const km = meters / 1000;
    return `${km % 1 === 0 ? km.toFixed(0) : km.toFixed(1)} km`;
  }
  return `${meters} m`;
}
```
