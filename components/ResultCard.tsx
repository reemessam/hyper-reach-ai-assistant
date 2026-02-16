interface ResultCardProps {
  title: string;
  badge?: React.ReactNode;
  onCopy: () => void;
  copied: boolean;
  copyLabel: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export default function ResultCard({
  title,
  badge,
  onCopy,
  copied,
  copyLabel,
  children,
  actions,
}: ResultCardProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {badge}
      </div>
      {children}
      <div className="flex items-center gap-3 mt-3">
        <button
          onClick={onCopy}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
        >
          {copied ? "Copied!" : copyLabel}
        </button>
        {actions}
      </div>
    </div>
  );
}
