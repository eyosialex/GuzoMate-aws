import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { Bookmark, MapPin, Navigation, Trash2, ArrowRight, Loader2 } from 'lucide-react';
import { useAppStore } from '../features/useAppStore';
import { placesService } from '../services/placesService';
import { Place } from '../types';
import { springGentle } from '../lib/motion';

export const SavedPlacesPage: React.FC = () => {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const savedPlaceIds = useAppStore((state) => state.savedPlaceIds);
  const toggleSavePlace = useAppStore((state) => state.toggleSavePlace);
  const setSelectedPlace = useAppStore((state) => state.setSelectedPlace);

  const [savedPlaces, setSavedPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(false);

  const handleRemovePlace = async (placeId: string) => {
    toggleSavePlace(placeId);
    setSavedPlaces((prev) => prev.filter((p) => p.id !== placeId));
    await placesService.deleteSavedPlace(placeId);
  };

  useEffect(() => {
    let active = true;
    const token = localStorage.getItem('guzomate_token') || localStorage.getItem('guzo_access_token');

    if (token) {
      setLoading(true);
      placesService
        .getSavedPlaces()
        .then((res) => {
          if (active) {
            if (res.items && res.items.length > 0) {
              const mapped: Place[] = res.items.map((item) => ({
                id: item.id,
                name: item.name,
                category: item.category,
                address: item.address,
                location: { lat: Number(item.latitude), lon: Number(item.longitude) },
                distanceMeters: null,
                tags: {},
                source: 'openstreetmap',
                osm: { type: 'node', id: item.id },
                isSaved: true,
              }));
              setSavedPlaces(mapped);
            } else {
              setSavedPlaces([]);
            }
            setLoading(false);
          }
        })
        .catch(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
      };
    }

    if (savedPlaceIds.length === 0) {
      setSavedPlaces([]);
      return;
    }

    Promise.allSettled(savedPlaceIds.map((id) => placesService.getPlaceById(id))).then((results) => {
      if (active) {
        const places = results
          .filter((r): r is PromiseFulfilledResult<Place> => r.status === 'fulfilled')
          .map((r) => r.value);
        setSavedPlaces(places);
      }
    });
    return () => {
      active = false;
    };
  }, [savedPlaceIds]);

  return (
    <div className="w-full min-h-[calc(100vh-4rem)] bg-[#f8faf8] text-[#141d18] font-sans py-8 px-4 sm:px-6">
      <div className="max-w-[1280px] mx-auto space-y-6">
        <div className="flex items-center justify-between border-b border-[#e2e8e3] pb-5">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-9 w-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Bookmark className="w-5 h-5 fill-amber-500" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-950 tracking-tight">
                Saved Places & Highland Depots
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Your bookmarked rest stops, 24/7 hospitals, EV charging points, and cafes.
            </p>
          </div>
          <span className="text-xs font-bold bg-white border border-gray-200 px-3 py-1 rounded-xl text-gray-700">
            {savedPlaces.length} Saved
          </span>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto space-y-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin mx-auto" />
            <p className="text-xs text-gray-500 font-medium">Loading your bookmarked places...</p>
          </div>
        ) : savedPlaces.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center max-w-md mx-auto space-y-3">
            <Bookmark className="w-12 h-12 text-gray-300 mx-auto" />
            <h3 className="text-base font-bold text-gray-900">No saved places yet</h3>
            <p className="text-xs text-gray-500">
              Explore the interactive map and tap the bookmark icon on any clinic, fuel station, or lodge to save it offline.
            </p>
            <Link
              to="/explore"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#183a2b] text-white text-xs font-bold rounded-xl shadow-xs"
            >
              <span>Explore Nearby Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedPlaces.map((place) => (
              <motion.div
                key={place.id}
                initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
                animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
                transition={springGentle}
                className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-[10px] mb-2">
                    <span className="font-bold uppercase tracking-wider bg-[#f0f7f3] text-[#183a2b] border border-[#d1e2d8] px-2 py-0.5 rounded">
                      {place.category.toUpperCase()}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemovePlace(place.id)}
                      className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                      title="Remove bookmark"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 leading-snug">
                    {place.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate">{place.address}</p>

                  <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-600">
                    <MapPin className="w-3.5 h-3.5 text-gray-400" />
                    <span>{place.distanceMeters ? `${(place.distanceMeters / 1000).toFixed(1)} km away` : '1.8 km'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPlace(place);
                      navigate('/explore');
                    }}
                    className="text-xs font-bold text-[#183a2b] hover:underline"
                  >
                    View on Map →
                  </button>

                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${place.location.lat},${place.location.lon}`}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-3 bg-[#183a2b] hover:bg-[#122e22] text-white text-xs font-bold rounded-xl shadow-xs transition-colors flex items-center gap-1"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Directions</span>
                  </a>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedPlacesPage;
