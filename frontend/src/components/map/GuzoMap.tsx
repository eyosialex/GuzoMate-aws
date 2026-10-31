import React, { useEffect, useMemo } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  Polyline, 
  useMap, 
  useMapEvents 
} from 'react-leaflet';
import L from 'leaflet';
import { Crosshair, AlertTriangle, Loader2, MapPin, Check } from 'lucide-react';
import { GeoLocation } from '../../types';
import { useAppStore } from '../../features/useAppStore';
import { usePlaces } from '../../hooks/usePlaces';
import { useIncidents } from '../../hooks/useIncidents';
import { IconButton } from '../common/IconButton';
import { IncidentVoteButtons } from '../incidents/IncidentVoteButtons';
import { Place, Incident } from '../../types';
import { formatLocationName, reverseGeocode } from '../../lib/addisLandmarks';

export interface CorridorWaypoint {
  name: string;
  coords: [number, number];
  alt?: string;
  note?: string;
  stock?: string;
}

export interface GuzoMapProps {
  customPlaces?: Place[];
  customRoute?: [number, number][];
  waypoints?: CorridorWaypoint[];
  mapStyle?: 'terrain' | 'satellite' | 'standard' | 'topo';
  className?: string;
}

/**
 * Custom DivIcons for Map Pins ensuring Fitts's Law touch area
 */
