# GuzoMate Frontend — Highland Travel & Highway Safety UI 🚗🏔️

GuzoMate is an intelligent, multilingual travel and highway safety companion tailored for commuters and travelers across Addis Ababa and Ethiopian highland corridors (A2 Debre Birhan–Dessie, A1 Hawassa Expressway, A3 Western Corridor).

Built with **React 19**, **TypeScript**, **Tailwind CSS**, **Framer Motion (`motion`)**, **Leaflet**, and **React Router**, the application faithfully implements the verified highland visual design system from the `ui/` reference screens.

---

## 🏛️ Technology Stack & Dependencies

- **Runtime & UI**: React 19 (`react`, `react-dom`) with TypeScript in strict mode
- **Build Tool**: Vite 8 with code-splitting (`React.lazy` + `Suspense`)
- **Routing**: `react-router-dom` v7 with centralized route protection
- **Animations**: `framer-motion` (Motion for React) with tactile spring interactions and `prefers-reduced-motion` compliance
- **Styling**: Tailwind CSS configured with the Ethiopian Highland color system
- **Mapping**: `leaflet` & `react-leaflet` with custom highland markers and interactive layers
- **Icons**: `lucide-react`
- **State Management**: `zustand` (Map, Places, Language, Chat) + `AuthContext` (JWT session & user profile)

---

## 🎨 Design System & Color Tokens

Extracted directly from the UI reference images (`screen-2`, `screen-3`, `screen-6`, `screen-7`):

| Token | Hex / Class | Purpose |
|:---|:---|:---|
| **Highland Forest** (Primary) | `#183a2b` / `bg-forest-800` | Header brand, primary buttons ("Get Directions", "Start Navigation"), scout badges |
| **Deep Forest** | `#0f2b1d` / `bg-forest-900` | High-priority dispatch buttons ("Publish Hazard Report", "Call 991 Police") |
| **Forest Light Tint** | `#f0f7f3` / `bg-[#f0f7f3]` | Active pills, telemetry lock badges, subtle card fills |
| **Border Sage** | `#d1e2d8` / `border-[#d1e2d8]` | Clean card outlines, telemetry dividers |
| **Highland Neutral** | `#f8faf8` / `bg-[#f8faf8]` | Application canvas background with contour mesh accents |
| **Apparel Warning** | `#c97a2b` / `text-amber-800` | Weather chill alerts ("Gabi / warm woolen shawl recommended") |
| **Radar Red** | `#dc2626` / `text-red-600` | Roadblocks, landslides, live emergency indicators |
| **Verified Green** | `#16a34a` / `text-emerald-700` | Level-1 Trauma 100% oxygen availability, guild audited pins |

---

## 🛣️ Page Architecture & UI Reference Mapping

### 1. Home Page (`/`) — Highest Priority Travel Companion
- **Highland GPS Telemetry**: Real-time altitude pill (`2,355m`) and current scout identity (`Dawit A. • Selam Guild #418`).
- **Omni-Search Bar**: Instant keyword discovery for hospitals, pharmacies, EV chargers, and mountain passes.
- **4 Tactile Action Cards** (Animated with Framer Motion):
  - 🧭 *Explore Nearby Map* (`/explore`)
  - 💬 *Ask GuzoMate AI* (`/assistant`)
  - 🛣️ *Highland Corridors* (`/routes`)
  - ⚠️ *Report Road Hazard* (`/incidents/report`)
- **Highland Atmosphere Radar**: 21°C live weather with Entoto Pass fog warning and apparel advisory.
- **Active Road Radar**: Real-time hazard broadcasts with scout confirmation counters.
- **Verified Places & Facilities Carousel**: St. Paul's 24/7 Trauma, TotalEnergies EV fast charger, Entoto Mountain Lodge, Lion Pharmacy.
- **Strategic Corridor Showcase**: Addis–Debre Birhan–Dessie (A2) elevation preview.

### 2. Explore Map (`/explore`) — Direct Replica of `screen-2.png`
- **Left Panel**: Search bar, GPS status bar (`Bole Medhane Alem • Alt: 2,355m`), category filters (`All Services`, `Hospitals & Clinics`, `Pharmacies`, `Fuel & EV`), distance pills (`<2km`, `<5km`, `<10km`), Transport Guild Audited badge.
- **Expanded Detail Card**: 24/7 Level-1 Trauma badge, elevation (`2,410m`), Oxygen Res. (`100% Available`), multilingual staff (`English, አማርኛ, Oromoo`), direct phone dial (`011 275 0125`), "Get Directions (6 mins)" button.
- **Map View**: Custom highland markers, Terrain/Satellite/Incidents toggle, floating bottom weather pill with Entoto fog advisory.

