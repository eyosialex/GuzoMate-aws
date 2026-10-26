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
import { 
  Crosshair, 
  AlertTriangle 
} from 'lucide-react';
import { useAppStore } from '../../features/useAppStore';
import { usePlaces } from '../../hooks/usePlaces';
import { useIncidents } from '../../hooks/useIncidents';
import { IconButton } from '../common/IconButton';

/**
 * Custom DivIcons for Map Pins ensuring Fitts's Law 44px touch area
 */
function createPlaceIcon(category: string, isSelected: boolean) {
  const bg = isSelected ? '#4f46e5' : '#ffffff';
  const text = isSelected ? '#ffffff' : '#222222';
  const border = isSelected ? '#3730a3' : '#e5e7eb';

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
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
          display: flex;
          align-items: center;
          gap: 4px;
          transform: scale(${isSelected ? 1.15 : 1});
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        ">
          <span>📍</span>
          <span>${category}</span>
        </div>
      </div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
}

function createIncidentIcon(status: string, _type: string, isSelected: boolean) {
  const colorMap: Record<string, string> = {
    PENDING: '#f59e0b', // Amber
    ACTIVE: '#ef4444',  // Red
    RESOLVED: '#10b981', // Green
  };
  const bg = colorMap[status] || '#ef4444';

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
          border: 2px solid #ffffff;
          border-radius: 9999px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 10px rgba(0,0,0,0.22);
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
      <div class="user-location-pulse" style="
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background-color: #4f46e5;
        border: 3px solid #ffffff;
        box-shadow: 0 2px 6px rgba(0,0,0,0.25);
      "></div>
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

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

/**
 * Handle map click to drop pin or select coordinates
 */
function MapEventsHandler() {
  const setIncidentDraftLocation = useAppStore((state) => state.setIncidentDraftLocation);

  useMapEvents({
    click(e) {
      const loc = { lat: e.latlng.lat, lon: e.latlng.lng };
      setIncidentDraftLocation(loc);
    },
  });

  return null;
}

interface GuzoMapProps {
  showIncidents?: boolean;
}

export const GuzoMap: React.FC<GuzoMapProps> = ({ showIncidents = true }) => {
  const userLocation = useAppStore((state) => state.userLocation);
  const mapCenter = useAppStore((state) => state.mapCenter);
  const mapZoom = useAppStore((state) => state.mapZoom);
  const setMapCenter = useAppStore((state) => state.setMapCenter);

  const selectedPlace = useAppStore((state) => state.selectedPlace);
  const setSelectedPlace = useAppStore((state) => state.setSelectedPlace);
  const selectedIncident = useAppStore((state) => state.selectedIncident);
  const setSelectedIncident = useAppStore((state) => state.setSelectedIncident);
  const selectedRoute = useAppStore((state) => state.selectedRoute);
  const openIncidentModal = useAppStore((state) => state.openIncidentModal);

  const { places } = usePlaces();
  const { incidents } = useIncidents();

  // Extract route polyline coordinates if selected
  const routeCoordinates = useMemo(() => {
    if (!selectedRoute) return [];
    const coords: [number, number][] = [];
    selectedRoute.segments.forEach((seg) => {
      seg.coordinates.forEach((c) => coords.push(c));
    });
    return coords;
  }, [selectedRoute]);

  const recenterToUser = () => {
    setMapCenter([userLocation.lat, userLocation.lon], 15);
  };

  return (
    <div className="relative w-full h-full bg-gray-100 overflow-hidden select-none">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        zoomControl={false}
        className="w-full h-full z-0"
      >
        <MapViewController />
        <MapEventsHandler />

        {/* OpenStreetMap Tiles with strict ODbL attribution */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />

        {/* User Location Marker */}
        <Marker
          position={[userLocation.lat, userLocation.lon]}
          icon={userLocationIcon}
        >
          <Popup className="rounded-xl font-medium text-xs">
            <span className="font-semibold text-indigo-600 block leading-tight">Your Location</span>
            <span className="text-gray-600">Bole, Addis Ababa</span>
          </Popup>
        </Marker>

        {/* Mapped Places Markers */}
        {places.map((place) => (
          <Marker
            key={place.id}
            position={[place.location.lat, place.location.lon]}
            icon={createPlaceIcon(place.category, selectedPlace?.id === place.id)}
            eventHandlers={{
              click: () => setSelectedPlace(place),
            }}
          >
            <Popup className="rounded-2xl p-1 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-gray-900 block text-sm leading-tight">
                  {place.name}
                </span>
                <span className="text-gray-500 block leading-relaxed">{place.address}</span>
                <span className="text-indigo-600 font-semibold block leading-none">
                  {place.distanceMeters ? `${place.distanceMeters}m away` : 'Addis Ababa'}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Incident Markers */}
        {showIncidents && incidents.map((inc) => (
          <Marker
            key={inc.id}
            position={[inc.location.lat, inc.location.lon]}
            icon={createIncidentIcon(inc.status, inc.type, selectedIncident?.id === inc.id)}
            eventHandlers={{
              click: () => setSelectedIncident(inc),
            }}
          >
            <Popup className="rounded-2xl p-1 text-xs">
              <div className="space-y-1">
                <span className="font-semibold text-red-600 block leading-tight">
                  ⚠️ {inc.type}
                </span>
                <p className="text-gray-700 leading-relaxed">{inc.description}</p>
                <span className="text-gray-400 text-[10px] block leading-none">
                  Status: {inc.status}
                </span>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Route Polyline */}
        {routeCoordinates.length > 0 && (
          <Polyline
            positions={routeCoordinates}
            pathOptions={{
              color: '#4f46e5',
              weight: 5,
              opacity: 0.88,
              lineCap: 'round',
              lineJoin: 'round',
            }}
          />
        )}
      </MapContainer>

      {/* Floating Action Controls on Map: Apple-style Frosted Glass with 44px Touch Targets */}
      <div className="absolute top-4 right-4 z-20 flex flex-col gap-2.5">
        <IconButton
          aria-label="Recenter map to my location"
          icon={<Crosshair className="w-5 h-5 text-gray-800" />}
          variant="glass"
          shape="circle"
          onClick={recenterToUser}
          className="h-11 w-11 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
        />

        {showIncidents && (
          <IconButton
            aria-label="Report road incident"
            icon={<AlertTriangle className="w-5 h-5 text-red-600" />}
            variant="glass"
            shape="circle"
            onClick={() => openIncidentModal()}
            className="h-11 w-11 shadow-[0_8px_24px_rgba(0,0,0,0.12)]"
          />
        )}
      </div>
    </div>
  );
};
