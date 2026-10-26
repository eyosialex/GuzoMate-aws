import React, { useEffect, useRef, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { X, Check } from 'lucide-react';
import { springGentle } from '../../lib/motion';

interface SoundWaveVisualizerProps {
  stream: MediaStream | null;
  silenceSeconds: number | null;
  isSpeaking: boolean;
  onCancel: () => void;
  onSendNow: () => void;
}

export const SoundWaveVisualizer: React.FC<SoundWaveVisualizerProps> = ({
  stream,
  silenceSeconds,
  isSpeaking,
  onCancel,
  onSendNow,
}) => {
  const shouldReduceMotion = useReducedMotion();
  const [frequencies, setFrequencies] = useState<number[]>(() =>
    Array.from({ length: 28 }, () => 0.25)
  );

  const animationFrameRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Setup Web Audio Analyser if stream is available
  useEffect(() => {
    if (!stream) return;

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const audioCtx = new AudioCtx();
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;

      const source = audioCtx.createMediaStreamSource(stream);
      source.connect(analyser);

      audioContextRef.current = audioCtx;
      analyserRef.current = analyser;
    } catch (err) {
      console.warn('AudioContext not supported or restricted:', err);
    }

    return () => {
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        try {
          audioContextRef.current.close();
        } catch {
          // ignore
        }
      }
    };
  }, [stream]);

  // Animation loop to sample audio or synthesize realistic dynamic sound waves
  useEffect(() => {
    let tick = 0;

    const updateWave = () => {
      tick += 0.08;
      const analyser = analyserRef.current;

      if (analyser) {
        const bufferLength = analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyser.getByteFrequencyData(dataArray);

        // Map to 28 bars
        const barCount = 28;
        const newFreqs: number[] = [];
        for (let i = 0; i < barCount; i++) {
          const index = Math.floor((i / barCount) * (bufferLength / 2));
          const val = dataArray[index] / 255;
          // Add a subtle base wave so it's always animated even in low room noise
          const base = 0.12 + 0.1 * Math.sin(tick * 2 + i * 0.4);
          newFreqs.push(Math.max(base, val));
        }
        setFrequencies(newFreqs);
      } else {
        // Fallback procedural wave reacting to speaking state
        const barCount = 28;
        const amplitude = isSpeaking ? 0.75 : 0.28;
        const newFreqs: number[] = [];
        for (let i = 0; i < barCount; i++) {
          const wave =
            Math.sin(tick * 3 + i * 0.5) * 0.4 +
            Math.cos(tick * 1.8 + i * 0.3) * 0.3 +
            0.45;
          newFreqs.push(Math.max(0.12, Math.min(1, wave * amplitude)));
        }
        setFrequencies(newFreqs);
      }

      animationFrameRef.current = requestAnimationFrame(updateWave);
    };

    animationFrameRef.current = requestAnimationFrame(updateWave);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isSpeaking]);

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, scale: 1 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, scale: 0.98 }}
      transition={springGentle}
      className="flex-1 min-h-[44px] h-11 px-3 bg-gradient-to-r from-primary/10 via-surface-low to-secondary/10 border border-primary/30 rounded-full flex items-center justify-between gap-2 shadow-xs overflow-hidden"
    >
      {/* Status indicator on the left */}
      <div className="flex items-center gap-1.5 shrink-0 pl-1">
        <span className="relative flex h-2.5 w-2.5">
          <span
            className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              silenceSeconds !== null ? 'bg-amber-400' : 'bg-primary'
            }`}
          />
          <span
            className={`relative inline-flex rounded-full h-2.5 w-2.5 ${
              silenceSeconds !== null ? 'bg-secondary' : 'bg-primary'
            }`}
          />
        </span>

        <span className="text-[11px] font-bold text-on-surface whitespace-nowrap leading-none hidden sm:inline">
          {silenceSeconds !== null ? (
            <span className="text-secondary font-bold">
              Sending in {silenceSeconds}s...
            </span>
          ) : (
            <span className="text-primary font-bold">Listening...</span>
          )}
        </span>
      </div>

      {/* Real-Time Sound Wave Bars */}
      <div className="flex-1 flex items-center justify-center gap-[3px] h-7 px-1 overflow-hidden">
        {frequencies.map((heightRatio, i) => {
          // Height between 4px and 26px
          const barHeight = Math.max(4, Math.round(heightRatio * 26));
          const isAmber = i % 5 === 0;

          return (
            <div
              key={i}
              style={{ height: `${barHeight}px` }}
              className={`w-[3px] rounded-full transition-all duration-75 ${
                isAmber ? 'bg-secondary' : 'bg-primary'
              }`}
            />
          );
        })}
      </div>

      {/* Action Controls on the right */}
      <div className="flex items-center gap-1 shrink-0">
        {silenceSeconds !== null && (
          <span className="text-[11px] font-bold text-secondary bg-secondary/15 px-2 py-0.5 rounded-full leading-none sm:hidden">
            {silenceSeconds}s
          </span>
        )}

        {/* Quick Send Now Checkmark Button */}
        <button
          type="button"
          onClick={onSendNow}
          aria-label="Send voice now"
          title="Send voice now"
          className="h-7 w-7 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors shadow-xs"
        >
          <Check className="w-3.5 h-3.5 stroke-[3]" />
        </button>

        {/* Cancel Recording Button */}
        <button
          type="button"
          onClick={onCancel}
          aria-label="Cancel recording"
          title="Cancel"
          className="h-7 w-7 rounded-full bg-surface-container text-on-surface-variant flex items-center justify-center hover:bg-surface-high transition-colors shadow-xs"
        >
          <X className="w-3.5 h-3.5 stroke-[2.5]" />
        </button>
      </div>
    </motion.div>
  );
};
