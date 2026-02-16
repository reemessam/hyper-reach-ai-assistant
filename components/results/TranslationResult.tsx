import ResultCard from "@/components/ResultCard";

interface TranslationResultProps {
  esSms: string;
  onCopy: () => void;
  copied: boolean;
}

export default function TranslationResult({
  esSms,
  onCopy,
  copied,
}: TranslationResultProps) {
  return (
    <ResultCard
      title="Spanish SMS Translation"
      badge={
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            esSms.length <= 160
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {esSms.length}/160 chars
        </span>
      }
      onCopy={onCopy}
      copied={copied}
      copyLabel="Copy Spanish SMS"
    >
      <p className="text-gray-800 bg-gray-50 rounded-md p-3 text-sm font-mono">
        {esSms}
      </p>
    </ResultCard>
  );
}