function createPlaceIcon(category: string, isSelected: boolean) {
  const bg = isSelected ? '#183a2b' : '#ffffff';
  const text = isSelected ? '#ffffff' : '#141d18';
  const border = isSelected ? '#34d399' : '#d1e2d8';

  const categoryEmoji: Record<string, string> = {
    hospital: '🏥',
    pharmacy: '💊',
    fuel: '⛽',
    cafe: '☕',
    restaurant: '🍲',
    hotel: '🏨',
    bank: '🏦',
  };
  const emoji = categoryEmoji[category.toLowerCase()] || '📍';

  return L.divIcon({
    className: 'custom-place-pin',
    html: `
      <div style="
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <div style="
          background-color: ${bg};
          color: ${text};
          border: 2px solid ${border};
          border-radius: 9999px;
          padding: 6px 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 5px;
          transform: scale(${isSelected ? 1.15 : 1});
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          <span>${emoji}</span>
          <span style="font-family: system-ui, sans-serif;">${category}</span>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function createIncidentIcon(_type: string, isSelected: boolean) {
  const bg = '#dc2626';

  return L.divIcon({
    className: 'custom-incident-pin',
    html: `
      <div style="
        width: 44px;
        height: 44px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
      ">
        <div style="
          background-color: ${bg};
          color: #ffffff;
          border: 2.5px solid #ffffff;
          border-radius: 9999px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(220,38,38,0.35);
          font-size: 14px;
          transform: scale(${isSelected ? 1.2 : 1});
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          ⚠️
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function createWaypointIcon(name: string, alt?: string) {
  return L.divIcon({
    className: 'custom-waypoint-pin',
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        transform: translate(-50%, -100%);
        pointer-events: auto;
      ">
        <div style="
          background: #183a2b;
          color: white;
          padding: 5px 9px;
          border-radius: 10px;
          border: 2px solid #34d399;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
          font-family: system-ui, sans-serif;
        ">
          <span>🏔️</span>
          <span>${name}</span>
          ${alt ? `<span style="background: rgba(255,255,255,0.22); padding: 1px 5px; border-radius: 5px; font-size: 9px; font-family: monospace;">${alt}</span>` : ''}
        </div>
        <div style="
          width: 0;
          height: 0;
          border-left: 6px solid transparent;
          border-right: 6px solid transparent;
          border-top: 7px solid #183a2b;
        "></div>
      </div>
    `,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

const userLocationIcon = L.divIcon({
  className: 'custom-user-pin',
  html: `
    <div style="
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background-color: #183a2b;
        border: 3px solid #ffffff;
        box-shadow: 0 2px 8px rgba(0,0,0,0.35);
      "></div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

/**
 * Ensures Leaflet tile rendering works seamlessly on mount, resize, and tab change
 */
function MapResizer() {
  const map = useMap();

  useEffect(() => {
    map.invalidateSize();
    const t1 = setTimeout(() => map.invalidateSize(), 150);
    const t2 = setTimeout(() => map.invalidateSize(), 600);

    const onResize = () => {
      map.invalidateSize();
    };
    window.addEventListener('resize', onResize);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', onResize);
    };
  }, [map]);

  return null;
}

/**
 * Controller component to handle map pan/zoom programmatically
 */
function MapViewController() {
  const map = useMap();
  const mapCenter = useAppStore((state) => state.mapCenter);
  const mapZoom = useAppStore((state) => state.mapZoom);

  useEffect(() => {
    map.flyTo(mapCenter, mapZoom, { duration: 1 });
  }, [mapCenter, mapZoom, map]);

  return null;
}

const draftLocationIcon = L.divIcon({
  className: 'custom-draft-pin',
  html: `
    <div style="
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        background-color: #d97706;
        color: #ffffff;
        border: 3px solid #ffffff;
        border-radius: 9999px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(217, 119, 6, 0.4);
        font-size: 15px;
      ">
        📍
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

/**
 * Fits map viewport automatically to the active highway corridor polyline or waypoints
 */
function MapAutoFitter({ 
  route, 
  waypoints 
}: { 
  route?: [number, number][]; 
  waypoints?: CorridorWaypoint[];
}) {
  const map = useMap();

  useEffect(() => {
    if (route && route.length > 1) {
      const bounds = L.latLngBounds(route.map(([lat, lon]) => [lat, lon]));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    } else if (waypoints && waypoints.length > 0) {
      const bounds = L.latLngBounds(waypoints.map((w) => w.coords));
      map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });
    }
  }, [route, waypoints, map]);

  return null;
}

const destinationPinIcon = L.divIcon({
  className: 'custom-destination-pin',
  html: `
    <div style="
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        background-color: #dc2626;
        color: #ffffff;
        border: 3px solid #ffffff;
        border-radius: 9999px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 4px 14px rgba(220, 38, 38, 0.45);
        font-size: 15px;
      ">
        🎯
      </div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

/**
 * Handle map click to drop pin or select coordinates (Destination or Incidents)
 */
function MapEventsHandler({ onMapClick }: { onMapClick?: (loc: GeoLocation) => void }) {
  const isPickingDestination = useAppStore((state) => state.isPickingDestination);
  const setDraftDestination = useAppStore((state) => state.setDraftDestination);
  const setIncidentDraftLocation = useAppStore((state) => state.setIncidentDraftLocation);

  useMapEvents({
    click(e) {
      const loc = { lat: e.latlng.lat, lon: e.latlng.lng };

      if (isPickingDestination) {
        const initialName = formatLocationName(loc);
        setDraftDestination({ location: loc, name: initialName });

        // Asynchronously refine address via reverse geocoding
        reverseGeocode(loc)
          .then((refinedName: string) => {
            if (refinedName && refinedName !== initialName) {
              setDraftDestination({ location: loc, name: refinedName });
            }
          })
          .catch(() => {});
        return;
      }

      setIncidentDraftLocation(loc);
      onMapClick?.(loc);
    },
  });

  return null;
}

export interface GuzoMapProps {
  showIncidents?: boolean;
  draftLocation?: GeoLocation | null;
  onMapClick?: (loc: GeoLocation) => void;
  onReportIncidentClick?: () => void;
  customPlaces?: Place[];
  customRoute?: [number, number][];
  waypoints?: CorridorWaypoint[];
  mapStyle?: 'terrain' | 'satellite' | 'standard' | 'topo';
  className?: string;
}

export const GuzoMap: React.FC<GuzoMapProps> = ({ 
  showIncidents = true,
  draftLocation,
  onMapClick,
  onReportIncidentClick,
  customPlaces,
  customRoute,
  waypoints,
  mapStyle = 'standard',
  className = '',
}) => {
  const userLocation = useAppStore((state) => state.userLocation);
  const userLocationName = useAppStore((state) => state.userLocationName);
  const userAltitude = useAppStore((state) => state.userAltitude);
  const isLocating = useAppStore((state) => state.isLocating);
  const requestCurrentLocation = useAppStore((state) => state.requestCurrentLocation);
  const mapCenter = useAppStore((state) => state.mapCenter);
  const mapZoom = useAppStore((state) => state.mapZoom);
  const setMapCenter = useAppStore((state) => state.setMapCenter);
  const setUserLocation = useAppStore((state) => state.setUserLocation);
  const setPageView = useAppStore((state) => state.setPageView);
  const setIncidentSubpage = useAppStore((state) => state.setIncidentSubpage);

  const selectedPlace = useAppStore((state) => state.selectedPlace);
  const setSelectedPlace = useAppStore((state) => state.setSelectedPlace);
  const selectedIncident = useAppStore((state) => state.selectedIncident);
  const setSelectedIncident = useAppStore((state) => state.setSelectedIncident);
  const selectedRoute = useAppStore((state) => state.selectedRoute);
  const openIncidentModal = useAppStore((state) => state.openIncidentModal);

  // Destination Picker Store Hooks
  const isPickingDestination = useAppStore((state) => state.isPickingDestination);
  const draftDestination = useAppStore((state) => state.draftDestination);
  const destinationLocation = useAppStore((state) => state.destinationLocation);
  const destinationName = useAppStore((state) => state.destinationName);
  const confirmDestination = useAppStore((state) => state.confirmDestination);
  const cancelPickingDestination = useAppStore((state) => state.cancelPickingDestination);

  const { places: storePlaces } = usePlaces();
  const { incidents, handleVoteResult } = useIncidents();

  // Use custom places if provided, otherwise fallback to store places
  const displayedPlaces = customPlaces && customPlaces.length > 0 ? customPlaces : storePlaces;

  // Extract route polyline coordinates safely
  const routeCoordinates = useMemo(() => {
    if (customRoute && customRoute.length > 0) {
      return customRoute;
    }
    if (!selectedRoute) return [];
    const coords: [number, number][] = [];
    if (Array.isArray(selectedRoute.segments)) {
      selectedRoute.segments.forEach((seg) => {
        if (Array.isArray(seg.coordinates)) {
          seg.coordinates.forEach((c) => {
            if (Array.isArray(c) && c.length >= 2 && isFinite(c[0]) && isFinite(c[1])) {
              coords.push([c[0], c[1]]);
            }
          });
        }
      });
    }
    return coords;
  }, [customRoute, selectedRoute]);

  const handleUseCurrentLocation = async () => {
    const loc = await requestCurrentLocation();
    if (loc) {
      try {
        localStorage.setItem('guzo_last_location', JSON.stringify({
          coords: loc,
          timestamp: Date.now(),
        }));
      } catch {}
      setMapCenter([loc.lat, loc.lon], 16);
    } else {
      setMapCenter([userLocation.lat, userLocation.lon], 15);
    }
  };

  const handleReportIncident = () => {
    if (onReportIncidentClick) {
      onReportIncidentClick();
    } else {
      setIncidentSubpage('submit');
      setPageView('incidents');
    }
  };

  // OpenStreetMap Tile Layer URL with fail-safe fallbacks
  const tileUrl = useMemo(() => {
    if (mapStyle === 'satellite') {
      return 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    }
    if (mapStyle === 'topo' || mapStyle === 'terrain') {
      // High-precision terrain / elevation relief
      return 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
    }
    // High-performance Standard OpenStreetMap
    return 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  }, [mapStyle]);

  const tileAttribution = useMemo(() => {
    if (mapStyle === 'satellite') {
      return '&copy; Esri &mdash; Earthstar Geographics & World Imagery';
    }
    if (mapStyle === 'topo' || mapStyle === 'terrain') {
      return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, SRTM | &copy; <a href="https://opentopomap.org">OpenTopoMap</a>';
    }
    return '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';
  }, [mapStyle]);

  return (
    <div className={`relative w-full h-full min-h-[420px] bg-[#fbfaf4] select-none overflow-hidden ${className}`}>
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <MapResizer />
        <MapViewController />
        <MapEventsHandler onMapClick={onMapClick} />
        {waypoints && <MapAutoFitter route={routeCoordinates} waypoints={waypoints} />}

        {/* Dynamic OpenStreetMap Tile Layer */}
        <TileLayer
          key={tileUrl}
          attribution={tileAttribution}
          url={tileUrl}
          maxZoom={19}
        />

        {/* Draft / Pinned Location Marker (When selecting location on map) */}
        {draftLocation && (
          <Marker
            position={[draftLocation.lat, draftLocation.lon]}
            icon={draftLocationIcon}
          >
            <Popup className="rounded-xl font-bold text-xs">
              <span className="text-secondary font-bold block">Pinned Incident Location</span>
              <span className="text-gray-600 text-[11px] block mt-0.5">
                {draftLocation.lat.toFixed(4)}, {draftLocation.lon.toFixed(4)}
              </span>
            </Popup>
          </Marker>
        )}

        {/* Active Destination Pin (Draft when selecting on map, or Confirmed Destination) */}
        {draftDestination ? (
          <Marker
            position={[draftDestination.location.lat, draftDestination.location.lon]}
            icon={destinationPinIcon}
          >
            <Popup className="rounded-xl font-bold text-xs" autoPan>
              <span className="text-red-600 font-bold block">Selected Destination</span>
              <span className="text-gray-800 text-[11px] block mt-0.5 font-medium">
                {draftDestination.name}
              </span>
              <span className="text-gray-400 font-mono text-[10px] block mt-0.5">
                {draftDestination.location.lat.toFixed(5)}, {draftDestination.location.lon.toFixed(5)}
              </span>
            </Popup>
          </Marker>
        ) : destinationLocation && selectedRoute ? (
          <Marker
            position={[destinationLocation.lat, destinationLocation.lon]}
            icon={destinationPinIcon}
          >
            <Popup className="rounded-xl font-bold text-xs">
              <span className="text-red-600 font-bold block">Route Destination</span>
              <span className="text-gray-800 text-[11px] block mt-0.5 font-medium">
                {destinationName || 'Destination'}
              </span>
              <span className="text-gray-400 font-mono text-[10px] block mt-0.5">
                {destinationLocation.lat.toFixed(5)}, {destinationLocation.lon.toFixed(5)}
              </span>
            </Popup>
          </Marker>
        ) : null}

        {/* User Location Marker */}
        <Marker
          position={[userLocation.lat, userLocation.lon]}
          icon={userLocationIcon}
        >
          <Popup className="rounded-xl font-medium text-xs">
            <span className="font-bold text-[#183a2b] block leading-tight">GPS Telemetry Locked</span>
            <span className="text-gray-600">{userLocationName} ({userAltitude})</span>
          </Popup>
        </Marker>

        {/* Highway Corridor Waypoint Markers */}
        {waypoints?.map((wp, idx) => (
          <Marker
            key={`wp-${idx}-${wp.name}`}
            position={wp.coords}
            icon={createWaypointIcon(wp.name, wp.alt)}
          >
            <Popup className="rounded-2xl p-1 text-xs">
              <div className="space-y-1">
                <span className="font-extrabold text-[#183a2b] block text-sm leading-tight">
                  {wp.name}
                </span>
                {wp.alt && (
                  <span className="font-mono text-[10px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.5 rounded">
                    Elevation: {wp.alt}
                  </span>
                )}
                {wp.stock && (
                  <span className="block text-[10px] font-bold text-emerald-700">
                    Stock: {wp.stock}
                  </span>
                )}
                <p className="text-gray-600 text-[11px] leading-relaxed">{wp.note}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Verified Places Markers from OpenStreetMap dataset */}
        {displayedPlaces.map((place) => (
          <Marker
            key={place.id}
            position={[place.location.lat, place.location.lon]}
            icon={createPlaceIcon(place.category, selectedPlace?.id === place.id)}
            eventHandlers={{
              click: () => setSelectedPlace(place),
            }}
          >
            <Popup className="rounded-2xl p-1 text-xs">
              <div className="space-y-1 max-w-xs">
                <span className="font-bold text-gray-950 block text-sm leading-tight">
                  {place.name}
                </span>
                <span className="text-gray-500 block text-[11px] leading-relaxed">
                  {place.address}
                </span>
                <div className="flex items-center gap-2 pt-1">
                  <span className="text-[#183a2b] font-bold text-[11px]">
                    {place.distanceMeters ? `${(place.distanceMeters / 1000).toFixed(1)} km away` : 'Addis Ababa'}
                  </span>
                  {place.tags?.elevation && (
                    <span className="font-mono text-[10px] bg-gray-100 px-1.5 py-0.2 rounded font-semibold">
                      Alt: {place.tags.elevation}
                    </span>
                  )}
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Incident Markers */}
        {showIncidents && incidents.map((inc) => (
          <Marker
            key={inc.id}
            position={[inc.location.lat, inc.location.lon]}
            icon={createIncidentIcon(inc.type, selectedIncident?.id === inc.id)}
            eventHandlers={{
              click: () => setSelectedIncident(inc),
            }}
          >
            <Popup className="rounded-2xl p-1 text-xs">
              <div className="space-y-2 p-1 min-w-[200px]">
                <div>
                  <span className="font-bold text-red-600 block leading-tight">
                    ⚠️ {inc.title || inc.type.replace(/_/g, ' ')}
                  </span>
                  <p className="text-gray-700 leading-relaxed text-xs mt-1">{inc.description}</p>
                  {inc.locationName && (
                    <span className="text-primary font-semibold text-[11px] block mt-1 leading-none">
                      📍 {inc.locationName}
                    </span>
                  )}
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <IncidentVoteButtons
                    incident={inc}
                    onVoteSuccess={handleVoteResult}
                    size="sm"
                  />
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Highway Corridor Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: '#10b981',
              weight: 5,
              opacity: 0.92,
              lineCap: 'round',
              lineJoin: 'round',
              dashArray: mapStyle === 'satellite' ? undefined : undefined,
            }}
          />
        )}
      </MapContainer>

      {/* Destination Picker Floating Overlay & Confirmation Card */}
      {isPickingDestination && (
        <div className="absolute inset-x-0 bottom-6 z-30 flex flex-col items-center px-4 pointer-events-none">
          {draftDestination ? (
            <div className="w-full max-w-md bg-white/95 backdrop-blur-xl rounded-2xl p-4 shadow-2xl border border-red-500/30 flex flex-col gap-3 pointer-events-auto transition-all animate-in fade-in duration-200">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-red-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-red-600 uppercase tracking-wider block leading-none">
                    Selected Destination
                  </span>
                  <h4 className="text-sm font-extrabold text-on-surface truncate leading-tight mt-1">
                    {draftDestination.name}
                  </h4>
                  <span className="font-mono text-[11px] text-gray-500 block mt-0.5">
                    {draftDestination.location.lat.toFixed(5)}, {draftDestination.location.lon.toFixed(5)}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                <button
                  type="button"
                  onClick={confirmDestination}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white rounded-xl text-xs font-semibold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Check className="w-4 h-4" />
                  <span>Use As Destination</span>
                </button>
                <button
                  type="button"
                  onClick={cancelPickingDestination}
                  className="px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-stone-900/95 text-white backdrop-blur-md px-4 py-2.5 rounded-full shadow-2xl border border-white/20 flex items-center gap-2.5 text-xs font-bold pointer-events-auto animate-bounce">
              <Crosshair className="w-4 h-4 text-emerald-400 animate-spin" />
              <span>Tap anywhere on the map to set your destination</span>
              <button
                type="button"
                onClick={cancelPickingDestination}
                className="ml-2 text-gray-400 hover:text-white underline cursor-pointer text-xs"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Controls on Map */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2.5">
        <IconButton
          aria-label="Use current location"
          title="Use current location"
          icon={isLocating ? <Loader2 className="w-5 h-5 text-primary animate-spin" /> : <Crosshair className="w-5 h-5 text-gray-800" />}
          variant="glass"
          shape="circle"
          onClick={handleUseCurrentLocation}
          disabled={isLocating}
          className="h-11 w-11 shadow-[0_8px_24px_rgba(0,0,0,0.14)] bg-white/95 backdrop-blur-md hover:bg-white disabled:opacity-60 cursor-pointer"
        />

        <IconButton
          aria-label="Report road incident"
          title="Report road incident"
          icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
          variant="glass"
          shape="circle"
          onClick={handleReportIncident}
          className="h-11 w-11 shadow-[0_8px_24px_rgba(0,0,0,0.12)] bg-white/95 backdrop-blur-md hover:bg-white"
        />
      </div>
    </div>
  );
};

export default GuzoMap;
