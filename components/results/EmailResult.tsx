import ResultCard from "@/components/ResultCard";

interface EmailResultProps {
  email: { subject: string; body: string };
  onCopy: () => void;
  copied: boolean;
}

export default function EmailResult({ email, onCopy, copied }: EmailResultProps) {
  function handleSendEmail() {
    const mailto = `mailto:?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
    window.open(mailto, "_blank");
  }

  return (
    <ResultCard
      title="Email"
      onCopy={onCopy}
      copied={copied}
      copyLabel="Copy Email"
      actions={
        <button
          type="button"
          onClick={handleSendEmail}
          className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md font-medium transition-colors"
        >
          Open in Email Client
        </button>
      }
    >
      <div className="space-y-3">
        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Subject
          </span>
          <p className="text-gray-800 font-medium mt-1">{email.subject}</p>
        </div>
        <div>
          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            Body
          </span>
          <div className="mt-1 bg-gray-50 rounded-md p-3 text-sm text-gray-800 whitespace-pre-line">
            {email.body}
          </div>
        </div>
      </div>
    </ResultCard>
  );
}
