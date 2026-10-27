// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { confirmationsService } from '../confirmationsService';
import { incidentsService } from '../incidentsService';
import {
  SelfVoteError,
  TerminalStateVoteError,
  DuplicateVoteError,
  VoteResult,
} from '../../types/confirmations';

describe('Confirmations Module Integration (Phase 4)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('guzomate_token', 'mock_jwt_token_for_phase4');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const incidentId = 'c71e21b0-449e-4e4a-b5e1-8f5bc65181a9';

  it('1. should successfully corroborate an incident report with CONFIRM action (POST /incidents/:id/confirm)', async () => {
    const mockSuccessResponse: VoteResult = {
      incidentId,
      action: 'CONFIRM',
      status: 'PENDING',
      verification: 'UNVERIFIED',
      confirmationsCount: 1,
      disputesCount: 0,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockSuccessResponse,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await confirmationsService.voteOnIncident(incidentId, 'CONFIRM');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain(`/incidents/${incidentId}/confirm`);
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({ action: 'CONFIRM' });
    expect(result.confirmationsCount).toBe(1);
    expect(result.action).toBe('CONFIRM');
  });

  it('2. should successfully dispute an incident report with DISPUTE action (POST /incidents/:id/confirm)', async () => {
    const mockDisputeResponse: VoteResult = {
      incidentId,
      action: 'DISPUTE',
      status: 'PENDING',
      verification: 'UNVERIFIED',
      confirmationsCount: 0,
      disputesCount: 1,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockDisputeResponse,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await confirmationsService.voteOnIncident(incidentId, 'DISPUTE');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    expect(JSON.parse(init?.body as string)).toEqual({ action: 'DISPUTE' });
    expect(result.disputesCount).toBe(1);
    expect(result.action).toBe('DISPUTE');
  });

  it('3. should support seamless vote switching from CONFIRM to DISPUTE', async () => {
    const mockSwitchedResponse: VoteResult = {
      incidentId,
      action: 'DISPUTE',
      status: 'PENDING',
      verification: 'UNVERIFIED',
      confirmationsCount: 1, // Decremented from 2
      disputesCount: 1,     // Incremented from 0
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockSwitchedResponse,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await confirmationsService.voteOnIncident(incidentId, 'DISPUTE');
    expect(result.action).toBe('DISPUTE');
    expect(result.confirmationsCount).toBe(1);
    expect(result.disputesCount).toBe(1);
  });

  it('4. should throw SelfVoteError when reporter tries to vote on their own incident report (400 Bad Request)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Reporters cannot confirm or dispute their own incident reports.',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await expect(confirmationsService.voteOnIncident(incidentId, 'CONFIRM')).rejects.toThrow(SelfVoteError);
  });

  it('5. should throw TerminalStateVoteError when voting on an expired, resolved, or rejected report (400 Bad Request)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'BAD_REQUEST',
            message: 'Cannot verify an incident that is already expired.',
          },
        }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await expect(confirmationsService.voteOnIncident(incidentId, 'CONFIRM')).rejects.toThrow(
      TerminalStateVoteError
    );
  });

  it('6. should throw DuplicateVoteError on duplicate vote submission with same action (409 Conflict)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: false,
          error: {
            code: 'CONFLICT',
            message: 'You have already voted to confirm this incident report.',
          },
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      )
    );

    await expect(confirmationsService.voteOnIncident(incidentId, 'CONFIRM')).rejects.toThrow(
      DuplicateVoteError
    );
  });

  it('7. should transition status to ACTIVE and COMMUNITY_CONFIRMED when 3-vote threshold is reached', async () => {
    const mockThresholdActivationResponse: VoteResult = {
      incidentId,
      action: 'CONFIRM',
      status: 'ACTIVE',
      verification: 'COMMUNITY_CONFIRMED',
      confirmationsCount: 3,
      disputesCount: 0,
    };

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockThresholdActivationResponse,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await confirmationsService.voteOnIncident(incidentId, 'CONFIRM');
    expect(result.confirmationsCount).toBe(3);
    expect(result.status).toBe('ACTIVE');
    expect(result.verification).toBe('COMMUNITY_CONFIRMED');
  });

  it('8. incidentsService.voteOnIncident should delegate seamlessly to confirmationsService', async () => {
    const mockSuccessResponse: VoteResult = {
      incidentId,
      action: 'CONFIRM',
      status: 'ACTIVE',
      verification: 'COMMUNITY_CONFIRMED',
      confirmationsCount: 3,
      disputesCount: 0,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockSuccessResponse,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await incidentsService.voteOnIncident(incidentId, 'CONFIRM');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [, init] = fetchSpy.mock.calls[0];
    expect(JSON.parse(init?.body as string)).toEqual({ action: 'CONFIRM' });
    expect(result.success).toBe(true);
    expect(result.confirmationsCount).toBe(3);
    expect(result.status).toBe('ACTIVE');
  });
});
