"use client";

import { useState, useEffect, useRef, useCallback } from "react";

interface VoiceNotePlayerProps {
  text: string;
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function VoiceNotePlayer({ text }: VoiceNotePlayerProps) {
  const [supported, setSupported] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [totalSeconds, setTotalSeconds] = useState(0);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const seekOffsetRef = useRef(0);
  const totalLengthRef = useRef(0);
  const lastBoundaryCharRef = useRef(0);
  const startTimeRef = useRef(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    setSupported(typeof window !== "undefined" && "speechSynthesis" in window);
  }, []);

  // Estimate total duration for display (approximate, updated during playback)
  useEffect(() => {
    const words = text.split(/\s+/).length;
    setTotalSeconds(Math.ceil((words / 150) * 60));
  }, [text]);

  const cancelAnimation = useCallback(() => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
  }, []);

  const stopPlayback = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    cancelAnimation();
    utteranceRef.current = null;
    seekOffsetRef.current = 0;
    lastBoundaryCharRef.current = 0;
    setPlaying(false);
    setProgress(0);
    setElapsedSeconds(0);
  }, [cancelAnimation]);

  const animateProgress = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    setElapsedSeconds(Math.floor(seekOffsetRef.current / totalLengthRef.current * totalSeconds + elapsed));
    animationRef.current = requestAnimationFrame(animateProgress);
  }, [totalSeconds]);

  const startSpeaking = useCallback(
    (fromText: string, seekCharOffset: number) => {
      window.speechSynthesis.cancel();
      cancelAnimation();

      totalLengthRef.current = text.length;
      seekOffsetRef.current = seekCharOffset;
      lastBoundaryCharRef.current = 0;

      const utterance = new SpeechSynthesisUtterance(fromText);
      utterance.rate = 1;
      utterance.pitch = 1;
      utteranceRef.current = utterance;

      utterance.onboundary = (event: SpeechSynthesisEvent) => {
        if (event.name === "word") {
          lastBoundaryCharRef.current = event.charIndex;
          const absoluteChar = seekCharOffset + event.charIndex;
          const pct = (absoluteChar / totalLengthRef.current) * 100;
          setProgress(Math.min(pct, 100));
        }
      };

      utterance.onend = () => {
        cancelAnimation();
        setPlaying(false);
        setProgress(100);
        setElapsedSeconds(totalSeconds);
        setTimeout(() => {
          setProgress(0);
          setElapsedSeconds(0);
          seekOffsetRef.current = 0;
        }, 1500);
      };

      utterance.onerror = () => {
        stopPlayback();
      };

      startTimeRef.current = Date.now();
      setPlaying(true);
      animationRef.current = requestAnimationFrame(animateProgress);
      window.speechSynthesis.speak(utterance);
    },
    [text, cancelAnimation, stopPlayback, animateProgress, totalSeconds]
  );

  const togglePlayback = useCallback(() => {
    if (!supported) return;

    if (playing) {
      stopPlayback();
      return;
    }

    startSpeaking(text, 0);
  }, [supported, playing, text, stopPlayback, startSpeaking]);

  const handleSeek = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!supported) return;

      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const ratio = Math.max(0, Math.min(clickX / rect.width, 1));
      const targetChar = Math.floor(ratio * text.length);

      // Find nearest word boundary (space) to avoid splitting mid-word
      let seekIndex = targetChar;
      if (seekIndex > 0 && seekIndex < text.length) {
        // Look backward for nearest space
        const prevSpace = text.lastIndexOf(" ", seekIndex);
        if (prevSpace !== -1) {
          seekIndex = prevSpace + 1;
        }
      }

      const remainingText = text.slice(seekIndex);
      if (!remainingText.trim()) {
        stopPlayback();
        return;
      }

      setProgress(ratio * 100);
      startSpeaking(remainingText, seekIndex);
    },
    [supported, text, stopPlayback, startSpeaking]
  );

  // Cleanup on unmount
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
          <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor">
            <rect x="1" y="1" width="10" height="10" rx="1" />
          </svg>
        ) : (
          <svg width="12" height="14" viewBox="0 0 12 14" fill="currentColor">
            <path d="M1 1.5v11l10-5.5L1 1.5z" />
          </svg>
        )}
      </button>

      {/* Clickable progress bar for seeking */}
      <div
        role="progressbar"
        aria-valuenow={Math.round(progress)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Voice playback progress. Click to seek."
        className="flex-1 h-1.5 bg-gray-300 rounded-full overflow-hidden cursor-pointer"
        onClick={handleSeek}
      >
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>

      <span className="text-xs text-gray-500 shrink-0 tabular-nums">
        {playing
          ? `${formatTime(elapsedSeconds)} / ${formatTime(totalSeconds)}`
          : formatTime(totalSeconds)}
      </span>
    </div>
  );
}
