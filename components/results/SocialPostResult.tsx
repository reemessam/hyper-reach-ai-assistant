"use client";

import { useState } from "react";
import ResultCard from "@/components/ResultCard";

interface SocialPostResultProps {
  socialPost: string;
  onCopy: () => void;
  copied: boolean;
}

export default function SocialPostResult({
  socialPost,
  onCopy,
  copied,
}: SocialPostResultProps) {
  const [shareHint, setShareHint] = useState<string | null>(null);

  async function copyAndShare(platform: "twitter" | "facebook" | "linkedin") {
    try {
      await navigator.clipboard.writeText(socialPost);
    } catch {
      // clipboard may fail in some browsers, continue to open the share URL
    }

    let url: string;
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(socialPost)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(socialPost)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?summary=${encodeURIComponent(socialPost)}`;
        break;
    }

    setShareHint("Post copied to clipboard! Paste it in the opened window.");
    setTimeout(() => setShareHint(null), 4000);
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  }

  return (
    <ResultCard
      title="Social Media Post"
      onCopy={onCopy}
      copied={copied}
      copyLabel="Copy Post"
      actions={
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => copyAndShare("twitter")}
              className="text-xs bg-gray-900 hover:bg-gray-800 text-white px-3 py-1 rounded-full font-medium transition-colors"
            >
              Share to X
            </button>
            <button
              type="button"
              onClick={() => copyAndShare("facebook")}
              className="text-xs bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded-full font-medium transition-colors"
            >
              Share to Facebook
            </button>
            <button
              type="button"
              onClick={() => copyAndShare("linkedin")}
              className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full font-medium transition-colors"
            >
              Share to LinkedIn
            </button>
          </div>
          {shareHint && (
            <p className="text-xs text-amber-700 bg-amber-50 rounded px-2 py-1 font-medium">
              {shareHint}
            </p>
          )}
        </div>
      }
    >
      <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-800 whitespace-pre-line">
        {socialPost}
      </div>
    </ResultCard>
  );
}
