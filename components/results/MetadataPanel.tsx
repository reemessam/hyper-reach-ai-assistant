import type { SeverityLevel } from "@/app/types";

interface MetadataPanelProps {
  readabilityGrade: number;
  complianceFlags: string[];
  severity: SeverityLevel;
}

const severityCard: Record<SeverityLevel, string> = {
  Low: "border-severity-low-border bg-severity-low-bg",
  Medium: "border-severity-medium-border bg-severity-medium-bg",
  High: "border-severity-high-border bg-severity-high-bg",
};

const severityHeading: Record<SeverityLevel, string> = {
  Low: "text-severity-low-text",
  Medium: "text-severity-medium-text",
  High: "text-severity-high-text",
};

const severityAccent: Record<SeverityLevel, string> = {
  Low: "text-severity-low-accent",
  Medium: "text-severity-medium-accent",
  High: "text-severity-high-accent",
};

export default function MetadataPanel({
  readabilityGrade,
  complianceFlags,
  severity,
}: MetadataPanelProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <div className={`rounded-lg shadow-sm border p-6 ${severityCard[severity]}`}>
        <div className="flex items-center gap-2 mb-2">
          <svg className={severityHeading[severity]} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
            <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
          </svg>
          <h2 className={`text-lg font-semibold ${severityHeading[severity]}`}>Readability</h2>
        </div>
        <p className={`text-3xl font-bold ${severityAccent[severity]}`}>
          Grade {readabilityGrade}
        </p>
      </div>

      <div className={`rounded-lg shadow-sm border p-6 ${severityCard[severity]}`}>
        <div className="flex items-center gap-2 mb-2">
          <svg className={severityHeading[severity]} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          <h2 className={`text-lg font-semibold ${severityHeading[severity]}`}>Compliance Flags</h2>
        </div>
        {complianceFlags.length === 0 ? (
          <p className="text-sm text-green-600 font-medium">No compliance issues detected</p>
        ) : (
          <ul className="space-y-1">
            {complianceFlags.map((flag, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-1.5">
                <svg className="text-amber-500 mt-0.5 shrink-0" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                  <line x1="12" y1="9" x2="12" y2="13" />
                  <line x1="12" y1="17" x2="12.01" y2="17" />
                </svg>
                {flag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
