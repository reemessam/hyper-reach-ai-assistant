import type { SeverityLevel } from "@/app/types";

interface ResultCardProps {
  title: string;
  icon: React.ReactNode;
  severity: SeverityLevel;
  badge?: React.ReactNode;
  onCopy: () => void;
  copied: boolean;
  copyLabel: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

const severityStyles: Record<SeverityLevel, { card: string; header: string; copyIdle: string; copyDone: string }> = {
  Low: {
    card: "border-severity-low-border bg-severity-low-bg",
    header: "text-severity-low-text",
    copyIdle: "text-severity-low-accent hover:text-severity-low-text",
    copyDone: "text-severity-low-text",
  },
  Medium: {
    card: "border-severity-medium-border bg-severity-medium-bg",
    header: "text-severity-medium-text",
    copyIdle: "text-severity-medium-accent hover:text-severity-medium-text",
    copyDone: "text-severity-medium-text",
  },
  High: {
    card: "border-severity-high-border bg-severity-high-bg",
    header: "text-severity-high-text",
    copyIdle: "text-severity-high-accent hover:text-severity-high-text",
    copyDone: "text-severity-high-text",
  },
};

export default function ResultCard({
  title,
  icon,
  severity,
  badge,
  onCopy,
  copied,
  copyLabel,
  children,
  actions,
}: ResultCardProps) {
  const s = severityStyles[severity];

  return (
    <div className={`rounded-lg shadow-sm border p-6 ${s.card}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className={s.header}>{icon}</span>
          <h2 className={`text-lg font-semibold ${s.header}`}>{title}</h2>
        </div>
        {badge}
      </div>
      {children}
      <div className="flex items-center gap-3 mt-3">
        <button
          type="button"
          onClick={onCopy}
          className={`text-sm font-medium transition-colors ${copied ? s.copyDone : s.copyIdle}`}
        >
          {copied ? "Copied!" : copyLabel}
        </button>
        {actions}
      </div>
    </div>
  );
}
