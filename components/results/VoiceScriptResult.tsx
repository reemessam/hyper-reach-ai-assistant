"use client";

import type { SeverityLevel } from "@/app/types";
import ResultCard from "@/components/ResultCard";
import VoiceNotePlayer from "@/components/VoiceNotePlayer";

interface VoiceScriptResultProps {
  voiceScript: string;
  severity: SeverityLevel;
  onCopy: () => void;
  copied: boolean;
  mapUrl?: string;
}

export default function VoiceScriptResult({
  voiceScript,
  severity,
  onCopy,
  copied,
  mapUrl,
}: VoiceScriptResultProps) {
  const scriptWithMap = mapUrl ? `${voiceScript}\n\nLocation: ${mapUrl}` : voiceScript;

  function handleShareWhatsApp() {
    const url = `https://wa.me/?text=${encodeURIComponent(scriptWithMap)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

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
          className="text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full font-medium transition-colors"
        >
          Share to WhatsApp
        </button>
      }
    >
      <div className="bg-white/60 rounded-md p-3 text-sm text-gray-800 whitespace-pre-line">
        {voiceScript}
      </div>
      {mapUrl && (
        <p className="mt-1 px-3 text-xs">
          <a
            href={mapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:text-blue-800 hover:underline break-all"
          >
            View on Google Maps
          </a>
        </p>
      )}
      <VoiceNotePlayer text={voiceScript} />
    </ResultCard>
  );
}
