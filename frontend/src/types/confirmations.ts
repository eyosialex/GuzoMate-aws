import { IncidentStatus, VerificationStatus } from './incidents';

export type VoteAction = 'CONFIRM' | 'DISPUTE';

export interface VotePayload {
  action: VoteAction;
}

export interface VoteResult {
  incidentId: string;
  action: VoteAction;
  status: IncidentStatus;
  verification: VerificationStatus;
  confirmationsCount: number;
  disputesCount: number;
}

export class SelfVoteError extends Error {
  code = 'SELF_VOTE_PROHIBITED';
  constructor(message = 'Reporters cannot confirm or dispute their own incident reports.') {
    super(message);
    this.name = 'SelfVoteError';
  }
}

export class TerminalStateVoteError extends Error {
  code = 'TERMINAL_STATE';
  constructor(message = 'Cannot verify an incident that is already resolved, rejected, or expired.') {
    super(message);
    this.name = 'TerminalStateVoteError';
  }
}

export class DuplicateVoteError extends Error {
  code = 'ALREADY_VOTED';
  constructor(message = 'You have already submitted this vote for this incident report.') {
    super(message);
    this.name = 'DuplicateVoteError';
  }
}
