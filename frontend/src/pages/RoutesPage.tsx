import React, { useState } from 'react';
import { 
  Route as RouteIcon, 
  ChevronDown, 
  Navigation, 
  Truck, 
  Bus, 
  Car,
  ShieldCheck,
  CreditCard
} from 'lucide-react';
import { GuzoMap, CorridorWaypoint } from '../components/map/GuzoMap';

interface CorridorData {
  name: string;
  distance: string;
  estTime: string;
  traffic: string;
  maxRidge: string;
  surface: string;
  depots: string;
  origin: string;
  originAlt: string;
  waypoints: CorridorWaypoint[];
  routeCoordinates: [number, number][];
}

export const RoutesPage: React.FC = () => {
  const [selectedCorridor, setSelectedCorridor] = useState<'A2' | 'A1' | 'A3'>('A2');
  const [travelMode, setTravelMode] = useState<'driving' | 'transit' | 'freight'>('driving');
  const [mapLayer, setMapLayer] = useState<'terrain' | 'satellite' | 'standard'>('terrain');
  const [mobileTab, setMobileTab] = useState<'details' | 'map'>('details');
  const [isNavigating, setIsNavigating] = useState(false);

  // Exact OpenStreetMap corridor coordinate paths and waypoint telemetry
  const corridorData: Record<'A2' | 'A1' | 'A3', CorridorData> = {
    A2: {
      name: 'Addis Ababa – Debre Birhan – Dessie (A2 Corridor)',
      distance: '128 km',
      estTime: '2h 25m',
      traffic: 'Normal',
      maxRidge: '3,120m',
      surface: 'Asphalt 94% Smooth • 6 km resurfacing near Legetafo',
      depots: '3 Fuel Depots Open',
      origin: 'Meskel Square / Bole Medhane Alem, Addis Ababa',
      originAlt: '2,355m',
      routeCoordinates: [
        [9.0054, 38.7885], // Bole
        [9.0410, 38.7610], // Megenagna
        [9.0667, 38.8667], // Legetafo
        [9.1500, 39.0200], // Sendafa
        [9.3300, 39.3000], // Sheno
        [9.6800, 39.5300], // Debre Birhan
        [9.8500, 39.7500], // Termaber Summit Pass (3,120m)
        [10.0200, 39.7800], // Debre Sina
        [11.1300, 39.6300], // Dessie
      ],
      waypoints: [
        { 
          name: 'Addis Ababa Gateway', 
          coords: [9.0054, 38.7885],
          alt: '2,355m', 
          note: 'Corridor Gateway • Bole Interchange' 
        },
        { 
          name: 'Sheno Dairy & Depot', 
          coords: [9.3300, 39.3000],
          alt: '2,850m',
          stock: '100% Stock', 
          note: 'Fresh highland yogurt, injera lounges & diesel refill point' 
        },
        { 
          name: 'Termaber Summit Ridge', 
          coords: [9.8500, 39.7500],
          alt: '3,120m', 
          note: 'High altitude mountain pass & fog zone (Km 98.4)' 
        }
      ]
    },
    A1: {
      name: 'Addis Ababa – Mojo – Hawassa Expressway (Rift Valley)',
      distance: '275 km',
      estTime: '3h 15m',
      traffic: 'Smooth Flow',
      maxRidge: '1,890m',
      surface: 'Toll 6-lane modern bypass • Grade-separated',
      depots: '8 Service Plazas Open',
      origin: 'Bole Medhane Alem / Kality Interchange, Addis Ababa',
      originAlt: '2,200m',
      routeCoordinates: [
        [9.0054, 38.7885], // Bole
        [8.9000, 38.7600], // Kality
        [8.8200, 38.8300], // Dukem
        [8.7500, 38.9800], // Bishoftu
        [8.5800, 39.1200], // Mojo Dry Port
        [8.4000, 38.9500], // Meki
        [8.1500, 38.7200], // Zeway
        [7.0500, 38.4800], // Lake Hawassa
      ],
      waypoints: [
        { 
          name: 'Addis Toll Plaza', 
          coords: [8.9000, 38.7600],
          alt: '2,150m', 
          note: 'Contactless RFID & Telebirr QR fast lanes' 
        },
        { 
          name: 'Mojo Dry Port Interchange', 
          coords: [8.5800, 39.1200],
          alt: '1,820m',
          note: 'High capacity expressway junction' 
        },
        { 
          name: 'Lake Hawassa Resorts', 
          coords: [7.0500, 38.4800],
          alt: '1,680m', 
          note: 'Southern travel destination' 
        }
      ]
    },
    A3: {
      name: 'Addis Ababa – Ambo – Nekemte (Western Corridor)',
      distance: '330 km',
      estTime: '4h 40m',
      traffic: 'Moderate',
      maxRidge: '2,450m',
      surface: 'Paved highway • Mountain curves',
      depots: '5 Fuel Stations Open',
      origin: 'Asco / Wingate Roundabout, Addis Ababa',
      originAlt: '2,400m',
      routeCoordinates: [
        [9.0054, 38.7885], // Addis Ababa
        [9.0500, 38.7100], // Wingate / Asco
        [9.0600, 38.5100], // Holeta
        [9.0200, 38.2500], // Ginchi
        [8.9800, 37.8500], // Ambo
        [9.0800, 36.5500], // Nekemte
      ],
      waypoints: [
        { 
          name: 'Addis Wingate Gate', 
          coords: [9.0500, 38.7100],
          alt: '2,400m', 
          note: 'West exit gateway' 
        },
        { 
          name: 'Ambo Mineral Springs', 
          coords: [8.9800, 37.8500],
          alt: '2,100m', 
          note: 'Rest & tea halt' 
        },
        { 
          name: 'Nekemte Commercial Hub', 
          coords: [9.0800, 36.5500],
          alt: '2,080m', 
          note: 'Western terminal city' 
        }
      ]
    }
  };

  const activeData = corridorData[selectedCorridor];

  return (
    <div className="flex-1 flex flex-col lg:flex-row min-h-[calc(100vh-4rem)] bg-[#f8faf8] font-sans relative">
      {/* Mobile / Tablet Segmented View Switcher */}
      <div className="lg:hidden p-3 bg-white border-b border-gray-200 flex items-center justify-center gap-2 sticky top-16 z-30 shadow-xs">
        <button
          type="button"
          onClick={() => setMobileTab('details')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            mobileTab === 'details'
              ? 'bg-[#183a2b] text-white shadow-xs'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Corridor Plan & Waypoints
        </button>
        <button
          type="button"
          onClick={() => setMobileTab('map')}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
            mobileTab === 'map'
              ? 'bg-[#183a2b] text-white shadow-xs'
              : 'bg-gray-100 text-gray-700'
          }`}
        >
          Interactive OSM Map
        </button>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* LEFT PANEL: HIGHLAND CORRIDOR PLANNER CONTROLS */}
      {/* --------------------------------------------------------------------- */}
      <aside className={`w-full lg:w-[480px] xl:w-[520px] bg-white border-r border-[#e2e8e3] shrink-0 z-20 shadow-[2px_0_12px_rgba(0,0,0,0.03)] overflow-y-auto p-4 sm:p-5 space-y-5 ${
        mobileTab === 'map' ? 'hidden lg:block' : 'block'
      }`}>
        {/* Title & Corridor Selector */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#f0f7f3] text-[#183a2b] flex items-center justify-center">
              <RouteIcon className="w-4 h-4 text-[#183a2b]" />
            </div>
            <h1 className="text-base font-extrabold text-gray-950 tracking-tight">
              Highland Corridor Planner
            </h1>
          </div>
        </div>

        {/* Origin Input */}
        <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-2xl relative">
          <div className="flex items-start gap-2.5">
            <div className="mt-1 flex flex-col items-center">
              <div className="h-4 w-4 rounded-full border-2 border-[#183a2b] bg-white flex items-center justify-center">
                <div className="h-1.5 w-1.5 rounded-full bg-[#183a2b]" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between text-[11px] text-gray-500 mb-0.5">
                <span className="font-semibold uppercase tracking-wider text-gray-700">ORIGIN (መነሻ)</span>
                <span className="font-mono font-bold text-[#183a2b]">Alt: {activeData.originAlt}</span>
              </div>
              <p className="text-xs sm:text-sm font-bold text-gray-900 truncate">
                {activeData.origin}
              </p>
            </div>
          </div>
        </div>

        {/* Corridor Selector Dropdown */}
        <div>
          <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1.5">
            Select Highway Corridor (የአውራ ጎዳና መስመር)
          </label>
          <div className="relative">
            <select
              value={selectedCorridor}
              onChange={(e) => setSelectedCorridor(e.target.value as 'A2' | 'A1' | 'A3')}
              className="w-full bg-white border border-[#d1e2d8] text-xs sm:text-sm font-extrabold text-gray-950 py-2.5 pl-3 pr-8 rounded-xl shadow-xs focus:outline-none focus:ring-2 focus:ring-[#183a2b] cursor-pointer appearance-none"
            >
              <option value="A2">Addis Ababa – Debre Birhan – Dessie (A2 Corridor • 3,120m)</option>
              <option value="A1">Addis Ababa – Mojo – Hawassa Expressway (Rift Valley • 6-Lane)</option>
              <option value="A3">Addis Ababa – Ambo – Nekemte (Western Corridor)</option>
            </select>
            <ChevronDown className="w-4 h-4 text-gray-500 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Travel Mode Tabs matching Screen-3 */}
        <div className="grid grid-cols-3 gap-2">
          {/* Driving / 4WD */}
          <button
            type="button"
            onClick={() => setTravelMode('driving')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              travelMode === 'driving'
                ? 'bg-[#183a2b] text-white border-[#183a2b] shadow-sm'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Car className="w-4 h-4" />
              <span className="text-[10px] font-bold">Best Flow</span>
            </div>
            <div className="text-xs font-bold leading-tight">Driving / 4WD</div>
            <div className="text-[11px] opacity-80 mt-0.5">{activeData.estTime}</div>
          </button>

          {/* Intercity Transit */}
          <button
            type="button"
            onClick={() => setTravelMode('transit')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              travelMode === 'transit'
                ? 'bg-[#183a2b] text-white border-[#183a2b] shadow-sm'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Bus className="w-4 h-4" />
              <span className="text-[10px] font-bold">Radio Sync</span>
            </div>
            <div className="text-xs font-bold leading-tight">Intercity Bus</div>
            <div className="text-[11px] opacity-80 mt-0.5">3h 05m</div>
          </button>

          {/* Heavy Freight */}
          <button
            type="button"
            onClick={() => setTravelMode('freight')}
            className={`p-3 rounded-2xl border text-left transition-all cursor-pointer ${
              travelMode === 'freight'
                ? 'bg-[#183a2b] text-white border-[#183a2b] shadow-sm'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
            }`}
          >
            <div className="flex items-center justify-between mb-1">
              <Truck className="w-4 h-4" />
              <span className="text-[10px] font-bold">Winch Ready</span>
            </div>
            <div className="text-xs font-bold leading-tight">Heavy Freight</div>
            <div className="text-[11px] opacity-80 mt-0.5">4h 15m</div>
          </button>
        </div>

        {/* Selected Route Summary Banner */}
        <div className="p-4 bg-[#f0f7f3] border border-[#d1e2d8] rounded-2xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider bg-[#183a2b] text-white px-2 py-0.5 rounded">
              Selected Route Profile
            </span>
            <span className="text-xs font-mono font-bold text-[#183a2b]">
              Distance: {activeData.distance}
            </span>
          </div>
          <h2 className="text-sm font-extrabold text-gray-950">
            {activeData.name}
          </h2>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-white rounded-xl border border-gray-200">
              <span className="block text-[10px] text-gray-500">Max Ridge Ridge</span>
              <span className="font-bold text-[#183a2b] font-mono">{activeData.maxRidge}</span>
            </div>
            <div className="p-2 bg-white rounded-xl border border-gray-200">
              <span className="block text-[10px] text-gray-500">Traffic Status</span>
              <span className="font-bold text-emerald-700">{activeData.traffic}</span>
            </div>
          </div>
          <p className="text-[11px] text-gray-600">
            <strong>Road Quality:</strong> {activeData.surface}
          </p>
        </div>

        {/* Waypoints & Mountain Passes List */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
              Corridor Waypoints & Altitude Locks
            </h3>
            <span className="text-[11px] text-gray-500">{activeData.waypoints.length} Monitored Points</span>
          </div>

          <div className="space-y-2">
            {activeData.waypoints.map((wp, idx) => (
              <div 
                key={wp.name}
                className="p-3 bg-white rounded-xl border border-gray-200 hover:border-[#183a2b]/30 shadow-2xs transition-all flex items-start gap-3"
              >
                <div className="h-6 w-6 rounded-full bg-[#f0f7f3] text-[#183a2b] font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-900 truncate">{wp.name}</span>
                    {wp.alt && (
                      <span className="text-[10px] font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {wp.alt}
                      </span>
                    )}
                    {wp.stock && (
                      <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {wp.stock}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5 leading-relaxed">{wp.note}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Start Navigation Action Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => {
              setIsNavigating(true);
              setMobileTab('map');
            }}
            className="w-full py-3 px-4 bg-[#183a2b] hover:bg-[#122e22] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <Navigation className="w-4 h-4 text-emerald-400" />
            <span>{isNavigating ? 'Live Telemetry Active on Map' : 'Start Corridor Navigation'}</span>
          </button>
        </div>
      </aside>

      {/* --------------------------------------------------------------------- */}
      {/* RIGHT PANEL: OPENSTREETMAP LEAFLET CORRIDOR VIEW */}
      {/* --------------------------------------------------------------------- */}
      <main className={`flex-1 h-[calc(100vh-4rem)] relative overflow-hidden ${
        mobileTab === 'details' ? 'hidden lg:block' : 'block'
      }`} aria-label="Interactive OpenStreetMap Corridor View">
        {/* Top-Right Map Layer Controls */}
        <div className="absolute top-4 right-4 z-30 flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-gray-200/80 shadow-md">
          <button
            type="button"
            onClick={() => setMapLayer('terrain')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mapLayer === 'terrain'
                ? 'bg-[#183a2b] text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>▲ Topo Relief</span>
          </button>
          <button
            type="button"
            onClick={() => setMapLayer('standard')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mapLayer === 'standard'
                ? 'bg-[#183a2b] text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>Standard OSM</span>
          </button>
          <button
            type="button"
            onClick={() => setMapLayer('satellite')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              mapLayer === 'satellite'
                ? 'bg-[#183a2b] text-white shadow-xs'
                : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            <span>Satellite</span>
          </button>
        </div>

        {/* Live Leaflet OpenStreetMap Canvas */}
        <GuzoMap
          customRoute={activeData.routeCoordinates}
          waypoints={activeData.waypoints}
          mapStyle={mapLayer}
          className="w-full h-full"
        />

        {/* Bottom Floating Corridor Telemetry & Tow Badges */}
        <div className="absolute bottom-4 left-4 right-4 z-30 space-y-2 pointer-events-auto max-w-4xl">
          {/* Audit & Tow Badges matching Screen-3 */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="bg-white/95 backdrop-blur-md rounded-xl border border-gray-200 p-2.5 flex items-center gap-2 shadow-xs">
              <ShieldCheck className="w-4 h-4 text-[#183a2b] shrink-0" />
              <div className="truncate">
                <span className="block font-bold text-gray-900 leading-tight">Transport Guild Audited</span>
                <span className="text-[10px] text-gray-500">Telemetry verified 08:30 AM</span>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md rounded-xl border border-gray-200 p-2.5 flex items-center gap-2 shadow-xs">
              <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
              <div className="truncate">
                <span className="block font-bold text-gray-900 leading-tight">Termaber Heavy Tow</span>
                <span className="text-[10px] text-gray-500">Recovery unit on standby km 102</span>
              </div>
            </div>

            <div className="bg-white/95 backdrop-blur-md rounded-xl border border-gray-200 p-2.5 flex items-center gap-2 shadow-xs">
              <CreditCard className="w-4 h-4 text-indigo-600 shrink-0" />
              <div className="truncate">
                <span className="block font-bold text-gray-900 leading-tight">Toll Plaza Ready</span>
                <span className="text-[10px] text-gray-500">Contactless QR fast lanes</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default RoutesPage;