### 3. Routes & Highland Corridor Planner (`/routes`) — Direct Replica of `screen-3.png`
- **Corridor Dropdown**: A2 Corridor (Addis–Debre Birhan–Dessie), A1 (Hawassa Expressway), A3 (Western Corridor).
- **Mode Tabs**: `Driving / 4WD` (2h 25m • 128 km), `Transit / Selam` (3h 10m), `Freight` (Pass Restricted).
- **Highland Elevation Gradient**: Max ridge `3,120m` (Termaber Pass), traffic status, road smoothness (`Asphalt 94% Smooth • 6 km resurfacing near Legetafo`), fuel depot count.
- **Corridor Actions**: "Start Live Highland Navigation", "Offline Pack (18 MB)", "Share Corridor Itinerary".
- **Waypoints & Depots**: Sheno Dairy & Depot (100% stock, fresh yogurt & injera lounge), Termaber Summit Ridge.
- **Alternate Route**: Southern Hawassa Expressway switch, guild audit badge, heavy tow unit at km 102, contactless toll QR indicator.

### 4. Road Incidents Radar (`/incidents`) & Report Hazard (`/incidents/report`) — Direct Replica of `screen-7.png`
- **Report Hazard Page**:
  - Scout GPS Lock: `9.0478° N, 38.7492° E (±3m)` • 14 Guild Endorsements • Telebirr SMS fallback.
  - Step 1: Hazard Category (Rockfall & Debris, Mountain Fog, Mudslide, Breakdown, Livestock, Bottleneck) + Severity selector.
  - Step 2: Corridor & KM Marker (`Km 98.4`), Local landmark (`Termaber Hairpin Curve #4`), barometric lock (`3,120m`), flow direction.
  - Step 3: Dual-script description + rapid hazard attribute chips (`Boulder Size >`, `Mist Below`, `Mud on Asphalt`, `Tow Truck Required`, `4WD Only`).
  - Step 4: Visual evidence preview + dashcam dropzone.
  - Step 5: Verified Scout Instant Broadcast vs Anonymous Under Review + Federal Police (991) direct dispatch.
  - Live Highland Topo Radar mini-map + Passenger & Driver Feed preview + Guild Charter standards.
- **Incidents Radar**: Live community verification voting (`Confirm` vs `Dispute`). Automatic status transition to `ACTIVE` upon reaching $\ge 3$ confirmations.

### 5. Emergency Contacts & Priority Direct Dial (`/emergency`) — Direct Replica of `screen-6.png`
- **Federal Highway Police (991)**: `+251 11 551 2700`, Cruiser Unit 04, Patrol Sector A2 Legetafo.
- **National Ambulance Service (907)**: Level 1 Trauma EMT, O2 Equipped, Tikur Anbessa ICU transfer.
- **Red Cross Ambulance (922)** & **Fire Command (939)**.
- **Atmospheric Chill Card**: 11°C dew point alert, gabi/warm woolen shawl advisory.
- **Testimonial Quote**: Lt. Fikru Tadesse (Sheno Sector Commander).

### 6. AI Travel Assistant (`/assistant`)
- Multilingual chat interface grounded with OSM places, weather forecasts, and transit schedules.
- Amharic, Oromo, and English intent handling.
- Voice memo speech recognition integration.

### 7. Auth, Profile & Settings (`/login`, `/register`, `/profile`, `/saved`, `/notifications`)
- Unauthenticated users cannot access protected routes. Direct URL visits automatically redirect to `/login` with return state.
- 1-Click Demo Login (`Dawit A. - Verified Scout` and `Eden B. - Commuter`).
- Notification preferences and alert radius slider (5km – 50km).

---

## 🚀 Running Locally

```bash
cd frontend
npm install
npm run dev
```
The application will launch at `http://localhost:5173`.

### Typecheck & Build
```bash
npm run build
```
Builds production-optimized, code-split chunks in `dist/` with zero TypeScript errors.

### Linting
```bash
npm run lint
```
Runs Oxlint across all TypeScript and React components.
