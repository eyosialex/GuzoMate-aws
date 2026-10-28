import { create } from 'zustand';
import { 
  Language, 
  ActiveTab, 
  Place, 
  Incident, 
  RouteOption, 
  ChatMessage, 
  GeoLocation, 
  PageView, 
  UserProfile, 
  DEFAULT_ADDIS_COORDINATES 
} from '../types';
import { formatLocationName, estimateElevationMeters, reverseGeocode } from '../lib/addisLandmarks';

export type BottomSheetSnap = 'collapsed' | 'half' | 'expanded';

interface AppState {
  // Page Navigation
  pageView: PageView;
  setPageView: (view: PageView) => void;

  // User Auth State
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile | null) => void;
  isAuthModalOpen: boolean;
  authModalTab: 'login' | 'signup';
  openAuthModal: (tab?: 'login' | 'signup') => void;
  closeAuthModal: () => void;
  isProfileModalOpen: boolean;
  openProfileModal: () => void;
  closeProfileModal: () => void;

  // Localization
  language: Language;
  setLanguage: (lang: Language) => void;

  // Active Navigation
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;

  // Location & Map State
  userLocation: GeoLocation;
  userLocationName: string;
  userAltitude: string;
  isLocating: boolean;
  locationError: string | null;
  mapCenter: [number, number];
  mapZoom: number;
  setUserLocation: (loc: GeoLocation, name?: string) => void;
  setMapCenter: (center: [number, number], zoom?: number) => void;
  requestCurrentLocation: () => Promise<GeoLocation | null>;

  // Selections
  selectedPlace: Place | null;
  selectedIncident: Incident | null;
  selectedRoute: RouteOption | null;
  setSelectedPlace: (place: Place | null) => void;
  setSelectedIncident: (incident: Incident | null) => void;
  setSelectedRoute: (route: RouteOption | null) => void;

  // Destination Picker & Map Selection Flow
  isPickingDestination: boolean;
  destinationLocation: GeoLocation | null;
  destinationName: string;
  draftDestination: { location: GeoLocation; name: string } | null;
  startPickingDestination: () => void;
  setDraftDestination: (draft: { location: GeoLocation; name: string } | null) => void;
  confirmDestination: () => void;
  cancelPickingDestination: () => void;
  setDestination: (loc: GeoLocation, name?: string) => void;

  // Incident Modal & Draft
  incidentSubpage: 'list' | 'submit';
  setIncidentSubpage: (sub: 'list' | 'submit') => void;
  isReportingIncident: boolean;
  incidentDraftLocation: GeoLocation | null;
  openIncidentModal: (loc?: GeoLocation) => void;
  closeIncidentModal: () => void;
  setIncidentDraftLocation: (loc: GeoLocation) => void;

  // Saved Places
  savedPlaceIds: string[];
  setSavedPlaceIds: (ids: string[]) => void;
  toggleSavePlace: (id: string) => void;

  // Chat State
  messages: ChatMessage[];
  isAssistantLoading: boolean;
  addMessage: (msg: ChatMessage) => void;
  setAssistantLoading: (loading: boolean) => void;
  clearMessages: () => void;

  // Mobile Bottom Sheet
  bottomSheetSnap: BottomSheetSnap;
  setBottomSheetSnap: (snap: BottomSheetSnap) => void;
}

const initialSavedPlaces = ['place-02']; // MCM Korean Hospital

