"use client";

import { useState } from "react";
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
  const [fbCopied, setFbCopied] = useState(false);

  function handleShareToFacebook() {
    navigator.clipboard.writeText(socialPost).then(() => {
      setFbCopied(true);
      setTimeout(() => setFbCopied(false), 4000);
      window.open(
        "https://www.facebook.com/",
        "_blank",
        "noopener,noreferrer"
      );
    });
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
            onClick={handleShareToFacebook}
            className="text-xs bg-blue-700 hover:bg-blue-800 text-white px-3 py-1 rounded-full font-medium transition-colors"
          >
            Share to Facebook
          </button>
          {fbCopied && (
            <span className="text-xs font-medium text-green-700">
              Copied! Paste it into your new Facebook post.
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
