import React, { useState } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { X, AlertTriangle, MapPin, Send } from 'lucide-react';
import { IncidentType } from '../../types';
import { useAppStore } from '../../features/useAppStore';
import { useIncidents } from '../../hooks/useIncidents';
import { useI18n } from '../../hooks/useI18n';
import { Button } from '../common/Button';
import { IconButton } from '../common/IconButton';
import { 
  modalScaleFade, 
  backdropFade, 
  springTactile, 
  tactilePress 
} from '../../lib/motion';

const INCIDENT_TYPES: { type: IncidentType; labelKey: string }[] = [
  { type: 'ACCIDENT', labelKey: 'incidents.types.ACCIDENT' },
  { type: 'ROAD_CLOSURE', labelKey: 'incidents.types.ROAD_CLOSURE' },
  { type: 'FLOODING', labelKey: 'incidents.types.FLOODING' },
  { type: 'LANDSLIDE', labelKey: 'incidents.types.LANDSLIDE' },
  { type: 'ROAD_DAMAGE', labelKey: 'incidents.types.ROAD_DAMAGE' },
  { type: 'CONSTRUCTION', labelKey: 'incidents.types.CONSTRUCTION' },
  { type: 'HEAVY_TRAFFIC', labelKey: 'incidents.types.HEAVY_TRAFFIC' },
  { type: 'OTHER', labelKey: 'incidents.types.OTHER' },
];

export const IncidentModal: React.FC = () => {
  const { t } = useI18n();
  const shouldReduceMotion = useReducedMotion();
  const isReporting = useAppStore((state) => state.isReportingIncident);
  const closeIncidentModal = useAppStore((state) => state.closeIncidentModal);
  const draftLocation = useAppStore((state) => state.incidentDraftLocation);
  const userLocation = useAppStore((state) => state.userLocation);

  const { reportIncident, isSubmitting } = useIncidents();

  const [selectedType, setSelectedType] = useState<IncidentType>('ROAD_CLOSURE');
  const [description, setDescription] = useState('');
  const [submittedSuccess, setSubmittedSuccess] = useState(false);

  const activeLoc = draftLocation || userLocation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    const success = await reportIncident({
      type: selectedType,
      description: description.trim(),
      location: activeLoc,
      occurredAt: new Date().toISOString(),
    });

    if (success) {
      setSubmittedSuccess(true);
      setTimeout(() => {
        setSubmittedSuccess(false);
        setDescription('');
        closeIncidentModal();
      }, 1200);
    }
  };

  return (
    <AnimatePresence>
      {isReporting && (
        <motion.div
          key="modal-backdrop"
          variants={backdropFade}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          exit={shouldReduceMotion ? undefined : 'exit'}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-md"
          onClick={closeIncidentModal}
        >
          <motion.div
            key="modal-card"
            variants={modalScaleFade}
            initial={shouldReduceMotion ? undefined : 'hidden'}
            animate={shouldReduceMotion ? undefined : 'visible'}
            exit={shouldReduceMotion ? undefined : 'exit'}
            onClick={(e) => e.stopPropagation()}
            className="backdrop-blur-2xl bg-white/95 rounded-[24px] w-full max-w-lg shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-white/60 overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-labelledby="incident-modal-title"
          >
            {/* Header with Inverse Leading */}
            <div className="flex items-center justify-between p-4 border-b border-gray-100/70">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center shadow-sm">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h2 id="incident-modal-title" className="text-base font-bold text-gray-900 leading-tight">
                    {t('incidents.modalTitle')}
                  </h2>
                  <p className="text-xs text-gray-500 font-medium leading-relaxed">{t('incidents.modalSubtitle')}</p>
                </div>
              </div>

              <IconButton
                aria-label={t('common.close')}
                icon={<X className="w-5 h-5 text-gray-500" />}
                onClick={closeIncidentModal}
                variant="ghost"
                shape="rounded"
                className="h-11 w-11"
              />
            </div>

            {/* Content Body */}
            {submittedSuccess ? (
              <div className="p-8 text-center flex flex-col items-center justify-center gap-3">
                <div className="h-12 w-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                  <Send className="w-6 h-6" />
                </div>
                <h3 className="text-base font-bold text-gray-900 leading-tight">Report Submitted</h3>
                <p className="text-xs text-gray-500 font-medium leading-relaxed">Thank you for keeping Addis commuters informed.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-4 space-y-4">
                {/* Incident Type Grid with Tactile Springs */}
                <div>
                  <label className="text-xs font-bold text-gray-700 tracking-wide uppercase mb-2 block leading-none">
                    {t('incidents.typeLabel')}
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {INCIDENT_TYPES.map((item) => {
                      const isSelected = selectedType === item.type;
                      return (
                        <motion.button
                          key={item.type}
                          type="button"
                          whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
                          transition={springTactile}
                          onClick={() => setSelectedType(item.type)}
                          className={`min-h-[44px] px-3 py-2 rounded-xl text-xs font-semibold text-left border transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/80 text-indigo-900 shadow-sm'
                              : 'border-gray-200 bg-white/80 text-gray-700 hover:bg-gray-50'
                          }`}
                        >
                          {t(item.labelKey)}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>

                {/* Description textarea */}
                <div>
                  <label htmlFor="incident-desc" className="text-xs font-bold text-gray-700 tracking-wide uppercase mb-1.5 block leading-none">
                    {t('incidents.descLabel')}
                  </label>
                  <textarea
                    id="incident-desc"
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder={t('incidents.descPlaceholder')}
                    required
                    className="w-full bg-white border border-gray-200 rounded-xl p-3 text-sm text-gray-900 placeholder-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm resize-none leading-relaxed"
                  />
                </div>

                {/* Location coordinates preview */}
                <div className="bg-gray-50/80 rounded-xl p-3 border border-gray-100 flex items-center justify-between text-xs text-gray-600">
                  <span className="flex items-center gap-1.5 font-semibold">
                    <MapPin className="w-4 h-4 text-indigo-600 shrink-0" />
                    <span>
                      {activeLoc.lat.toFixed(4)}, {activeLoc.lon.toFixed(4)}
                    </span>
                  </span>
                  <span className="text-[11px] text-gray-400 font-normal">Pin dropped on Addis map</span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end gap-3 pt-2 border-t border-gray-100/70">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={closeIncidentModal}
                    className="rounded-xl min-h-[44px]"
                  >
                    {t('common.cancel')}
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    isLoading={isSubmitting}
                    className="rounded-xl min-h-[44px]"
                  >
                    {t('incidents.submit')}
                  </Button>
                </div>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