export const useAppStore = create<AppState>((set, get) => ({
  pageView: 'landing',
  setPageView: (view: PageView) => set({ pageView: view }),

  currentUser: null,
  setCurrentUser: (user: UserProfile | null) => set({ currentUser: user }),
  isAuthModalOpen: false,
  authModalTab: 'login',
  openAuthModal: (tab: 'login' | 'signup' = 'login') => set({ isAuthModalOpen: true, authModalTab: tab }),
  closeAuthModal: () => set({ isAuthModalOpen: false }),
  isProfileModalOpen: false,
  openProfileModal: () => set({ isProfileModalOpen: true }),
  closeProfileModal: () => set({ isProfileModalOpen: false }),

  language: (localStorage.getItem('guzo_lang') as Language) || 'en',
  setLanguage: (lang: Language) => {
    localStorage.setItem('guzo_lang', lang);
    set({ language: lang });
  },

  activeTab: 'assistant',
  setActiveTab: (tab: ActiveTab) => {
    set({ 
      activeTab: tab,
      // If switching tab on mobile, expand sheet to half view
      bottomSheetSnap: 'half'
    });
  },

  userLocation: DEFAULT_ADDIS_COORDINATES,
  userLocationName: 'Bole Medhane Alem, Addis Ababa',
  userAltitude: '2,355m',
  isLocating: false,
  locationError: null,
  mapCenter: [DEFAULT_ADDIS_COORDINATES.lat, DEFAULT_ADDIS_COORDINATES.lon],
  mapZoom: 14,
  setUserLocation: (loc: GeoLocation, name?: string) => {
    const locationName = name || formatLocationName(loc);
    const altitude = `${estimateElevationMeters(loc.lat, loc.lon)}m`;
    set({ 
      userLocation: loc,
      userLocationName: locationName,
      userAltitude: altitude,
      mapCenter: [loc.lat, loc.lon] 
    });
  },
  setMapCenter: (center: [number, number], zoom?: number) => {
    set((state) => ({ 
      mapCenter: center, 
      mapZoom: zoom !== undefined ? zoom : state.mapZoom 
    }));
  },
  requestCurrentLocation: async (): Promise<GeoLocation | null> => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      set({ locationError: 'Geolocation is not supported by your browser.' });
      return null;
    }

    set({ isLocating: true, locationError: null });

    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const coords: GeoLocation = {
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          };
          const name = formatLocationName(coords);
          const altitude = position.coords.altitude != null
            ? `${Math.round(position.coords.altitude)}m`
            : `${estimateElevationMeters(coords.lat, coords.lon)}m`;

          set({
            userLocation: coords,
            userLocationName: name,
            userAltitude: altitude,
            mapCenter: [coords.lat, coords.lon],
            mapZoom: 16,
            isLocating: false,
            locationError: null,
          });

          try {
            localStorage.setItem('guzo_last_location', JSON.stringify({
              coords,
              timestamp: Date.now(),
            }));
          } catch {}

          // Asynchronously attempt to get more granular street/district address if available
          reverseGeocode(coords).then((refinedName) => {
            if (refinedName && refinedName !== name) {
              set({ userLocationName: refinedName });
            }
          }).catch(() => {});

          resolve(coords);
        },
        (error) => {
          set({
            isLocating: false,
            locationError: error.message || 'Unable to retrieve your location.',
          });
          resolve(null);
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0, // Force fresh hardware/sensor GPS reading
        }
      );
    });
  },

  selectedPlace: null,
  selectedIncident: null,
  selectedRoute: null,
  setSelectedPlace: (place: Place | null) => {
    set({ selectedPlace: place });
    if (place) {
      set({ 
        mapCenter: [place.location.lat, place.location.lon], 
        mapZoom: 16 
      });
    }
  },
  setSelectedIncident: (incident: Incident | null) => {
    set({ selectedIncident: incident });
    if (incident) {
      set({ 
        mapCenter: [incident.location.lat, incident.location.lon], 
        mapZoom: 16 
      });
    }
  },
  setSelectedRoute: (route: RouteOption | null) => {
    set({ selectedRoute: route });
    if (route && Array.isArray(route.segments) && route.segments.length > 0) {
      const firstCoord = route.segments[0]?.coordinates?.[0];
      if (firstCoord) {
        set({ mapCenter: [firstCoord[0], firstCoord[1]], mapZoom: 13 });
      }
    }
  },

  // Destination Picking State & Actions
  isPickingDestination: false,
  destinationLocation: { lat: 9.0340, lon: 38.7510 }, // Default Piazza St George
  destinationName: 'Piazza St George, Addis Ababa',
  draftDestination: null,

  startPickingDestination: () => {
    const currentLoc = get().destinationLocation;
    const currentName = get().destinationName;
    set({
      isPickingDestination: true,
      draftDestination: currentLoc ? { location: currentLoc, name: currentName } : null,
      bottomSheetSnap: 'collapsed',
    });
    if (currentLoc) {
      set({ mapCenter: [currentLoc.lat, currentLoc.lon], mapZoom: 15 });
    }
  },

  setDraftDestination: (draft: { location: GeoLocation; name: string } | null) => {
    set({ draftDestination: draft });
    if (draft) {
      set({ mapCenter: [draft.location.lat, draft.location.lon] });
    }
  },

  confirmDestination: () => {
    const draft = get().draftDestination;
    if (draft) {
      set({
        destinationLocation: draft.location,
        destinationName: draft.name,
        draftDestination: null,
        isPickingDestination: false,
        activeTab: 'routes',
        bottomSheetSnap: 'half',
      });
    } else {
      set({
        isPickingDestination: false,
        activeTab: 'routes',
        bottomSheetSnap: 'half',
      });
    }
  },

  cancelPickingDestination: () => {
    set({
      isPickingDestination: false,
      draftDestination: null,
      bottomSheetSnap: 'half',
    });
  },

  setDestination: (loc: GeoLocation, name?: string) => {
    const resolvedName = name || formatLocationName(loc);
    set({
      destinationLocation: loc,
      destinationName: resolvedName,
      draftDestination: null,
      isPickingDestination: false,
    });
  },

  incidentSubpage: 'list',
  setIncidentSubpage: (sub: 'list' | 'submit') => set({ incidentSubpage: sub }),

  isReportingIncident: false,
  incidentDraftLocation: null,
  openIncidentModal: (loc?: GeoLocation) => {
    set({ 
      isReportingIncident: true, 
      incidentDraftLocation: loc || get().userLocation 
    });
  },
  closeIncidentModal: () => {
    set({ isReportingIncident: false, incidentDraftLocation: null });
  },
  setIncidentDraftLocation: (loc: GeoLocation) => {
    set({ incidentDraftLocation: loc });
  },

  savedPlaceIds: initialSavedPlaces,
  setSavedPlaceIds: (ids: string[]) => {
    localStorage.setItem('guzo_saved_places', JSON.stringify(ids));
    set({ savedPlaceIds: ids });
  },
  toggleSavePlace: (id: string) => {
    set((state) => {
      const exists = state.savedPlaceIds.includes(id);
      const updated = exists 
        ? state.savedPlaceIds.filter((pId) => pId !== id)
        : [...state.savedPlaceIds, id];
      return { savedPlaceIds: updated };
    });
  },

  messages: [
    {
      id: 'welcome-1',
      sender: 'assistant',
      content: 'Hello! I am GuzoMate, your AI travel companion for Addis Ababa. Ask me for nearby points of interest, real-time routes, weather forecasts, or road conditions.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }
  ],
  isAssistantLoading: false,
  addMessage: (msg: ChatMessage) => {
    set((state) => ({ messages: [...state.messages, msg] }));
  },
  setAssistantLoading: (loading: boolean) => {
    set({ isAssistantLoading: loading });
  },
  clearMessages: () => {
    set({ messages: [] });
  },

  bottomSheetSnap: 'half',
  setBottomSheetSnap: (snap: BottomSheetSnap) => {
    set({ bottomSheetSnap: snap });
  },
}));
