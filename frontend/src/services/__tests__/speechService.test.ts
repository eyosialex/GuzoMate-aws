// @vitest-environment happy-dom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { speechService } from '../speechService';
import {
  SpeechTranscriptionResult,
  SpeechSynthesisData,
} from '../../types/travelServices';

describe('Speech Services Module Integration (Phase 9)', () => {
  beforeEach(() => {
    localStorage.clear();
    localStorage.setItem('guzomate_token', 'mock_jwt_token_for_phase9');
    vi.restoreAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('1. should transcribe recorded audio payload (POST /speech/transcriptions)', async () => {
    const mockTransRes: SpeechTranscriptionResult = {
      text: 'ወደ መስቀል አደባባይ የሚወስደው መንገድ እንዴት ነው?',
      language: 'am',
      detectedLanguage: 'am',
      confidence: 0.94,
      provider: 'addis-ai',
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockTransRes,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await speechService.transcribe('data:audio/webm;base64,GkXfo5...', 'am', 'webm');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain('/speech/transcriptions');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({
      audio: 'data:audio/webm;base64,GkXfo5...',
      format: 'webm',
      language: 'am',
    });
    expect(result.text).toBe('ወደ መስቀል አደባባይ የሚወስደው መንገድ እንዴት ነው?');
    expect(result.confidence).toBe(0.94);
  });

  it('2. should synthesize localized voice audio from text (POST /speech/synthesis)', async () => {
    const mockSynthRes: SpeechSynthesisData = {
      provider: 'addis-ai',
      voiceId: 'am-hamen',
      language: 'am',
      audioUrl: 'https://cdn.addisassistant.com/audio/out.mp3',
      mimeType: 'audio/mpeg',
      durationSeconds: 4.1,
    };

    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          success: true,
          data: mockSynthRes,
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      )
    );

    const result = await speechService.synthesize('መንገድ ክፍት ነው', 'am', 'am-hamen');

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0];
    expect(url).toContain('/speech/synthesis');
    expect(init?.method).toBe('POST');
    expect(JSON.parse(init?.body as string)).toEqual({
      text: 'መንገድ ክፍት ነው',
      language: 'am',
      voiceId: 'am-hamen',
    });
    expect(result.voiceId).toBe('am-hamen');
    expect(result.durationSeconds).toBe(4.1);
  });
});
