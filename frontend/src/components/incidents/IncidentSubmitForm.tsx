import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { 
  MapPin, 
  Crosshair, 
  Car, 
  AlertTriangle, 
  Construction, 
  CloudRain, 
  AlertOctagon, 
  Check, 
  ChevronDown 
} from 'lucide-react';
import { IncidentType, GeoLocation, IncidentSubmissionPayload } from '../../types';
import { searchAddisLandmarks, AddisLandmark } from '../../lib/addisLandmarks';
import { Button } from '../common/Button';
import { springGentle } from '../../lib/motion';

interface IncidentSubmitFormProps {
  draftLocation: GeoLocation | null;
  isMapPickingActive: boolean;
  onActivateMapPicker: () => void;
  onSubmit: (payload: IncidentSubmissionPayload) => Promise<boolean>;
  isSubmitting: boolean;
  onCancel: () => void;
}

const INCIDENT_CATEGORIES: { id: IncidentType; label: string; icon: React.ReactNode }[] = [
  { id: 'HEAVY_TRAFFIC', label: 'Heavy Traffic', icon: <Car className="w-4 h-4" /> },
  { id: 'ROAD_CLOSURE', label: 'Road Closure', icon: <AlertOctagon className="w-4 h-4" /> },
  { id: 'ACCIDENT', label: 'Traffic Accident', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'FLOODING', label: 'Flooding / Water', icon: <CloudRain className="w-4 h-4" /> },
  { id: 'CONSTRUCTION', label: 'Road Work', icon: <Construction className="w-4 h-4" /> },
  { id: 'ROAD_DAMAGE', label: 'Pothole / Damage', icon: <AlertTriangle className="w-4 h-4" /> },
];

