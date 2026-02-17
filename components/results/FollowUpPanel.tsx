import type { SeverityLevel } from "@/app/types";

interface FollowUpPanelProps {
  suggestion: string;
  severity: SeverityLevel;
}

const cardStyles: Record<SeverityLevel, string> = {
  Low: "bg-severity-low-bg border-severity-low-border",
  Medium: "bg-severity-medium-bg border-severity-medium-border",
  High: "bg-severity-high-bg border-severity-high-border",
};

const headingStyles: Record<SeverityLevel, string> = {
  Low: "text-severity-low-text",
  Medium: "text-severity-medium-text",
  High: "text-severity-high-text",
};

export default function FollowUpPanel({ suggestion, severity }: FollowUpPanelProps) {
  return (
    <div className={`border rounded-lg p-6 ${cardStyles[severity]}`}>
      <div className="flex items-center gap-2 mb-2">
        <svg className={headingStyles[severity]} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
        <h2 className={`text-lg font-semibold ${headingStyles[severity]}`}>Suggested Follow-Up</h2>
      </div>
      <p className="text-sm text-gray-800">{suggestion}</p>
    </div>
  );
}
