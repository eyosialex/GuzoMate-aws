/**
 * Generates a clean, pleasant ambient chime audio WAV Blob URL.
 * Used for testing automatic audio playback until the backend voice service provides audio URLs.
 */
export function createPleasantChimeUrl(): string {
  try {
    const sampleRate = 22050;
    const duration = 2.5; // seconds
    const numSamples = Math.floor(sampleRate * duration);
    const buffer = new ArrayBuffer(44 + numSamples * 2);
    const view = new DataView(buffer);

    // Write WAV header
    const writeString = (offset: number, str: string) => {
      for (let i = 0; i < str.length; i++) {
        view.setUint8(offset + i, str.charCodeAt(i));
      }
    };

    writeString(0, 'RIFF');
    view.setUint32(4, 36 + numSamples * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true); // Subchunk1Size (16 for PCM)
    view.setUint16(20, 1, true); // AudioFormat (1 for PCM)
    view.setUint16(22, 1, true); // NumChannels (1 mono)
    view.setUint32(24, sampleRate, true); // SampleRate
    view.setUint32(28, sampleRate * 2, true); // ByteRate
    view.setUint16(32, 2, true); // BlockAlign
    view.setUint16(34, 16, true); // BitsPerSample
    writeString(36, 'data');
    view.setUint32(40, numSamples * 2, true);

    // Generate two harmonic notes (A4 440Hz + E5 659Hz) with smooth exponential decay envelope
    for (let i = 0; i < numSamples; i++) {
      const t = i / sampleRate;
      const envelope = Math.exp(-2.2 * t);
      const sample =
        (Math.sin(2 * Math.PI * 440 * t) * 0.4 +
          Math.sin(2 * Math.PI * 659.25 * t) * 0.35 +
          Math.sin(2 * Math.PI * 880 * t) * 0.15) *
        envelope;

      const intSample = Math.max(-32768, Math.min(32767, Math.floor(sample * 32767)));
      view.setInt16(44 + i * 2, intSample, true);
    }

    const blob = new Blob([buffer], { type: 'audio/wav' });
    return URL.createObjectURL(blob);
  } catch (err) {
    console.warn('Audio tone generation fallback', err);
    return '';
  }
}
