import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { playAudioBuffer, stopAudio } from '../../lib/audioManager';

interface AudioMessagePlayerProps {
  audioUrl: string;
  autoPlay?: boolean;
  onPlaybackEnd?: () => void;
}

export const AudioMessagePlayer: React.FC<AudioMessagePlayerProps> = ({
  audioUrl,
  autoPlay = false,
  onPlaybackEnd,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(3);

  const cleanupRef = useRef<(() => void) | null>(null);
  const hasAutoPlayedRef = useRef(false);
  const onPlaybackEndRef = useRef(onPlaybackEnd);

  useEffect(() => {
    onPlaybackEndRef.current = onPlaybackEnd;
  }, [onPlaybackEnd]);

  const startPlayback = async () => {
    setIsPlaying(true);
    const stopFn = await playAudioBuffer(
      audioUrl,
      (curr, dur) => {
        setCurrentTime(curr);
        if (dur) setDuration(dur);
      },
      () => {
        setIsPlaying(false);
        setCurrentTime(0);
        onPlaybackEndRef.current?.();
      }
    );
    cleanupRef.current = stopFn;
  };

  const pausePlayback = () => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    stopAudio();
    setIsPlaying(false);
  };

  useEffect(() => {
    let active = true;

    if (autoPlay && !hasAutoPlayedRef.current) {
      hasAutoPlayedRef.current = true;
      const timer = setTimeout(() => {
        if (active) {
          startPlayback();
        }
      }, 60);

      return () => {
        active = false;
        clearTimeout(timer);
        pausePlayback();
      };
    }

    return () => {
      active = false;
      pausePlayback();
    };
  }, [audioUrl, autoPlay]);

  const togglePlay = () => {
    if (isPlaying) {
      pausePlayback();
    } else {
      startPlayback();
    }
  };

  const formatSecs = (secs: number) => {
    const s = Math.floor(secs % 60);
    const m = Math.floor(secs / 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="mt-2.5 p-2.5 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePlay}
          aria-label={isPlaying ? 'Pause audio response' : 'Play audio response'}
          className="h-8 w-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors shadow-xs shrink-0"
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-white" />
          ) : (
            <Play className="w-4 h-4 fill-white ml-0.5" />
          )}
        </button>

        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-primary block leading-none">
            {isPlaying ? 'Playing Audio' : 'Audio Response'}
          </span>
          <span className="text-xs font-semibold text-on-surface leading-none mt-1 block">
            {formatSecs(currentTime)} / {formatSecs(duration || 3)}
          </span>
        </div>
      </div>

      {/* Mini animated sound bars when playing */}
      <div className="flex items-center gap-1 h-5 px-1">
        {[4, 12, 18, 10, 16, 8, 14].map((h, i) => (
          <div
            key={i}
            style={{
              height: isPlaying ? `${h}px` : '4px',
              animationDuration: `${0.4 + (i % 3) * 0.2}s`,
            }}
            className={`w-[2.5px] rounded-full transition-all duration-150 ${
              isPlaying ? 'bg-primary animate-pulse' : 'bg-primary/30'
            }`}
          />
        ))}
      </div>

      <Volume2 className="w-4 h-4 text-primary shrink-0 opacity-70" />
    </div>
  );
};
