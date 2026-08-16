'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Pause, Sparkles } from 'lucide-react';

interface Props {
  text: string;
  headline?: string;
  locationName: string;
}

export const AIAudioBriefing: React.FC<Props> = ({ text, headline, locationName }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [progress, setProgress] = useState<number>(0);
  const [isSupported, setIsSupported] = useState(true);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

  const stopAudio = useCallback(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setIsPlaying(false);
    setProgress(0);
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
      setIsSupported(false);
    }
    return () => {
      stopAudio();
    };
  }, [stopAudio]);

  const startAudio = () => {
    if (typeof window === 'undefined' || !window.speechSynthesis) return;

    window.speechSynthesis.cancel();

    const fullScript = `Spatial Intelligence Briefing for ${locationName}. ${headline || ''}. ${text}`;
    const utterance = new SpeechSynthesisUtterance(fullScript);
    utterance.rate = playbackRate;
    utterance.pitch = 1.0;

    // Pick optimal natural English voice if available
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(v => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')));
    if (englishVoice) {
      utterance.voice = englishVoice;
    }

    const estimatedDurationSec = Math.max(10, (fullScript.split(' ').length / (2.5 * playbackRate)));

    utterance.onstart = () => {
      setIsPlaying(true);
      const startTime = Date.now();
      progressTimerRef.current = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        const currentPct = Math.min(100, (elapsed / estimatedDurationSec) * 100);
        setProgress(currentPct);
      }, 200);
    };

    utterance.onend = () => {
      setIsPlaying(false);
      setProgress(100);
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };

    utterance.onerror = () => {
      setIsPlaying(false);
      if (progressTimerRef.current) {
        clearInterval(progressTimerRef.current);
      }
    };

    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  const togglePlayPause = () => {
    if (isPlaying) {
      stopAudio();
    } else {
      startAudio();
    }
  };

  const changeSpeed = () => {
    const nextRate = playbackRate === 1.0 ? 1.25 : playbackRate === 1.25 ? 1.5 : 1.0;
    setPlaybackRate(nextRate);
    if (isPlaying) {
      stopAudio();
      setTimeout(startAudio, 50);
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="bg-zinc-950 p-5 rounded-xl border border-zinc-800/90 shadow-xl space-y-3 font-mono">
      <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
        <div className="flex items-center gap-2 text-xs font-bold text-white uppercase tracking-wider">
          <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>60-SECOND AI AUDIO BRIEFING</span>
        </div>

        <div className="flex items-center gap-2">
          {isPlaying && (
            <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              <span>SYNTHESIZING AUDIO</span>
            </span>
          )}
          <button
            onClick={changeSpeed}
            className="btn-interactive px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-[10px] font-bold text-zinc-300 hover:text-white cursor-pointer"
            title="Toggle playback speed"
          >
            {playbackRate}x SPEED
          </button>
        </div>
      </div>

      {/* Narrative script */}
      <p className="text-xs sm:text-sm text-zinc-300 font-sans leading-relaxed">
        {text}
      </p>

      {/* Audio Player Bar */}
      <div className="bg-black p-3 rounded-lg border border-zinc-900 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlayPause}
            className={`btn-interactive w-9 h-9 rounded-full flex items-center justify-center font-bold transition-all cursor-pointer ${
              isPlaying
                ? 'bg-emerald-400 text-black shadow-glow'
                : 'bg-white text-black hover:bg-zinc-200'
            }`}
            title={isPlaying ? 'Pause Audio Brief' : 'Play 60s Audio Brief'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4" />
            ) : (
              <Play className="w-4 h-4 ml-0.5" />
            )}
          </button>

          <div className="space-y-0.5">
            <span className="text-xs font-bold text-white block">
              {isPlaying ? 'Playing Audio Briefing...' : 'Listen to Executive Brief'}
            </span>
            <span className="text-[10px] text-zinc-500 font-sans block">
              Synthesized neural voice summary of local spatial intelligence
            </span>
          </div>
        </div>

        {/* Animated Speech Waveform Visualizer */}
        <div className="flex items-center gap-1 px-3 py-1 bg-zinc-950 rounded-lg border border-zinc-900 self-center">
          {[40, 75, 30, 90, 50, 85, 35, 100, 60, 45].map((h, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-200 ${
                isPlaying ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-700'
              }`}
              style={{
                height: isPlaying ? `${Math.max(6, (h * (0.4 + (i % 3) * 0.3)))}px` : '6px',
                animationDelay: `${i * 80}ms`
              }}
            />
          ))}
        </div>
      </div>

      {/* Progress line */}
      {isPlaying && (
        <div className="w-full bg-zinc-900 h-1 rounded-full overflow-hidden">
          <div
            className="bg-emerald-400 h-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
};