export const IncidentSubmitForm: React.FC<IncidentSubmitFormProps> = ({
  draftLocation,
  isMapPickingActive,
  onActivateMapPicker,
  onSubmit,
  isSubmitting,
  onCancel,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<IncidentType>('HEAVY_TRAFFIC');
  const [description, setDescription] = useState('');

  // Location search state
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation | null>(null);
  const [selectedLocationName, setSelectedLocationName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Sync draft location from map click if user clicked on the map
  const [prevDraft, setPrevDraft] = useState<GeoLocation | null>(null);
  if (draftLocation && draftLocation !== prevDraft) {
    setPrevDraft(draftLocation);
    setSelectedLocation(draftLocation);
    const name = `Pinned Map Location (${draftLocation.lat.toFixed(4)}, ${draftLocation.lon.toFixed(4)})`;
    setSelectedLocationName(name);
    setLocationQuery(name);
    setIsDropdownOpen(false);
  }

  // Derive filtered places during render.
  // If user didn't type anything, dropdown menu is invisible and does not search
  const trimmed = locationQuery.trim();
  const shouldSearch = Boolean(trimmed && trimmed !== selectedLocationName);
  const filteredPlaces = useMemo(() => {
    if (!shouldSearch) return [];
    return searchAddisLandmarks(trimmed);
  }, [shouldSearch, trimmed]);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLocationInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setLocationQuery(val);
    setSelectedLocation(null);
    setSelectedLocationName('');
    setIsDropdownOpen(val.trim().length > 0);
  };

  const handleSelectLocation = (landmark: AddisLandmark) => {
    setSelectedLocation(landmark.location);
    setSelectedLocationName(landmark.name);
    setLocationQuery(landmark.name);
    setIsDropdownOpen(false);
    setValidationError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError(null);

    if (!title.trim()) {
      setValidationError('Please enter an incident title.');
      return;
    }

    if (!description.trim()) {
      setValidationError('Please describe the road condition.');
      return;
    }

    if (!selectedLocation) {
      setValidationError('Please specify or pick an incident location on the map.');
      return;
    }

    const success = await onSubmit({
      title: title.trim(),
      type,
      description: description.trim(),
      location: selectedLocation,
      locationName: selectedLocationName || locationQuery,
    });

    if (success) {
      // Clear form
      setTitle('');
      setDescription('');
      setLocationQuery('');
      setSelectedLocation(null);
      setSelectedLocationName('');
    }
  };

  return (
    <motion.form
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 6 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={springGentle}
      onSubmit={handleSubmit}
      className="p-4 space-y-4 overflow-y-auto h-full"
    >
      {/* Title Input */}
      <div>
        <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-1.5 leading-none">
          Incident Title <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Heavy congestion near Megenagna"
          className="w-full min-h-[44px] px-3.5 py-2.5 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white transition-all shadow-xs"
        />
      </div>

      {/* Incident Type Selector */}
      <div>
        <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-1.5 leading-none">
          Incident Type
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {INCIDENT_CATEGORIES.map((cat) => {
            const isSelected = type === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setType(cat.id)}
                className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border text-left select-none ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white text-on-surface-variant border-outline-variant/40 hover:bg-surface-low'
                }`}
              >
                <span className={isSelected ? 'text-white' : 'text-primary'}>
                  {cat.icon}
                </span>
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Description Input */}
      <div>
        <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-1.5 leading-none">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Provide details about blocked lanes, hazards, or traffic delays..."
          className="w-full p-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white transition-all shadow-xs resize-none"
        />
      </div>

      {/* Location Input with Search, Dropdown & Fallback */}
      <div className="relative" ref={dropdownRef}>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-xs font-bold text-on-surface uppercase tracking-wider block leading-none">
            Location <span className="text-red-500">*</span>
          </label>
          {selectedLocation && (
            <span className="text-[11px] font-bold text-primary flex items-center gap-1 leading-none">
              <Check className="w-3 h-3 text-primary stroke-[3]" /> Selected
            </span>
          )}
        </div>

        <div className="relative flex items-center">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-primary">
            <MapPin className="w-4 h-4" />
          </div>

          <input
            type="text"
            value={locationQuery}
            onChange={handleLocationInputChange}
            placeholder="Search place in Addis (e.g., 'Bole', 'Piazza')..."
            className="w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white transition-all shadow-xs"
          />

          <button
            type="button"
            onClick={onActivateMapPicker}
            title="Pick location on map"
            className="absolute right-2 p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors"
          >
            <Crosshair className={`w-4 h-4 ${isMapPickingActive ? 'text-secondary animate-spin' : ''}`} />
          </button>
        </div>

        {/* Dropdown Menu:
            - INVISIBLE when locationQuery is empty!
            - Shows matching places when found
            - Shows "didnt find your your location? click on map" when place is not found (or at bottom)
        */}
        {isDropdownOpen && locationQuery.trim() !== '' && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-outline-variant/50 rounded-2xl shadow-floating z-50 overflow-hidden divide-y divide-outline-variant/20">
            {filteredPlaces.length > 0 ? (
              <>
                <div className="max-h-48 overflow-y-auto">
                  {filteredPlaces.map((landmark) => (
                    <button
                      key={landmark.id}
                      type="button"
                      onClick={() => handleSelectLocation(landmark)}
                      className="w-full px-4 py-2.5 text-left flex items-start gap-2.5 hover:bg-surface-low transition-colors group cursor-pointer"
                    >
                      <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                          {landmark.name}
                        </div>
                        <div className="text-[11px] text-on-surface-variant/70 truncate">
                          {landmark.address}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                {/* Option to click on map at bottom of results */}
                <div
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onActivateMapPicker();
                  }}
                  className="px-4 py-2.5 bg-surface-low/80 hover:bg-primary/10 text-primary text-xs font-bold flex items-center justify-between cursor-pointer transition-colors"
                >
                  <span className="flex items-center gap-1.5">
                    <Crosshair className="w-3.5 h-3.5" />
                    Didn't find your location? Click on map
                  </span>
                  <ChevronDown className="w-3.5 h-3.5 -rotate-90" />
                </div>
              </>
            ) : (
              // When searched place is not to be found
              <div className="p-4 text-center space-y-2">
                <p className="text-xs font-medium text-on-surface-variant">
                  No places found for <span className="font-bold text-on-surface">"{locationQuery}"</span>
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setIsDropdownOpen(false);
                    onActivateMapPicker();
                  }}
                  className="w-full py-2 px-3 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Crosshair className="w-4 h-4 text-primary" />
                  Didn't find your location? Click on map
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Map Picking Active Callout */}
      {isMapPickingActive && (
        <div className="p-3 rounded-xl bg-secondary/10 border border-secondary/30 text-secondary-dark flex items-center gap-2 text-xs font-semibold">
          <Crosshair className="w-4 h-4 text-secondary shrink-0" />
          <span>Click anywhere on the map on the right to set the pin.</span>
        </div>
      )}

      {/* Validation Error Banner */}
      {validationError && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {validationError}
        </div>
      )}

      {/* Submission Actions */}
      <div className="pt-2 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1 rounded-xl min-h-[44px]"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
          isLoading={isSubmitting}
          className="flex-1 rounded-xl min-h-[44px]"
        >
          Submit Incident
        </Button>
      </div>
    </motion.form>
  );
};
