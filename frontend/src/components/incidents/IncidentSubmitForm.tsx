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
  ChevronDown,
  ShieldAlert,
  Flame,
  HelpCircle,
  Link as LinkIcon
} from 'lucide-react';
import { GeoLocation } from '../../types';
import { 
  IncidentType, 
  IncidentSeverity, 
  CreateIncidentPayload,
  SEVERITY_COLORS,
  SEVERITY_LABELS 
} from '../../types/incidents';
import { searchAddisLandmarks, AddisLandmark } from '../../lib/addisLandmarks';
import { Button } from '../common/Button';
import { springGentle } from '../../lib/motion';

interface IncidentSubmitFormProps {
  draftLocation: GeoLocation | null;
  isMapPickingActive: boolean;
  onActivateMapPicker: () => void;
  onSubmit: (payload: CreateIncidentPayload & { title?: string; locationName?: string }) => Promise<{ success: boolean; duplicate?: boolean; error?: string } | boolean>;
  isSubmitting: boolean;
  onCancel: () => void;
  onViewExisting?: () => void;
}

const ALL_INCIDENT_CATEGORIES: { id: IncidentType; label: string; icon: React.ReactNode }[] = [
  { id: 'ACCIDENT', label: 'Traffic Accident', icon: <AlertTriangle className="w-4 h-4 text-red-500" /> },
  { id: 'ROAD_BLOCK', label: 'Roadblock / Escarpment', icon: <ShieldAlert className="w-4 h-4 text-amber-500" /> },
  { id: 'ROAD_CLOSURE', label: 'Road Closure', icon: <AlertOctagon className="w-4 h-4 text-red-600" /> },
  { id: 'FLOODING', label: 'Flooding / Torrent', icon: <CloudRain className="w-4 h-4 text-blue-500" /> },
  { id: 'LANDSLIDE', label: 'Landslide / Rockfall', icon: <Flame className="w-4 h-4 text-amber-700" /> },
  { id: 'ROAD_DAMAGE', label: 'Pothole / Road Damage', icon: <AlertTriangle className="w-4 h-4 text-yellow-600" /> },
  { id: 'CONSTRUCTION', label: 'Road Construction', icon: <Construction className="w-4 h-4 text-orange-500" /> },
  { id: 'HEAVY_TRAFFIC', label: 'Heavy Traffic Jam', icon: <Car className="w-4 h-4 text-purple-500" /> },
  { id: 'HAZARD', label: 'General Hazard', icon: <AlertTriangle className="w-4 h-4 text-rose-500" /> },
  { id: 'OTHER', label: 'Other Disturbance', icon: <HelpCircle className="w-4 h-4 text-slate-500" /> },
];

const SEVERITY_OPTIONS: IncidentSeverity[] = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];

