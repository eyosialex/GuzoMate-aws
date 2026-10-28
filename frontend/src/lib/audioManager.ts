/**
 * Audio Manager that ensures reliable browser audio playback.
 * Unlocks Web Audio during user gesture so that delayed AI responses
 * (after voice recording and silence detection) can automatically play without browser blocking.
 */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let sharedCtx: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let currentAudio: HTMLAudioElement | null = null;
let sharedAudio: HTMLAudioElement | null = null;
let activeUtterance: SpeechSynthesisUtterance | null = null;

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
  // 1. Prime Web Audio with silent 1-sample buffer (permanently unblocks AudioContext in Chrome/Safari/Firefox)
  if (ctx) {
    try {
      const buffer = ctx.createBuffer(1, 1, 22050);
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);
      source.start(0);
    } catch {
      // ignore
    }
  }

  // 2. Prime HTML5 Audio element during user gesture
  if (typeof window !== 'undefined') {
    try {
      if (!sharedAudio) {
        sharedAudio = new Audio();
      }
      sharedAudio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQAAAAA=';
      sharedAudio.play().then(() => {
        sharedAudio?.pause();
      }).catch(() => {});
    } catch {
      // ignore
    }
  }

  // 3. Prime Web Speech Synthesis
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      const dummy = new SpeechSynthesisUtterance('');
      dummy.volume = 0;
      window.speechSynthesis.speak(dummy);
    } catch {
      // ignore
    }
  }
}

/**
 * Plays an audio URL through the unlocked AudioContext (bypassing transient gesture expiration),
 * with graceful fallback to Web Speech Synthesis or HTML5 Audio element.
 */
export async function playAudioBuffer(
  audioUrl: string,
  onProgress?: (currentTime: number, duration: number) => void,
  onEnd?: () => void
): Promise<() => void> {
  // Stop any currently playing audio
  stopAudio();

  // Handle native Web Speech Synthesis URI
  if (audioUrl.startsWith('speech:')) {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();

      const queryIndex = audioUrl.indexOf('?');
      let rawText = '';
      let lang = 'en';

      if (queryIndex !== -1) {
        rawText = audioUrl.slice(7, queryIndex);
        const params = new URLSearchParams(audioUrl.slice(queryIndex));
        lang = params.get('lang') || 'en';
      } else {
        rawText = audioUrl.slice(7);
      }

      const text = decodeURIComponent(rawText);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'am' ? 'am-ET' : lang === 'om' ? 'om-ET' : 'en-US';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Estimate duration based on text length (~140 words per min)
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      const estimatedDuration = Math.max(3, Math.round(wordCount / 2.3));

      const startTime = Date.now();
      const progressTimer = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        onProgress?.(Math.min(estimatedDuration, elapsed), estimatedDuration);
      }, 100);

      activeUtterance = utterance;

      let isFinished = false;
      const finish = () => {
        if (isFinished) return;
        isFinished = true;
        clearInterval(progressTimer);
        activeUtterance = null;
        onEnd?.();
      };

      utterance.onend = finish;
      utterance.onerror = (e) => {
        console.warn('[audioManager] SpeechSynthesis error:', e);
        finish();
      };

      window.speechSynthesis.speak(utterance);

      return () => {
        clearInterval(progressTimer);
        if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel();
        }
        activeUtterance = null;
      };
    }
  }

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

      // Report initial duration immediately
      onProgress?.(0, duration);

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
  const audio = sharedAudio || new Audio();
  currentAudio = audio;
  audio.src = audioUrl;
  audio.currentTime = 0;
  audio.play().catch((err) => console.warn('HTML5 Audio play blocked:', err));

  const handleTimeUpdate = () => {
    onProgress?.(audio.currentTime, audio.duration || 3);
  };
  const handleEnded = () => {
    if (currentAudio === audio) {
      currentAudio = null;
    }
    onEnd?.();
  };

  audio.addEventListener('timeupdate', handleTimeUpdate);
  audio.addEventListener('ended', handleEnded);

  return () => {
    if (currentAudio === audio) {
      currentAudio = null;
    }
    audio.pause();
    audio.removeEventListener('timeupdate', handleTimeUpdate);
    audio.removeEventListener('ended', handleEnded);
  };
}

export function stopAudio(): void {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
    } catch {
      // ignore
    }
    activeUtterance = null;
  }
  if (currentSource) {
    try {
      currentSource.stop();
    } catch {
      // ignore
    }
    currentSource = null;
  }
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // ignore
    }
    currentAudio = null;
  }
}
