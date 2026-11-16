import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';
import { soundManager } from '../utils/audio';

const WAVE_BARS = [35, 65, 45, 90, 75, 40, 80, 100, 60, 85, 50, 70, 95, 45, 60, 80, 55, 75, 40, 65];

export default function VoiceMessagePlayer({ audioData, duration = 0, isMe = false, isGhost = false }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(duration || 0);
  const audioRef = useRef(null);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(Math.round(audio.duration));
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setIsPlaying(false);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.pause();
    };
  }, []);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      soundManager.playBeep(700, 0.03);
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Playback error:', e);
        setIsPlaying(false);
      });
    }
  };

  const handleSeek = (index) => {
    const audio = audioRef.current;
    if (!audio || totalDuration <= 0) return;
    const targetTime = (index / WAVE_BARS.length) * totalDuration;
    audio.currentTime = targetTime;
    setCurrentTime(targetTime);
    if (!isPlaying) {
      audio.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  const formatTime = (seconds) => {
    const s = Math.max(0, Math.floor(seconds));
    const m = Math.floor(s / 60);
    const rem = s % 60;
    return `${m}:${rem < 10 ? '0' : ''}${rem}`;
  };

  const progressPercent = totalDuration > 0 ? (currentTime / totalDuration) : 0;

  return (
    <div
      className={`p-2 sm:p-2.5 rounded-2xl flex items-center gap-2.5 sm:gap-3 min-w-[210px] sm:min-w-[240px] max-w-[280px] sm:max-w-[320px] shadow-md border select-none transition-all ${
        isMe
          ? isGhost
            ? 'bg-purple-900/70 border-purple-500/80 text-white rounded-tr-none shadow-[0_0_15px_rgba(168,85,247,0.35)]'
            : 'bg-amber-500/20 border-amber-500/70 text-amber-200 rounded-tr-none shadow-[0_0_15px_rgba(245,158,11,0.25)]'
          : isGhost
          ? 'bg-purple-950/90 border-purple-700/70 text-purple-200 rounded-tl-none'
          : 'bg-zinc-800/95 border-zinc-700/80 text-zinc-100 rounded-tl-none'
      }`}
    >
      <audio ref={audioRef} src={audioData} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center shrink-0 transition-all cursor-pointer shadow-md ${
          isMe
            ? isGhost
              ? 'bg-purple-500 hover:bg-purple-400 text-white shadow-purple-500/40'
              : 'bg-amber-500 hover:bg-amber-400 text-black shadow-amber-500/40'
            : isGhost
            ? 'bg-purple-600 hover:bg-purple-500 text-white shadow-purple-600/30'
            : 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-cyan-500/30'
        } ${isPlaying ? 'scale-105' : 'hover:scale-105'}`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform & Timing */}
      <div className="flex-1 min-w-0">
        {/* Animated Waveform Bars */}
        <div className="flex items-center gap-0.5 sm:gap-1 h-6 cursor-pointer py-1" title="Перемотка">
          {WAVE_BARS.map((height, i) => {
            const barFraction = i / WAVE_BARS.length;
            const isPassed = barFraction <= progressPercent;
            return (
              <div
                key={i}
                onClick={() => handleSeek(i)}
                style={{ height: `${Math.max(18, height)}%` }}
                className={`w-1 rounded-full transition-all duration-150 ${
                  isPassed
                    ? isGhost
                      ? 'bg-purple-400 shadow-[0_0_6px_rgba(192,132,252,0.8)]'
                      : isMe
                      ? 'bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.8)]'
                      : 'bg-cyan-400 shadow-[0_0_6px_rgba(34,211,238,0.8)]'
                    : isGhost
                    ? 'bg-purple-900/60'
                    : 'bg-zinc-600/60'
                } ${isPlaying && isPassed ? 'animate-pulse' : ''}`}
              />
            );
          })}
        </div>

        {/* Time Labels */}
        <div className="flex items-center justify-between text-[10px] font-mono opacity-80 mt-0.5">
          <span>{isPlaying ? formatTime(currentTime) : formatTime(totalDuration)}</span>
          <span className="flex items-center gap-0.5">
            <Volume2 className="w-2.5 h-2.5" />
            <span>{formatTime(totalDuration)}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
