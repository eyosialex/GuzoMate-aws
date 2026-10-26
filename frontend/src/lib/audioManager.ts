/**
 * Audio Manager that ensures reliable browser audio playback.
 * Unlocks Web Audio during user gesture so that delayed AI responses
 * (after voice recording and silence detection) can automatically play without browser blocking.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharedCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

export function getUnlockedAudioContext(): AudioContext | null {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!sharedCtx && AudioCtx) {
      sharedCtx = new AudioCtx();
    }
    if (sharedCtx && sharedCtx.state === 'suspended') {
      sharedCtx.resume().catch(() => {});
    }
    return sharedCtx;
  } catch {
    return null;
  }
}

/**
 * Call on direct user click/touch to warm up the browser's audio permissions
 */
export function warmUpAudio(): void {
  const ctx = getUnlockedAudioContext();
  if (ctx && ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }
}

/**
 * Plays an audio URL through the unlocked AudioContext (bypassing transient gesture expiration),
 * with graceful fallback to HTML5 Audio element.
 */
export async function playAudioBuffer(
  audioUrl: string,
  onProgress?: (currentTime: number, duration: number) => void,
  onEnd?: () => void
): Promise<() => void> {
  // Stop any currently playing audio
  stopAudio();

  const ctx = getUnlockedAudioContext();

  if (ctx) {
    try {
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      const response = await fetch(audioUrl);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(arrayBuffer);

      const source = ctx.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(ctx.destination);

      currentSource = source;
      const startTime = ctx.currentTime;
      const duration = audioBuffer.duration;

      // Progress interval
      const interval = setInterval(() => {
        if (!currentSource) {
          clearInterval(interval);
          return;
        }
        const elapsed = Math.min(duration, ctx.currentTime - startTime);
        onProgress?.(elapsed, duration);
      }, 100);

      source.onended = () => {
        clearInterval(interval);
        currentSource = null;
        onEnd?.();
      };

      source.start(0);

      return () => {
        clearInterval(interval);
        try {
          source.stop();
        } catch {
          // ignore
        }
        currentSource = null;
      };
    } catch (err) {
      console.warn('Web Audio playback failed, falling back to HTML5 Audio:', err);
    }
  }

  // Fallback: standard HTML5 Audio
  const audio = new Audio(audioUrl);
  audio.play().catch((err) => console.warn('HTML5 Audio play blocked:', err));

  const handleTimeUpdate = () => {
    onProgress?.(audio.currentTime, audio.duration || 3);
  };
  const handleEnded = () => {
    onEnd?.();
  };

  audio.addEventListener('timeupdate', handleTimeUpdate);
  audio.addEventListener('ended', handleEnded);

  return () => {
    audio.pause();
    audio.removeEventListener('timeupdate', handleTimeUpdate);
    audio.removeEventListener('ended', handleEnded);
  };
}

export function stopAudio(): void {
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      // ignore
    }
    currentSource = null;
  }
}
