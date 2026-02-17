import type { GenerateResponse, SeverityLevel } from "@/app/types";

interface MetadataBarProps {
  metadata: GenerateResponse["metadata"];
  severity: SeverityLevel;
}

const barStyles: Record<SeverityLevel, string> = {
  Low: "bg-severity-low-bg border border-severity-low-border text-severity-low-text",
  Medium: "bg-severity-medium-bg border border-severity-medium-border text-severity-medium-text",
  High: "bg-severity-high-bg border border-severity-high-border text-severity-high-text",
};

export default function MetadataBar({ metadata, severity }: MetadataBarProps) {
  return (
    <div className={`rounded-lg px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-xs ${barStyles[severity]}`}>
      <span>
        <span className="font-semibold">Time:</span> {metadata.formatted_time}
      </span>
      <span>
        <span className="font-semibold">Sender:</span> {metadata.sender}
      </span>
      <span>
        <span className="font-semibold">Tone:</span> {metadata.tone}
      </span>
    </div>
  );
}
