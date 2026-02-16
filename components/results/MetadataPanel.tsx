interface MetadataPanelProps {
  readabilityGrade: number;
  complianceFlags: string[];
}

export default function MetadataPanel({
  readabilityGrade,
  complianceFlags,
}: MetadataPanelProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Readability Grade */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Readability</h2>
        <p className="text-3xl font-bold text-blue-600">
          Grade {readabilityGrade}
        </p>
      </div>

      {/* Compliance Flags */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">Compliance Flags</h2>
        {complianceFlags.length === 0 ? (
          <p className="text-sm text-green-600 font-medium">No compliance issues detected</p>
        ) : (
          <ul className="space-y-1">
            {complianceFlags.map((flag, i) => (
              <li key={i} className="text-sm text-amber-700 flex items-start gap-1.5">
                <span className="text-amber-500 mt-0.5 shrink-0">!</span>
                {flag}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
