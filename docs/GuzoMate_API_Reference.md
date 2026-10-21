# GuzoMate — API Reference

**Version:** 2.0  
**Base path:** `/api/v1`  
**Status:** Proposed internal API contract  
**Last updated:** 2026-10-22

This is GuzoMate's application API proposal, not a claim that external providers expose these exact endpoints. Provider-specific calls belong in adapters and must follow the providers' current official documentation.

## 1. Conventions

Base URL: `https://<your-api-host>/api/v1`

Common headers:
```http
Content-Type: application/json
Authorization: Bearer <access-token>
Accept-Language: en
```

`Authorization` is required for protected endpoints. `Accept-Language` is optional and initially accepts `en`, `am`, or `om`.

Coordinates use decimal degrees (`lat` -90..90, `lon` -180..180). Distances are meters; temperatures are Celsius; timestamps are ISO 8601 with timezone.

Standard error:
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "One or more fields are invalid.",
    "details": [{ "field": "lat", "message": "Must be between -90 and 90." }],
    "requestId": "req_example"
  }
}
```

Common HTTP statuses: `200`, `201`, `204`, `400`, `401`, `403`, `404`, `409`, `413`, `422`, `429`, `502`, `503`, `504`.

**Provider boundary:** the React frontend calls GuzoMate only. The backend calls OSM-related data services, Addis Transit, WeatherAPI, Addis AI, and Gemini. Never expose provider credentials in the browser.

## 2. Endpoint summary

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| POST | `/auth/register` | Public | Register |
| POST | `/auth/login` | Public | Login |
| GET | `/me` | User | Current profile |
| PATCH | `/me/preferences` | User | Language/preferences |
| GET | `/places/nearby` | Optional | Nearby OSM places |
| GET | `/places/:id` | Optional | Place details |
| GET | `/routes` | Optional | Addis Transit route adapter |
| GET | `/weather/current` | Optional | Current weather |
| GET | `/weather/forecast` | Optional | Forecast |
| GET | `/weather/arrival-advice` | Optional | Arrival suggestions |
| POST | `/assistant/query` | Optional/Policy | Gemini + RAG |
| POST | `/speech/transcriptions` | User | Speech-to-text if supported |
| POST | `/speech/synthesis` | Optional/User | Text-to-speech if supported |
| GET | `/saved-places` | User | List saved places |
| POST | `/saved-places` | User | Save place |
| DELETE | `/saved-places/:placeId` | User | Unsave place |
| POST | `/incidents` | User | Submit incident |
| GET | `/incidents/nearby` | Optional | Nearby incidents |
| GET | `/incidents/:id` | Optional | Incident details |
| POST | `/incidents/:id/confirmations` | User | Confirm/dispute |
| POST | `/incidents/:id/resolve` | User/moderator policy | Resolution signal |
| POST | `/incidents/:id/flags` | User | Flag report |
| GET | `/notification-preferences` | User | Read settings |
| PUT | `/notification-preferences` | User | Update settings |
| PATCH | `/admin/incidents/:id/status` | Moderator | Moderate report |

## 3. Authentication and profile

### POST `/auth/register`
Request:
```json
{
  "email": "traveler@example.com",
  "password": "a-long-unique-password",
  "preferredLanguage": "en"
}
```
Response `201`:
```json
{
  "user": {
    "id": "uuid",
    "email": "traveler@example.com",
    "preferredLanguage": "en",
    "role": "USER"
  },
  "accessToken": "<token>"
}
```
Validate credentials and password policy; rate-limit registration; never return password hashes.

### POST `/auth/login`
Request:
```json
{ "email": "traveler@example.com", "password": "..." }
```
Response `200`: user summary and access token. Use generic failure messages to reduce account enumeration.

### GET `/me`
Returns the authenticated user's profile, language preference, and role; never return secrets.

### PATCH `/me/preferences`
Request:
```json
{ "preferredLanguage": "om", "units": "metric" }
```
Initial language values: `en`, `am`, `om`. Reject unsupported values.

## 4. Places — OSM + PostGIS

### GET `/places/nearby`
Query parameters:
- Required: `lat`, `lon`.
- Optional: `radiusMeters`, `category`, `limit`, `cursor`, `query`, `language`.
- Categories may include `restaurant`, `hotel`, `hospital`, `pharmacy`, `mechanic`, `fuel`, `cafe`.

Example:
```http
GET /api/v1/places/nearby?lat=9.03&lon=38.74&radiusMeters=3000&category=restaurant&limit=20
```

Response `200`:
```json
{
  "items": [
    {
      "id": "place_uuid",
      "name": "Example Restaurant",
      "category": "restaurant",
      "location": { "lat": 9.031, "lon": 38.742 },
      "distanceMeters": 245,
      "address": null,
      "tags": { "amenity": "restaurant", "cuisine": "ethiopian" },
      "source": "openstreetmap",
      "osm": { "type": "node", "id": "123456" }
    }
  ],
  "nextCursor": null,
  "attribution": "© OpenStreetMap contributors"
}
```
Illustrative only; real values must come from the stored source data. Omit or null missing attributes, never guess.

### GET `/places/:id`
Returns a normalized place by GuzoMate ID or `404`.

OSM implementation rules:
- Normalize nodes, ways, and relations.
- Use PostGIS for distance and geographic filtering.
- Preserve source IDs and attribution.
- Do not rely on public Overpass as an unlimited production backend.

## 5. Routing — Addis Transit adapter

### GET `/routes`
Parameters: `originLat`, `originLon`, `destinationLat`, `destinationLon`; optional `mode`, `departAt`, `language`.

Example:
```http
GET /api/v1/routes?originLat=9.03&originLon=38.74&destinationLat=9.02&destinationLon=38.75&language=en
```

Normalized response example:
```json
{
  "provider": "addis-transit",
  "routes": [
    {
      "id": "route_option_1",
      "durationSeconds": null,
      "distanceMeters": null,
      "summary": "Route details supplied by provider",
      "segments": [],
      "sourceUpdatedAt": null
    }
  ],
  "limitations": []
}
```
Populate fields only if the provider returns them. This proposal does not assume all route modes, live data, fares, timetables, or turn-by-turn navigation are available. Verify the provider contract. If unavailable, return a clear `502`/`503` or empty result with limitations.

## 6. Weather — WeatherAPI

### GET `/weather/current`
Parameters: `lat`, `lon`, optional `language`.

Response example:
```json
{
  "location": { "lat": 9.03, "lon": 38.74 },
  "current": {
    "temperatureC": 22.5,
    "condition": "Cloudy",
    "precipitationMm": null,
    "windKph": null
  },
  "provider": "weatherapi",
  "retrievedAt": "2026-10-22T15:00:00Z",
  "cached": true
}
```

### GET `/weather/forecast`
Parameters: `lat`, `lon`, `days` within plan limits, optional `language`.

Response example:
```json
{
  "location": { "lat": 9.03, "lon": 38.74 },
  "forecast": [
    {
      "date": "2026-10-23",
      "hourly": [
        {
          "time": "2026-10-23T14:00:00+03:00",
          "temperatureC": 23,
          "condition": "Possible rain",
          "precipitationProbability": 65
        }
      ]
    }
  ],
  "provider": "weatherapi",
  "retrievedAt": "2026-10-22T15:00:00Z",
  "cached": false
}
```

### GET `/weather/arrival-advice`
Parameters: `lat`, `lon`, `arrivalTime` (ISO 8601), optional `language`.

Response example:
```json
{
  "arrivalTime": "2026-10-23T14:00:00+03:00",
  "forecast": {
    "temperatureC": 23,
    "condition": "Possible rain",
    "precipitationProbability": 65
  },
  "suggestions": [
    {
      "type": "accessory",
      "text": "Consider carrying an umbrella",
      "reason": "Forecast indicates a chance of rain"
    }
  ],
  "language": "en",
  "provider": "weatherapi",
  "retrievedAt": "2026-10-22T15:00:00Z"
}
```
Examples are illustrative, not live forecasts. Derive advice from actual returned fields. If arrival time exceeds the forecast horizon, disclose the limitation.

## 7. Assistant — Gemini + RAG

### POST `/assistant/query`
Authentication policy may be optional or required; set this consistently during implementation.

Request:
```json
{
  "query": "Find a quiet hotel near me and tell me whether it may rain when I arrive.",
  "language": "en",
  "location": { "lat": 9.03, "lon": 38.74 },
  "arrivalTime": "2026-10-23T14:00:00+03:00",
  "filters": {
    "radiusMeters": 5000,
    "categories": ["hotel"]
  }
}
```

Response example:
```json
{
  "answer": "I found nearby mapped accommodation options. The forecast indicates a chance of rain at your requested arrival time, so consider carrying an umbrella.",
  "language": "en",
  "intent": "nearby_places_and_weather",
  "places": [],
  "weather": null,
  "incidents": [],
  "sources": [
    { "type": "openstreetmap", "retrievedAt": "2026-10-22T15:00:00Z" },
    { "type": "weatherapi", "retrievedAt": "2026-10-22T15:00:00Z" }
  ],
  "limitations": []
}
```
Empty arrays/nulls are placeholders. Real responses must include only retrieved facts.

Pipeline:
1. Determine response language and intent.
2. Parse location, time, category, and preferences.
3. Fetch structured places, routes, weather, and/or incidents as required.
4. Apply PostGIS constraints before semantic ranking.
5. Use pgvector for relevant text when useful.
6. Build source-labelled context and call Gemini.
7. Validate output and include source metadata and limitations.

Never use embeddings as the source of truth for current weather, route status, distance, or incident status.

## 8. Speech — Addis AI adapter (conditional)

Implement these internal endpoints only after confirming Addis AI's actual operations, language support, formats, and official API contract.

### POST `/speech/transcriptions`
- Auth required.
- Accept multipart audio or the provider-documented format.
- Enforce MIME type, file size, duration, and rate limits.
- Response example:
```json
{
  "text": "Transcribed words returned by the provider",
  "language": "am",
  "provider": "addis-ai"
}
```

### POST `/speech/synthesis`
Request example:
```json
{
  "text": "Your route may be affected by a reported road closure.",
  "language": "om",
  "voice": null
}
```
Return documented audio bytes or a short-lived server-controlled URL, depending on the confirmed provider contract. Never expose provider credentials. Unsupported operations/languages should return a clear `501`/`422` and keep text interaction available.

## 9. Saved places

### GET `/saved-places`
Returns the authenticated user's saved places with pagination.

### POST `/saved-places`
Request:
```json
{ "placeId": "place_uuid" }
```
Response `201`:
```json
{ "placeId": "place_uuid", "saved": true, "createdAt": "2026-10-22T15:00:00Z" }
```
Choose and document either idempotent success or `409` for an already-saved place.

### DELETE `/saved-places/:placeId`
Deletes only the authenticated user's association. Return `204`.

## 10. Incidents

Initial types: `ACCIDENT`, `ROAD_CLOSURE`, `FLOODING`, `LANDSLIDE`, `ROAD_DAMAGE`, `CONSTRUCTION`, `HEAVY_TRAFFIC`, `OTHER`.

Statuses: `PENDING`, `ACTIVE`, `RESOLVED`, `REJECTED`, `EXPIRED`.

### POST `/incidents`
Auth required.

Request:
```json
{
  "type": "ROAD_CLOSURE",
  "description": "Road appears blocked by construction.",
  "location": { "lat": 9.031, "lon": 38.742 },
  "occurredAt": "2026-10-22T15:20:00+03:00"
}
```

Response `201`:
```json
{
  "id": "incident_uuid",
  "type": "ROAD_CLOSURE",
  "status": "PENDING",
  "verification": "UNVERIFIED",
  "location": { "lat": 9.031, "lon": 38.742 },
  "createdAt": "2026-10-22T12:21:00Z",
  "expiresAt": null
}
```
The server sets reporter ID, status, verification, creation time, and expiry. Ignore client-supplied status or severity.

### GET `/incidents/nearby`
Parameters: `lat`, `lon`, optional `radiusMeters`, `type`, `status`, `since`, `limit`, `cursor`.

Response:
```json
{
  "items": [
    {
      "id": "incident_uuid",
      "type": "ROAD_CLOSURE",
      "description": "Road appears blocked by construction.",
      "status": "ACTIVE",
      "verification": "COMMUNITY_CONFIRMED",
      "location": { "lat": 9.031, "lon": 38.742 },
      "distanceMeters": 430,
      "createdAt": "2026-10-22T12:21:00Z",
      "expiresAt": null
    }
  ],
  "nextCursor": null
}
```
Do not return reporter contact details.

### GET `/incidents/:id`
Returns public incident details, status, verification level, timestamps, and permitted confirmation summary.

### POST `/incidents/:id/confirmations`
Request:
```json
{ "confirmationType": "STILL_PRESENT" }
```
Possible values include `STILL_PRESENT`, `RESOLVED`, `INACCURATE`. Enforce one active confirmation per user/report; a reporter cannot count their own confirmation as independent corroboration.

### POST `/incidents/:id/resolve`
For ordinary users, this may submit a resolution signal. Only authorized moderators/workflows may change canonical status to `RESOLVED`.

### POST `/incidents/:id/flags`
Request:
```json
{ "reason": "INACCURATE", "details": "The road is open now." }
```
Rate-limit and audit flags.

### PATCH `/admin/incidents/:id/status`
Moderator/admin only.

Request:
```json
{
  "status": "ACTIVE",
  "reason": "Reviewed against corroborating reports"
}
```
Audit actor, timestamp, previous/new status, and reason. Return `403` to unauthorized users.

## 11. Notification preferences

### GET `/notification-preferences`
Returns the authenticated user's settings.

### PUT `/notification-preferences`
Request:
```json
{
  "enabled": true,
  "radiusMeters": 5000,
  "incidentTypes": ["ACCIDENT", "ROAD_CLOSURE", "FLOODING"]
}
```
Validate radius and types. Device tokens should use a protected device endpoint if multiple devices are supported. Saving preferences does not mean a notification has been delivered.

## 12. Provider error handling
Normalize errors to:
- `PROVIDER_TIMEOUT`
- `PROVIDER_UNAVAILABLE`
- `PROVIDER_RATE_LIMITED`
- `PROVIDER_INVALID_RESPONSE`
- `FEATURE_UNSUPPORTED`

Do not expose stack traces, internal URLs, or secrets. Use bounded retries for safe/idempotent calls. Cache only in line with provider terms and freshness requirements.

## 13. Security
- Validate every path, query, and body field.
- Enforce saved-place ownership and moderator roles.
- Rate-limit AI, speech, auth, incident submissions, and flags.
- Keep Gemini, WeatherAPI, Addis Transit, and Addis AI keys server-side.
- Use request IDs and audit logs without logging credentials, raw audio, or unnecessary location history.
- Use idempotency keys for incident submission and notification jobs where appropriate.

## 14. Provider verification checklist
Before implementation, confirm each provider's official base URL/docs, authentication, supported features/languages, request and response schema, errors, quotas/costs, attribution, caching, commercial-use permissions, and data retention rules.

---
**End of API Reference**
