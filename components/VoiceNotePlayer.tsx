"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface VoiceNotePlayerProps {
  text: string;
}

export default function VoiceNotePlayer({ text }: VoiceNotePlayerProps) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const animationRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(0);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  const estimateDuration = useCallback((t: string): number => {
    // Approximate: ~150 words per minute at rate=1
    const words = t.split(/\s+/).length;
    return (words / 150) * 60 * 1000; // ms
  }, []);

  const stopPlayback = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    setPlaying(false);
    setProgress(0);
  }, []);

  const animateProgress = useCallback(() => {
    const elapsed = Date.now() - startTimeRef.current;
    const pct = Math.min((elapsed / durationRef.current) * 100, 100);
    setProgress(pct);
    if (pct < 100) {
      animationRef.current = requestAnimationFrame(animateProgress);
    }
  }, []);

  const togglePlayback = useCallback(() => {
    if (!supported) return;

    if (playing) {
      stopPlayback();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;

    durationRef.current = estimateDuration(text);
    startTimeRef.current = Date.now();

    utterance.onend = () => {
      setPlaying(false);
      setProgress(100);
      if (animationRef.current !== null) {
        cancelAnimationFrame(animationRef.current);
        animationRef.current = null;
      }
      setTimeout(() => setProgress(0), 1500);
    };

    utterance.onerror = () => {
      stopPlayback();
    };

    setPlaying(true);
    animationRef.current = requestAnimationFrame(animateProgress);
    window.speechSynthesis.speak(utterance);
  }, [supported, playing, text, stopPlayback, estimateDuration, animateProgress]);

  useEffect(() => {
    return () => {
      stopPlayback();
    };
  }, [stopPlayback]);

  if (!supported) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 mt-3 bg-gray-100 rounded-full px-3 py-2 max-w-xs">
      <button
        type="button"
        onClick={togglePlayback}
        className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-blue-600 hover:bg-blue-700 text-white transition-colors"
        aria-label={playing ? "Stop voice playback" : "Play voice note"}
      >
        {playing ? (
          <svg
            width="12"
            height="12"
            viewBox="0 0 12 12"
            fill="currentColor"
          >
            <rect x="1" y="1" width="10" height="10" rx="1" />
          </svg>
        ) : (
          <svg
            width="12"
            height="14"
            viewBox="0 0 12 14"
            fill="currentColor"
          >
            <path d="M1 1.5v11l10-5.5L1 1.5z" />
          </svg>
        )}
      </button>

      <div className="flex-1 h-1 bg-gray-300 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="text-xs text-gray-500 shrink-0 w-8 text-right">
        {playing
          ? `${Math.ceil(((100 - progress) / 100) * estimateDuration(text) / 1000)}s`
          : `${Math.ceil(estimateDuration(text) / 1000)}s`}
      </span>
    </div>
  );
}
