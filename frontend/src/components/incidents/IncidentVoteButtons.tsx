import React, { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { Incident } from '../../types';
import { VoteAction, VoteResult } from '../../types/confirmations';
import { confirmationsService } from '../../services/confirmationsService';
import { useAppStore } from '../../features/useAppStore';
import { springTactile, tactilePress } from '../../lib/motion';

export interface IncidentVoteButtonsProps {
  incident: Incident;
  onVoteSuccess?: (result: VoteResult) => void;
  size?: 'sm' | 'md';
}

export const IncidentVoteButtons: React.FC<IncidentVoteButtonsProps> = ({
  incident,
  onVoteSuccess,
  size = 'sm',
}) => {
  const shouldReduceMotion = useReducedMotion();
  const currentUser = useAppStore((state) => state.currentUser);
  const openAuthModal = useAppStore((state) => state.openAuthModal);

  const [isPending, setIsPending] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isReporter = !!(currentUser && incident.reporter?.id === currentUser.id);
  const isTerminal = ['RESOLVED', 'REJECTED', 'EXPIRED'].includes(incident.status);

  const handleVote = async (action: VoteAction, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setErrorMsg(null);

    // If user is not authenticated, prompt sign-in modal
    if (!currentUser) {
      openAuthModal('login');
      return;
    }

    if (isReporter || isTerminal || isPending) {
      return;
    }

    // Do nothing if clicking on existing active vote
    if (incident.userVote === action) {
      return;
    }

    setIsPending(true);
    try {
      const result = await confirmationsService.voteOnIncident(incident.id, action);
      if (onVoteSuccess) {
        onVoteSuccess(result);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Vote failed';
      setErrorMsg(message);
      // Auto clear error message after 3.5s
      setTimeout(() => setErrorMsg(null), 3500);
    } finally {
      setIsPending(false);
    }
  };

  if (isReporter) {
    return (
      <span className="text-[11px] font-medium text-on-surface-variant/70 italic px-1 py-0.5 select-none">
        You reported this
      </span>
    );
  }

  if (isTerminal) {
    return (
      <span className="text-[11px] font-medium text-on-surface-variant/50 px-1 py-0.5 select-none">
        Voting closed ({incident.status.toLowerCase()})
      </span>
    );
  }

  const isConfirmed = incident.userVote === 'CONFIRM';
  const isDisputed = incident.userVote === 'DISPUTE';

  const btnPadding = size === 'sm' ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs font-semibold';
  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  return (
    <div className="flex flex-col items-start gap-1">
      <div className="inline-flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
        {/* Confirm Button */}
        <motion.button
          type="button"
          whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
          transition={springTactile}
          onClick={(e) => handleVote('CONFIRM', e)}
          disabled={isPending || isConfirmed}
          title={isConfirmed ? 'You confirmed this incident' : 'Confirm this hazard exists'}
          className={`group inline-flex items-center gap-1 rounded-lg font-bold border transition-all duration-150 cursor-pointer disabled:cursor-not-allowed select-none ${btnPadding} ${
            isConfirmed
              ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
              : 'bg-white hover:bg-emerald-50 border-outline-variant/60 hover:border-emerald-300 text-on-surface-variant hover:text-emerald-800'
          }`}
          aria-label={`Confirm report (${incident.confirmationsCount} confirmations)`}
        >
          {isPending && !isDisputed ? (
            <Loader2 className={`${iconSize} animate-spin`} />
          ) : (
            <ThumbsUp
              className={`${iconSize} transition-transform ${
                isConfirmed ? 'scale-110 text-white' : 'group-hover:text-emerald-700'
              }`}
            />
          )}
          <span>Confirm</span>
          <span
            className={`font-mono text-[10px] ml-0.5 px-1 py-0.2 rounded ${
              isConfirmed ? 'bg-emerald-700/60 text-white' : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {incident.confirmationsCount}
          </span>
        </motion.button>

        {/* Dispute Button */}
        <motion.button
          type="button"
          whileTap={shouldReduceMotion ? undefined : tactilePress.pill}
          transition={springTactile}
          onClick={(e) => handleVote('DISPUTE', e)}
          disabled={isPending || isDisputed}
          title={isDisputed ? 'You disputed this incident' : 'Dispute this hazard (false or cleared)'}
          className={`group inline-flex items-center gap-1 rounded-lg font-bold border transition-all duration-150 cursor-pointer disabled:cursor-not-allowed select-none ${btnPadding} ${
            isDisputed
              ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
              : 'bg-white hover:bg-rose-50 border-outline-variant/60 hover:border-rose-300 text-on-surface-variant hover:text-rose-800'
          }`}
          aria-label={`Dispute report (${incident.disputesCount} disputes)`}
        >
          {isPending && isDisputed ? (
            <Loader2 className={`${iconSize} animate-spin`} />
          ) : (
            <ThumbsDown
              className={`${iconSize} transition-transform ${
                isDisputed ? 'scale-110 text-white' : 'group-hover:text-rose-700'
              }`}
            />
          )}
          <span>Dispute</span>
          <span
            className={`font-mono text-[10px] ml-0.5 px-1 py-0.2 rounded ${
              isDisputed ? 'bg-rose-700/60 text-white' : 'bg-surface-container text-on-surface-variant'
            }`}
          >
            {incident.disputesCount}
          </span>
        </motion.button>
      </div>

      {/* Error Feedback */}
      {errorMsg && (
        <span className="text-[10px] font-medium text-rose-600 px-1 leading-tight animate-fade-in">
          {errorMsg}
        </span>
      )}
    </div>
  );
};
