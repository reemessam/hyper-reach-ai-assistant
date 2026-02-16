import ResultCard from "@/components/ResultCard";

interface SmsResultProps {
  sms: string;
  onCopy: () => void;
  copied: boolean;
}

export default function SmsResult({ sms, onCopy, copied }: SmsResultProps) {
  return (
    <ResultCard
      title="SMS Message"
      badge={
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            sms.length <= 160
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {sms.length}/160 chars
        </span>
      }
      onCopy={onCopy}
      copied={copied}
      copyLabel="Copy SMS"
    >
      <p className="text-gray-800 bg-gray-50 rounded-md p-3 text-sm font-mono">
        {sms}
      </p>
    </ResultCard>
  );
}
