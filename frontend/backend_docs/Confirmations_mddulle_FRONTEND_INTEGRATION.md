# GuzoMate Confirmations Module — Frontend Integration Guide 🤝

## 1. Overview & Architecture

The **Confirmations Module** implements the crowdsourced verification and consensus mechanism for road hazard reports. It prevents fake news and outdated reports by allowing nearby travelers to corroborate (`CONFIRM`) or challenge (`DISPUTE`) reported incidents.

- **Mounted Endpoint:** `POST /api/v1/incidents/:id/confirm`
- **Authentication:** Mandatory (`Bearer <accessToken>`)
- **Automated State Transitions:**
  - When a `PENDING` incident reaches **3 confirmations** (`CONFIRMATIONS_TO_ACTIVATE = 3`), the backend automatically transitions its status to `ACTIVE`, its verification to `COMMUNITY_CONFIRMED`, and triggers real-time geofenced push alerts to nearby subscribed travelers.
  - When an incident reaches **3 disputes** (`DISPUTES_FOR_REVIEW = 3`), it creates an audit entry and flags the report in the Moderator Review Queue.

---

## 2. Business Rules & Guardrails

| Condition / Rule | HTTP Status | Error Code | Frontend Handling |
| :--- | :--- | :--- | :--- |
| **Self-voting prohibited:** Reporter cannot vote on their own incident | `400 Bad Request` | `BAD_REQUEST` | Disable vote buttons or hide them if `incident.reporter.id === currentUser.id`. |
| **Immutable terminal states:** Cannot vote on `RESOLVED`, `REJECTED`, or `EXPIRED` incidents | `400 Bad Request` | `BAD_REQUEST` | Disable vote buttons on resolved/expired reports. |
| **Duplicate vote:** Same action repeated (e.g. clicking "Confirm" twice) | `409 Conflict` | `CONFLICT` | Prevent duplicate clicks via optimistic state and UI feedback. |
| **Vote switching:** User changes vote from `CONFIRM` to `DISPUTE` (or vice versa) | `200 OK` | — | Supported seamlessly! Backend atomically adjusts both counters. |

---

## 3. Endpoint Reference

### 3.1 Vote on Incident (Confirm or Dispute)

- **Endpoint:** `POST /api/v1/incidents/:id/confirm`
- **Auth Required:** Yes (`Bearer <accessToken>`)
- **Headers:** `Content-Type: application/json`

#### URL Parameters
| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| `id` | `UUID string` | **Yes** | Target incident identifier. |

#### Request Body
```json
{
  "action": "CONFIRM"
}
```

| Field | Type | Required | Allowed Values |
| :--- | :--- | :--- | :--- |
| `action` | `string` | **Yes** | `"CONFIRM"` (corroborate) or `"DISPUTE"` (report false/cleared) |

#### Success Response (`200 OK`)
```json
{
  "success": true,
  "data": {
    "incidentId": "c71e21b0-449e-4e4a-b5e1-8f5bc65181a9",
    "action": "CONFIRM",
    "status": "ACTIVE",
    "verification": "COMMUNITY_CONFIRMED",
    "confirmationsCount": 3,
    "disputesCount": 0
  }
}
```

#### Error Responses
- **`400 Bad Request` (Self-Vote Prohibited):**
  ```json
  {
    "success": false,
    "error": {
      "code": "BAD_REQUEST",
      "message": "Reporters cannot confirm or dispute their own incident reports."
    }
  }
  ```
- **`400 Bad Request` (Inactive State):**
  ```json
  {
    "success": false,
    "error": {
      "code": "BAD_REQUEST",
      "message": "Cannot verify an incident that is already expired."
    }
  }
  ```
- **`409 Conflict` (Already Voted):**
  ```json
  {
    "success": false,
    "error": {
      "code": "CONFLICT",
      "message": "You have already voted to confirm this incident report."
    }
  }
  ```

---

## 4. TypeScript Interfaces for Frontend

```typescript
export type VoteAction = 'CONFIRM' | 'DISPUTE';

export interface VotePayload {
  action: VoteAction;
}

export interface VoteResult {
  incidentId: string;
  action: VoteAction;
  status: 'PENDING' | 'ACTIVE' | 'RESOLVED' | 'REJECTED' | 'EXPIRED';
  verification: 'UNVERIFIED' | 'COMMUNITY_CONFIRMED' | 'MODERATOR_VERIFIED';
  confirmationsCount: number;
  disputesCount: number;
}
```

---

## 5. Frontend UI Integration Recipe

### 5.1 Interactive Vote Buttons Component (React + TanStack Query)

Here is a ready-to-use component pattern with optimistic UI updates:

```tsx
import React from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../lib/api-client';
import { Incident } from '../types/incidents';
import { VoteAction, VoteResult } from '../types/confirmations';

interface VoteProps {
  incident: Incident;
  currentUserId?: string;
}

export const IncidentVoteButtons: React.FC<VoteProps> = ({ incident, currentUserId }) => {
  const queryClient = useQueryClient();
  const isReporter = currentUserId === incident.reporter?.id;
  const isTerminal = ['RESOLVED', 'REJECTED', 'EXPIRED'].includes(incident.status);

  const mutation = useMutation({
    mutationFn: async (action: VoteAction) => {
      const res = await apiClient.post(`/incidents/${incident.id}/confirm`, { action });
      return res.data.data as VoteResult;
    },
    onSuccess: (result) => {
      // Invalidate or update query cache
      queryClient.setQueryData(['incident', incident.id], (old: Incident) => ({
        ...old,
        status: result.status,
        verification: result.verification,
        confirmationsCount: result.confirmationsCount,
        disputesCount: result.disputesCount,
        userVote: result.action,
      }));
    },
  });

  if (isReporter) {
    return <span className="text-xs text-gray-500 italic">You reported this incident</span>;
  }

  if (isTerminal) {
    return <span className="text-xs text-gray-400">Voting closed ({incident.status.toLowerCase()})</span>;
  }

  return (
    <div className="flex items-center space-x-2">
      {/* Confirm Button */}
      <button
        onClick={() => mutation.mutate('CONFIRM')}
        disabled={mutation.isPending || incident.userVote === 'CONFIRM'}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition ${
          incident.userVote === 'CONFIRM'
            ? 'bg-emerald-600 text-white'
            : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
        }`}
      >
        <span>👍 Confirm</span>
        <span className="font-semibold ml-1">({incident.confirmationsCount})</span>
      </button>

      {/* Dispute Button */}
      <button
        onClick={() => mutation.mutate('DISPUTE')}
        disabled={mutation.isPending || incident.userVote === 'DISPUTE'}
        className={`px-3 py-1.5 rounded-lg text-sm font-medium flex items-center space-x-1.5 transition ${
          incident.userVote === 'DISPUTE'
            ? 'bg-rose-600 text-white'
            : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
        }`}
      >
        <span>👎 Dispute</span>
        <span className="font-semibold ml-1">({incident.disputesCount})</span>
      </button>
    </div>
  );
};
```
