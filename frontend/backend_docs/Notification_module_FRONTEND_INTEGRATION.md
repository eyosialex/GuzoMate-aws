# GuzoMate Notifications Module — Frontend Integration Guide 🔔

## 1. Overview & Architecture

The **Notifications Module** powers GuzoMate's real-time safety alerting infrastructure. It provides both in-app notification center functionality (notification bell with unread badge count) and multi-platform device push token registration (Web Push, iOS, and Android via Firebase Cloud Messaging / APNs).

- **Base URL:** `/api/v1/notifications`
- **Authentication:** All routes require `Authorization: Bearer <accessToken>`.

---

## 2. Endpoints Reference

### 2.1 Register Device Push Token

Registers or activates a device push token (FCM token / Web Push token) associated with the authenticated user account.

- **Endpoint:** `POST /api/v1/notifications/devices`
- **Auth Required:** Yes (`Bearer <accessToken>`)
- **Headers:** `Content-Type: application/json`

#### Request Body
```json
{
  "token": "fCM_token_string_example_abc123xyz456...",
  "platform": "web"
}
```

| Field | Type | Required | Allowed Values |
| :--- | :--- | :--- | :--- |
| `token` | `string` | **Yes** | Device push token (10 to 512 characters). |
| `platform` | `string` | No | `"web"`, `"android"`, or `"ios"`. Default: `"web"`. |

#### Success Response (`201 Created`)
```json
{
  "success": true,
  "data": {
    "id": "7817cbfa-3ff9-49c0-9fbb-8d519b52a781",
    "token": "fCM_token_string_example_abc123xyz456...",
    "platform": "web",
    "isActive": true
  }
}
```

---

### 2.2 Unregister / Deactivate Device Push Token

Deactivates a device token upon traveler logout to prevent notification delivery to shared or public devices.

- **Endpoint:** `DELETE /api/v1/notifications/devices/:token`
- **Auth Required:** Yes
- **URL Parameter:** `token` — The push token string to deactivate.

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "token": "fCM_token_string_example_abc123xyz456...",
    "active": false
  }
}
```

---

### 2.3 List In-App Notifications & Unread Count

Fetches traveler's notifications for the notification drawer/center. Includes real-time `unreadCount` for notification badge rendering.

- **Endpoint:** `GET /api/v1/notifications`
- **Auth Required:** Yes
- **Query Parameters:**

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `unreadOnly` | `boolean` (`"true"` \| `"false"`) | `false` | If `"true"`, filters to only unread notifications. |
| `page` | `integer` | `1` | Pagination page number ($\ge 1$). |
| `limit` | `integer` | `20` | Items per page (max 100). |

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "908d17f3-e5e5-47e1-8f55-1082aa376d29",
        "userId": "e6a578bc-3212-4299-8cfb-665e729a8f21",
        "incidentId": "c71e21b0-449e-4e4a-b5e1-8f5bc65181a9",
        "type": "INCIDENT_ALERT",
        "title": "🚨 Road Alert: FLOODING",
        "message": "Heavy water accumulation near Gotera interchange underpass. Small vehicles cannot pass. (Severity: HIGH)",
        "isRead": false,
        "deliveryStatus": "SENT",
        "deliveredAt": "2026-10-27T10:35:00.000Z",
        "createdAt": "2026-10-27T10:35:00.000Z",
        "updatedAt": "2026-10-27T10:35:00.000Z"
      }
    ],
    "unreadCount": 3
  },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 12,
    "totalPages": 1
  }
}
```

---

### 2.4 Mark Single Notification as Read

- **Endpoint:** `PATCH /api/v1/notifications/:id/read`
- **Auth Required:** Yes
- **URL Parameter:** `id` — Notification UUID

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "id": "908d17f3-e5e5-47e1-8f55-1082aa376d29",
    "isRead": true,
    "updatedAt": "2026-10-27T10:45:00.000Z"
  }
}
```

---

### 2.5 Mark All Notifications as Read

Clears all unread notifications in one click.

- **Endpoint:** `PATCH /api/v1/notifications/read-all`
- **Auth Required:** Yes

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "updatedCount": 3
  }
}
```

---

## 3. TypeScript Interfaces for Frontend

```typescript
export type DevicePlatform = 'ios' | 'android' | 'web';

export interface DeviceTokenPayload {
  token: string;
  platform?: DevicePlatform;
}

export interface InAppNotification {
  id: string;
  userId: string;
  incidentId: string | null;
  type: string; // e.g. 'INCIDENT_ALERT'
  title: string;
  message: string;
  isRead: boolean;
  deliveryStatus: 'PENDING' | 'SENT' | 'FAILED';
  deliveredAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsListResponse {
  items: InAppNotification[];
  unreadCount: number;
}
```

---

## 4. Frontend Integration Recipes

### 4.1 Notification Bell Component with Polling (React)
```tsx
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { NotificationsListResponse } from '../types/notifications';

export const NotificationBell: React.FC = () => {
  const queryClient = useQueryClient();

  const { data } = useQuery<NotificationsListResponse>({
    queryKey: ['notifications', 'summary'],
    queryFn: async () => {
      const res = await apiClient.get('/notifications?limit=5');
      return res.data.data;
    },
    refetchInterval: 30000, // Poll every 30s
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiClient.patch('/notifications/read-all');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="relative">
      <button className="p-2 rounded-full hover:bg-gray-100 transition relative">
        <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 bg-red-600 text-white text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
    </div>
  );
};
```

### 4.2 Web Push / FCM Registration Flow
```typescript
import { getMessaging, getToken } from 'firebase/messaging';
import { apiClient } from '../lib/api-client';

export async function registerPushNotifications() {
  try {
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Push notification permission denied by user.');
      return;
    }

    const messaging = getMessaging();
    const token = await getToken(messaging, {
      vapidKey: import.meta.env.VITE_FIREBASE_VAPID_KEY,
    });

    if (token) {
      await apiClient.post('/notifications/devices', {
        token,
        platform: 'web',
      });
      localStorage.setItem('guzomate_fcm_token', token);
    }
  } catch (error) {
    console.error('Failed to register push token:', error);
  }
}
```
