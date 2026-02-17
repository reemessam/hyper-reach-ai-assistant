"use client";

import { useState, useCallback } from "react";
import type { SeverityLevel } from "@/app/types";
import ResultCard from "@/components/ResultCard";
import VoiceNotePlayer from "@/components/VoiceNotePlayer";

interface VoiceScriptResultProps {
  voiceScript: string;
  severity: SeverityLevel;
  onCopy: () => void;
  copied: boolean;
}

function synthesizeToBlob(text: string): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const audioCtx = new AudioContext();
    const dest = audioCtx.createMediaStreamDestination();
    const recorder = new MediaRecorder(dest.stream, { mimeType: "audio/webm" });
    const chunks: Blob[] = [];

    recorder.ondataavailable = (e: BlobEvent) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      audioCtx.close();
      resolve(new Blob(chunks, { type: "audio/webm" }));
    };

    recorder.onerror = () => {
      audioCtx.close();
      reject(new Error("Recording failed"));
    };

    // Use an oscillator as a silent source to keep the AudioContext alive
    const osc = audioCtx.createOscillator();
    osc.frequency.value = 0;
    osc.connect(dest);
    osc.start();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;

    utterance.onstart = () => {
      recorder.start();
    };

    utterance.onend = () => {
      osc.stop();
      recorder.stop();
    };

    utterance.onerror = () => {
      osc.stop();
      recorder.stop();
      reject(new Error("Speech synthesis failed"));
    };

    window.speechSynthesis.speak(utterance);
  });
}

export default function VoiceScriptResult({
  voiceScript,
  severity,
  onCopy,
  copied,
}: VoiceScriptResultProps) {
  const [sharing, setSharing] = useState(false);

  const handleShareWhatsApp = useCallback(async () => {
    setSharing(true);
    try {
      // Try Web Share API with audio file first (works on mobile)
      if (typeof navigator.share === "function" && typeof navigator.canShare === "function") {
        try {
          const blob = await synthesizeToBlob(voiceScript);
          const file = new File([blob], "voice-note.webm", { type: "audio/webm" });
          const shareData: ShareData = {
            text: voiceScript,
            files: [file],
          };
          if (navigator.canShare(shareData)) {
            await navigator.share(shareData);
            setSharing(false);
            return;
          }
        } catch {
          // If file sharing not supported, fall through to text-only share
        }

        // Text-only share
        try {
          await navigator.share({ text: voiceScript });
          setSharing(false);
          return;
        } catch {
          // User cancelled or not supported, fall through
        }
      }

      // Fallback: open WhatsApp with text
      const url = `https://wa.me/?text=${encodeURIComponent(voiceScript)}`;
      window.open(url, "_blank", "noopener,noreferrer");
    } finally {
      setSharing(false);
    }
  }, [voiceScript]);

  return (
    <ResultCard
      title="Voice Script"
      icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
          <line x1="12" y1="19" x2="12" y2="22" />
        </svg>
      }
      severity={severity}
      onCopy={onCopy}
      copied={copied}
      copyLabel="Copy Script"
      actions={
        <button
          type="button"
          onClick={handleShareWhatsApp}
          disabled={sharing}
          className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded-full font-medium transition-colors"
        >
          {sharing ? "Preparing..." : "Share to WhatsApp"}
        </button>
      }
    >
      <div className="bg-white/60 rounded-md p-3 text-sm text-gray-800 whitespace-pre-line">
        {voiceScript}
      </div>
      <VoiceNotePlayer text={voiceScript} />
    </ResultCard>
  );
}
