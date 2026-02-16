import ResultCard from "@/components/ResultCard";
import VoiceNotePlayer from "@/components/VoiceNotePlayer";

interface VoiceScriptResultProps {
  voiceScript: string;
  onCopy: () => void;
  copied: boolean;
}

export default function VoiceScriptResult({
  voiceScript,
  onCopy,
  copied,
}: VoiceScriptResultProps) {
  return (
    <ResultCard
      title="Voice Script"
      onCopy={onCopy}
      copied={copied}
      copyLabel="Copy Script"
    >
      <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-800 whitespace-pre-line">
        {voiceScript}
      </div>
      <VoiceNotePlayer text={voiceScript} />
    </ResultCard>
  );
}
