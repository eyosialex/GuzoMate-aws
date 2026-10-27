# GuzoMate API — Frontend Integration Master Index 🚗🛡️

Welcome to the **GuzoMate Frontend Developer Integration Guide**. This index connects to individual, exhaustive integration guides created inside each module folder under [`src/modules/`](file:///home/eyob/code/hackaton/GuzoMate-aws/backend/src/modules).

---

## 📚 Module-by-Module Integration Guides

| # | Module | Path to Documentation | Primary Purpose | Base Path | Auth Required? |
| :-: | :--- | :--- | :--- | :--- | :-: |
| 1 | **Auth** | [`src/modules/auth/FRONTEND_INTEGRATION.md`](file:///home/eyob/code/hackaton/GuzoMate-aws/backend/src/modules/auth/FRONTEND_INTEGRATION.md) | Traveler registration, login, JWT issuance, and session bootstrap (`/auth/me`). | `/api/v1/auth` | Mixed |
| 2 | **Users** | [`src/modules/users/FRONTEND_INTEGRATION.md`](file:///home/eyob/code/hackaton/GuzoMate-aws/backend/src/modules/users/FRONTEND_INTEGRATION.md) | Profile management, push notification preferences, geofence radius slider, user stats, and admin moderation. | `/api/v1/users` | Yes (`Bearer`) |
| 3 | **Incidents** | [`src/modules/incidents/FRONTEND_INTEGRATION.md`](file:///home/eyob/code/hackaton/GuzoMate-aws/backend/src/modules/incidents/FRONTEND_INTEGRATION.md) | Crowdsourced road hazards, PostGIS nearby geospatial search, duplicate detection, and automated lifecycle TTL. | `/api/v1/incidents` | Mixed |
| 4 | **Confirmations** | [`src/modules/confirmations/FRONTEND_INTEGRATION.md`](file:///home/eyob/code/hackaton/GuzoMate-aws/backend/src/modules/confirmations/FRONTEND_INTEGRATION.md) | Community consensus voting (`CONFIRM` / `DISPUTE`), automated 3-vote threshold activation, and disputes flagging. | `/api/v1/incidents/:id/confirm` | Yes (`Bearer`) |
| 5 | **Notifications** | [`src/modules/notifications/FRONTEND_INTEGRATION.md`](file:///home/eyob/code/hackaton/GuzoMate-aws/backend/src/modules/notifications/FRONTEND_INTEGRATION.md) | In-app notification center (unread counts, mark read) and multi-platform device token registration (Web Push, iOS, Android). | `/api/v1/notifications` | Yes (`Bearer`) |
| 6 | **Moderation** | [`src/modules/moderation/FRONTEND_INTEGRATION.md`](file:///home/eyob/code/hackaton/GuzoMate-aws/backend/src/modules/moderation/FRONTEND_INTEGRATION.md) | Staff review queue for disputed/pending incidents, status state machine transitions, and immutable audit logs. | `/api/v1/moderation` | `MODERATOR` or `ADMIN` |
| 7 | **Saved Places & Places** | [`src/modules/saved-places/FRONTEND_INTEGRATION.md`](file:///home/eyob/code/hackaton/GuzoMate-aws/backend/src/modules/saved-places/FRONTEND_INTEGRATION.md) | 13,800+ Addis Ababa OpenStreetMap POI discovery (`/places/nearby`) and traveler bookmarking (`/saved-places`). | `/api/v1/saved-places` & `/api/v1/places` | Mixed |
| 8 | **Assistant** | [`src/modules/assistant/FRONTEND_INTEGRATION.md`](file:///home/eyob/code/hackaton/GuzoMate-aws/backend/src/modules/assistant/FRONTEND_INTEGRATION.md) | Zero-hallucination multilingual AI travel companion in Amharic, Afaan Oromo, & English, structured cards, and speech. | `/api/v1/assistant` | Public / Optional User ID |
| 9 | **Travel Services** | [`src/modules/travel-services/FRONTEND_INTEGRATION.md`](file:///home/eyob/code/hackaton/GuzoMate-aws/backend/src/modules/travel-services/FRONTEND_INTEGRATION.md) | Weather forecasts, arrival clothing advice, OSRM multimodal routing with hazard alerts, Addis transit, and STT/TTS. | `/api/v1` (`/weather`, `/routes`, `/speech`) | Mixed |

---

## 🌐 Global API Standards & Conventions

### 1. Base URL
All API endpoints are mounted under `/api/v1`:
```text
https://your-api-domain.com/api/v1
```

### 2. Standard Success Response Envelope
Every successful API response follows this consistent JSON structure:
```json
{
  "success": true,
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "total": 45,
    "totalPages": 3
  }
}
```

### 3. Standard Error Response Envelope
Every failure response returns a standard structure with an uppercase `code` enum:
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request parameters.",
    "details": [
      { "path": ["email"], "message": "Invalid email address" }
    ]
  }
}
```

### 4. Common Error Codes
- `UNAUTHORIZED` (401): Missing or expired JWT token.
- `FORBIDDEN` (403): User lacks permissions (e.g., normal traveler attempting moderator routes) or account is suspended.
- `NOT_FOUND` (404): Resource not found.
- `CONFLICT` (409): Duplicate email or duplicate road incident reported within 500m / 2 hours.
- `RATE_LIMIT_EXCEEDED` (429): Exceeded IP rate limit.
- `BAD_REQUEST` (400): Schema or state machine validation failed.

### 5. Supported Languages
GuzoMate natively supports three languages across UI copy, audio, and assistant intelligence:
- **`en`**: English
- **`am`**: Amharic (አማርኛ)
- **`om`**: Afaan Oromo (Oromoo)
