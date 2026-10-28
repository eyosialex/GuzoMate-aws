import { request, ApiError } from '../lib/apiClient';
import {
  VoteAction,
  VoteResult,
  SelfVoteError,
  TerminalStateVoteError,
  DuplicateVoteError,
} from '../types/confirmations';

export const confirmationsService = {
  /**
   * Vote on an incident report to corroborate (CONFIRM) or challenge (DISPUTE).
   * Backend will automatically transition status to ACTIVE & verification to COMMUNITY_CONFIRMED
   * when confirmationsCount reaches 3.
   *
   * POST /api/v1/incidents/:id/confirm
   * Body: { action: "CONFIRM" | "DISPUTE" }
   */
  async voteOnIncident(incidentId: string, action: VoteAction): Promise<VoteResult> {
    try {
      return await request<VoteResult>(`/incidents/${incidentId}/confirm`, {
        method: 'POST',
        body: JSON.stringify({ action }),
      });
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 400) {
          const msg = err.message || '';
          if (msg.toLowerCase().includes('reporter') || msg.toLowerCase().includes('own incident')) {
            throw new SelfVoteError(msg);
          }
          if (msg.toLowerCase().includes('already') || msg.toLowerCase().includes('cannot verify')) {
            throw new TerminalStateVoteError(msg);
          }
        }
        if (err.status === 409 || err.code === 'CONFLICT' || err.code === 'ALREADY_VOTED') {
          throw new DuplicateVoteError(err.message || 'You have already submitted this vote for this incident report.');
        }
      }
      throw err;
    }
  },
};
