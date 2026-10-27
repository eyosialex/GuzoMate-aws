import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import {
  X,
  ShieldCheck,
  History,
  Check,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { ModerationIncidentItem, AuditLogEntry } from '../../types/moderation';
import { moderationService } from '../../services/moderationService';
import { IncidentStatus } from '../../types/incidents';
import { modalScaleFade, backdropFade, springTactile, tactilePress } from '../../lib/motion';

export interface ModerationActionModalProps {
  incident: ModerationIncidentItem | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ModerationActionModal: React.FC<ModerationActionModalProps> = ({
  incident,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [targetStatus, setTargetStatus] = useState<IncidentStatus>('ACTIVE');
  const [reason, setReason] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Audit history state
  const [history, setHistory] = useState<AuditLogEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (incident) {
      setTargetStatus(incident.status === 'PENDING' ? 'ACTIVE' : 'RESOLVED');
      setReason('');
      setErrorMsg(null);
      setShowHistory(false);
    }
  }, [incident]);

  useEffect(() => {
    if (incident && showHistory) {
      setLoadingHistory(true);
      moderationService
        .getIncidentHistory(incident.id)
        .then((res) => setHistory(res.history))
        .catch(() => setHistory([]))
        .finally(() => setLoadingHistory(false));
    }
  }, [incident, showHistory]);

  if (!isOpen || !incident) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (targetStatus === 'REJECTED' && !reason.trim()) {
      setErrorMsg('A rejection reason is required for audit logs when rejecting an incident.');
      return;
    }

    setIsSubmitting(true);
    try {
      await moderationService.updateStatus(incident.id, {
        status: targetStatus,
        reason: reason.trim() || undefined,
      });
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Status update failed';
      setErrorMsg(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          variants={backdropFade}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          exit={shouldReduceMotion ? undefined : 'exit'}
          onClick={onClose}
          className="absolute inset-0"
        />

        <motion.div
          variants={modalScaleFade}
          initial={shouldReduceMotion ? undefined : 'hidden'}
          animate={shouldReduceMotion ? undefined : 'visible'}
          exit={shouldReduceMotion ? undefined : 'exit'}
          className="relative bg-white rounded-2xl w-full max-w-lg shadow-2xl border border-outline-variant/40 overflow-hidden z-10 text-xs flex flex-col max-h-[90vh]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b border-outline-variant/20 bg-surface-low flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">Staff Incident Review</h3>
                <span className="text-[11px] text-on-surface-variant font-mono">
                  ID: {incident.id.slice(0, 8)}...
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-surface-high text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body Content */}
          <div className="overflow-y-auto p-4 space-y-4 flex-1">
            {/* Error Banner */}
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
                {errorMsg}
              </div>
            )}

            {/* Incident Details Card */}
            <div className="p-3.5 rounded-xl bg-surface-low border border-outline-variant/30 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-md text-[11px]">
                  {incident.type.replace(/_/g, ' ')}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-stone-100 text-stone-700">
                  {incident.severity}
                </span>
              </div>

              <p className="text-xs text-on-surface leading-relaxed font-medium">
                {incident.description}
              </p>

              <div className="flex items-center justify-between text-[11px] text-on-surface-variant pt-2 border-t border-outline-variant/20">
                <div className="flex items-center gap-3">
                  <span className="text-emerald-700 font-semibold">
                    👍 {incident.confirmationsCount} Confirmations
                  </span>
                  <span className="text-rose-700 font-semibold">
                    👎 {incident.disputesCount} Disputes
                  </span>
                </div>
                {incident.reporter && (
                  <span className="truncate text-ash max-w-[140px]">
                    By {incident.reporter.name || incident.reporter.email}
                  </span>
                )}
              </div>

              {incident.evidenceUrl && (
                <div className="pt-2">
                  <a
                    href={incident.evidenceUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] text-primary font-bold hover:underline"
                  >
                    <span>View submitted photo evidence</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Status Transition Form */}
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Target Status Transition
                </label>
                <select
                  value={targetStatus}
                  onChange={(e) => setTargetStatus(e.target.value as IncidentStatus)}
                  className="w-full p-2.5 bg-white border border-outline-variant/40 rounded-xl text-xs font-semibold text-on-surface focus:outline-none focus:border-primary"
                >
                  <option value="ACTIVE">Approve & Verify (MODERATOR_VERIFIED)</option>
                  <option value="RESOLVED">Mark as Resolved (Hazard Cleared)</option>
                  <option value="REJECTED">Reject / Revoke (Disputed or False)</option>
                  <option value="EXPIRED">Expire Report</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-on-surface mb-1">
                  Moderator Reason{' '}
                  {targetStatus === 'REJECTED' ? (
                    <span className="text-red-600 font-bold">* (Mandatory for rejection)</span>
                  ) : (
                    <span className="text-on-surface-variant font-normal">(Optional audit notes)</span>
                  )}
                </label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={
                    targetStatus === 'REJECTED'
                      ? 'Specify clear reason (e.g. CCTV confirms road is clear, duplicate spam)...'
                      : 'Audit notes...'
                  }
                  rows={2}
                  className="w-full p-2.5 bg-white border border-outline-variant/40 rounded-xl text-xs text-on-surface focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-bold text-on-surface-variant hover:bg-surface-high transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <motion.button
                  type="submit"
                  disabled={isSubmitting}
                  whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
                  transition={springTactile}
                  className="px-5 py-2 rounded-xl text-xs font-bold bg-primary text-white shadow-xs hover:bg-primary-variant transition-colors disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                  <span>Apply Status Transition</span>
                </motion.button>
              </div>
            </form>

            {/* Audit History Drawer Toggle */}
            <div className="pt-2 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => setShowHistory(!showHistory)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline cursor-pointer"
              >
                <History className="w-3.5 h-3.5" />
                <span>{showHistory ? 'Hide Audit History' : 'View Incident Audit History'}</span>
              </button>

              {showHistory && (
                <div className="mt-2 space-y-2 max-h-40 overflow-y-auto p-2 rounded-xl bg-surface-low border border-outline-variant/30">
                  {loadingHistory ? (
                    <div className="py-4 flex justify-center text-primary">
                      <Loader2 className="w-4 h-4 animate-spin" />
                    </div>
                  ) : history.length === 0 ? (
                    <p className="text-on-surface-variant text-center py-2">No audit events recorded.</p>
                  ) : (
                    history.map((log) => (
                      <div key={log.id} className="p-2 rounded-lg bg-white border border-outline-variant/20 space-y-1">
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-bold text-primary">{log.action}</span>
                          <span className="text-ash">{new Date(log.createdAt).toLocaleTimeString()}</span>
                        </div>
                        {log.reason && (
                          <p className="text-[11px] text-on-surface">{log.reason}</p>
                        )}
                        {log.actor && (
                          <span className="text-[10px] text-ash block">
                            By {log.actor.name || 'Staff'} ({log.actor.role})
                          </span>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