export const IncidentSubmitForm: React.FC<IncidentSubmitFormProps> = ({
  draftLocation,
  isMapPickingActive,
  onActivateMapPicker,
  onSubmit,
  isSubmitting,
  onCancel,
  onViewExisting,
}) => {
  const shouldReduceMotion = useReducedMotion();

  const [type, setType] = useState<IncidentType>('HEAVY_TRAFFIC');
  const [severity, setSeverity] = useState<IncidentSeverity>('MEDIUM');
  const [description, setDescription] = useState('');
  const [evidenceUrl, setEvidenceUrl] = useState('');

  // Location search state
  const [locationQuery, setLocationQuery] = useState('');
  const [selectedLocation, setSelectedLocation] = useState<GeoLocation | null>(null);
  const [selectedLocationName, setSelectedLocationName] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);

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

  const trimmed = locationQuery.trim();
  const shouldSearch = Boolean(trimmed && trimmed !== selectedLocationName);
  const filteredPlaces = useMemo(() => {
    if (!shouldSearch) return [];
    return searchAddisLandmarks(trimmed);
  }, [shouldSearch, trimmed]);

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
    setDuplicateAlert(null);

    if (description.trim().length < 5) {
      setValidationError('Please provide a detailed description (at least 5 characters).');
      return;
    }

    if (!selectedLocation) {
      setValidationError('Please specify or pick an incident location on the map.');
      return;
    }

    if (evidenceUrl.trim() && !/^https?:\/\//i.test(evidenceUrl.trim())) {
      setValidationError('Evidence photo must be a valid http:// or https:// URL.');
      return;
    }

    const payload: CreateIncidentPayload & { title?: string; locationName?: string } = {
      type,
      description: description.trim(),
      severity,
      lat: selectedLocation.lat,
      lon: selectedLocation.lon,
      evidenceUrl: evidenceUrl.trim() || undefined,
      occurredAt: new Date().toISOString(),
      locationName: selectedLocationName || locationQuery,
    };

    const res = await onSubmit(payload);

    if (typeof res === 'object' && res.duplicate) {
      setDuplicateAlert(res.error || 'A similar incident was recently reported near this location.');
      return;
    }

    if (res === true || (typeof res === 'object' && res.success)) {
      setDescription('');
      setEvidenceUrl('');
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
      {/* Duplicate Report Alert Box */}
      {duplicateAlert && (
        <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-xs space-y-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p className="font-semibold leading-relaxed">{duplicateAlert}</p>
          </div>
          {onViewExisting && (
            <button
              type="button"
              onClick={onViewExisting}
              className="text-xs font-bold text-primary underline hover:text-primary-dark cursor-pointer"
            >
              View existing reports nearby →
            </button>
          )}
        </div>
      )}

      {/* Incident Category Selector */}
      <div>
        <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-1.5 leading-none">
          Incident Category <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto p-1 bg-surface-low rounded-2xl border border-outline-variant/30">
          {ALL_INCIDENT_CATEGORIES.map((cat) => {
            const isSelected = type === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setType(cat.id)}
                className={`min-h-[40px] px-2.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all border text-left select-none cursor-pointer ${
                  isSelected
                    ? 'bg-primary text-white border-primary shadow-xs'
                    : 'bg-white text-on-surface-variant border-outline-variant/40 hover:bg-surface-high'
                }`}
              >
                <span>{cat.icon}</span>
                <span className="truncate">{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Severity Selector */}
      <div>
        <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-1.5 leading-none">
          Severity Level
        </label>
        <div className="grid grid-cols-4 gap-1.5">
          {SEVERITY_OPTIONS.map((sev) => {
            const isSelected = severity === sev;
            const style = SEVERITY_COLORS[sev];
            return (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverity(sev)}
                className={`py-2 px-1 rounded-xl text-xs font-bold text-center border transition-all cursor-pointer ${
                  isSelected
                    ? `${style.bg} ${style.text} ${style.border} ring-2 ring-primary/20 shadow-xs font-extrabold`
                    : 'bg-white text-on-surface-variant/70 border-outline-variant/40 hover:bg-surface-low'
                }`}
              >
                {SEVERITY_LABELS[sev].en}
              </button>
            );
          })}
        </div>
      </div>

      {/* Description Input */}
      <div>
        <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-1.5 leading-none">
          Hazard Description <span className="text-red-500">*</span>
        </label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Details on affected lanes, impassable sections, or recommended detours..."
          className="w-full p-3 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white transition-all shadow-xs resize-none"
        />
        <span className="text-[10px] text-on-surface-variant/60">Minimum 5 characters.</span>
      </div>

      {/* Evidence Photo URL (Optional) */}
      <div>
        <label className="text-xs font-bold text-on-surface uppercase tracking-wider block mb-1.5 leading-none">
          Photo or Evidence Link (Optional)
        </label>
        <div className="relative flex items-center">
          <LinkIcon className="w-4 h-4 text-ash absolute left-3 pointer-events-none" />
          <input
            type="url"
            value={evidenceUrl}
            onChange={(e) => setEvidenceUrl(e.target.value)}
            placeholder="https://example.com/photo.jpg"
            className="w-full min-h-[40px] pl-9 pr-3.5 py-2 bg-surface-low border border-outline-variant/60 rounded-xl text-xs font-medium text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white transition-all shadow-xs"
          />
        </div>
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
            placeholder="Search landmark (e.g., 'Bole', 'Gotera', 'Megenagna')..."
            className="w-full min-h-[44px] pl-10 pr-10 py-2.5 bg-surface-low border border-outline-variant/60 rounded-xl text-sm font-medium text-on-surface placeholder:text-on-surface-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary focus:bg-white transition-all shadow-xs"
          />

          <button
            type="button"
            onClick={onActivateMapPicker}
            title="Pick location on map"
            className="absolute right-2 p-1.5 rounded-lg text-on-surface-variant hover:text-primary hover:bg-surface-container transition-colors cursor-pointer"
          >
            <Crosshair className={`w-4 h-4 ${isMapPickingActive ? 'text-secondary animate-spin' : ''}`} />
          </button>
        </div>

        {/* Dropdown Menu */}
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
          <Crosshair className="w-4 h-4 text-secondary shrink-0 animate-pulse" />
          <span>Click anywhere on the map to set the exact incident coordinate.</span>
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
          Submit Hazard Report
        </Button>
      </div>
    </motion.form>
  );
};
