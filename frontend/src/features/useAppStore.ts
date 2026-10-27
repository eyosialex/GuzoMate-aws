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
  mapCenter: [number, number];
  mapZoom: number;
  setUserLocation: (loc: GeoLocation) => void;
  setMapCenter: (center: [number, number], zoom?: number) => void;

  // Selections
  selectedPlace: Place | null;
  selectedIncident: Incident | null;
  selectedRoute: RouteOption | null;
  setSelectedPlace: (place: Place | null) => void;
  setSelectedIncident: (incident: Incident | null) => void;
  setSelectedRoute: (route: RouteOption | null) => void;

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
  mapCenter: [DEFAULT_ADDIS_COORDINATES.lat, DEFAULT_ADDIS_COORDINATES.lon],
  mapZoom: 14,
  setUserLocation: (loc: GeoLocation) => {
    set({ 
      userLocation: loc, 
      mapCenter: [loc.lat, loc.lon] 
    });
  },
  setMapCenter: (center: [number, number], zoom?: number) => {
    set((state) => ({ 
      mapCenter: center, 
      mapZoom: zoom !== undefined ? zoom : state.mapZoom 
    }));
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
    if (route && route.segments.length > 0) {
      const firstCoord = route.segments[0].coordinates[0];
      if (firstCoord) {
        set({ mapCenter: [firstCoord[0], firstCoord[1]], mapZoom: 13 });
      }
    }
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
