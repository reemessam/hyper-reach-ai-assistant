interface FollowUpPanelProps {
  suggestion: string;
}

export default function FollowUpPanel({ suggestion }: FollowUpPanelProps) {
  return (
    <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
      <h2 className="text-lg font-semibold text-blue-900 mb-2">Suggested Follow-Up</h2>
      <p className="text-sm text-blue-800">{suggestion}</p>
    </div>
  );
}
