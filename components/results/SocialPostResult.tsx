"use client";

import { useState, useCallback } from "react";
import type { SeverityLevel } from "@/app/types";
import ResultCard from "@/components/ResultCard";

interface SocialPostResultProps {
  socialPost: string;
  severity: SeverityLevel;
  onCopy: () => void;
  copied: boolean;
}

export default function SocialPostResult({
  socialPost,
  severity,
  onCopy,
  copied,
}: SocialPostResultProps) {
  const [shareNotice, setShareNotice] = useState<string | null>(null);

  const copyAndNotify = useCallback(async (text: string, platform: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
    setShareNotice(`Content copied! Paste it in ${platform}.`);
    setTimeout(() => setShareNotice(null), 4000);
  }, []);

  function handleShareTwitter() {
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(socialPost)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  function handleShareFacebook() {
    // Facebook sharer doesn't support text-only sharing.
    // Copy content to clipboard first, then open Facebook.
    copyAndNotify(socialPost, "Facebook");
    window.open(
      `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(socialPost)}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  return (
    <ResultCard
      title="Social Media Post"
      icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
      }
      severity={severity}
      onCopy={onCopy}
      copied={copied}
      copyLabel="Copy Post"
      actions={
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleShareTwitter}
            className="text-xs bg-black hover:bg-gray-800 text-white px-3 py-1 rounded-full font-medium transition-colors"
          >
            Share on X
          </button>
          <button
            type="button"
            onClick={handleShareFacebook}
            className="text-xs bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded-full font-medium transition-colors"
          >
            Share to Facebook
          </button>
          {shareNotice && (
            <span className="text-xs font-medium text-green-700">
              {shareNotice}
            </span>
          )}
        </div>
      }
    >
      <div className="bg-white/60 rounded-md p-3 text-sm text-gray-800 whitespace-pre-line">
        {socialPost}
      </div>
    </ResultCard>
  );
}
