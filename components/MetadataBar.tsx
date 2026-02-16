import type { GenerateResponse } from "@/app/types";

interface MetadataBarProps {
  metadata: GenerateResponse["metadata"];
}

export default function MetadataBar({ metadata }: MetadataBarProps) {
  return (
    <div className="bg-gray-100 rounded-lg px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-600">
      <span>
        <span className="font-medium text-gray-700">Time:</span>{" "}
        {metadata.formatted_time}
      </span>
      <span>
        <span className="font-medium text-gray-700">Sender:</span>{" "}
        {metadata.sender}
      </span>
      <span>
        <span className="font-medium text-gray-700">Tone:</span>{" "}
        {metadata.tone}
      </span>
    </div>
  );
}
