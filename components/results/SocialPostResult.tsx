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

type Platform = "twitter" | "facebook";

export default function SocialPostResult({
  socialPost,
  severity,
  onCopy,
  copied,
}: SocialPostResultProps) {
  const [posting, setPosting] = useState<Platform | null>(null);
  const [postStatus, setPostStatus] = useState<Record<Platform, "idle" | "posted" | "error">>({
    twitter: "idle",
    facebook: "idle",
  });

  async function handlePost(platform: Platform) {
    setPosting(platform);
    setPostStatus((prev) => ({ ...prev, [platform]: "idle" }));
    try {
      const res = await fetch("/api/post-social", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ platform, message: socialPost }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to post");
      }
      setPostStatus((prev) => ({ ...prev, [platform]: "posted" }));
      setTimeout(
        () => setPostStatus((prev) => ({ ...prev, [platform]: "idle" })),
        3000
      );
    } catch {
      setPostStatus((prev) => ({ ...prev, [platform]: "error" }));
      setTimeout(
        () => setPostStatus((prev) => ({ ...prev, [platform]: "idle" })),
        4000
      );
    } finally {
      setPosting(null);
    }
  }

  function statusLabel(platform: Platform): string | null {
    if (postStatus[platform] === "posted") return "Posted!";
    if (postStatus[platform] === "error") return "Failed. Check API keys.";
    return null;
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
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Twitter / X */}
            <button
              type="button"
              onClick={() => handlePost("twitter")}
              disabled={posting !== null}
              className="text-xs bg-gray-900 hover:bg-gray-800 disabled:opacity-50 text-white px-3 py-1 rounded-full font-medium transition-colors"
            >
              {posting === "twitter" ? "Posting..." : "Post to X"}
            </button>
            {statusLabel("twitter") && (
              <span
                className={`text-xs font-medium ${
                  postStatus.twitter === "posted"
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {statusLabel("twitter")}
              </span>
            )}

            {/* Facebook */}
            <button
              type="button"
              onClick={() => handlePost("facebook")}
              disabled={posting !== null}
              className="text-xs bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white px-3 py-1 rounded-full font-medium transition-colors"
            >
              {posting === "facebook" ? "Posting..." : "Post to Facebook"}
            </button>
            {statusLabel("facebook") && (
              <span
                className={`text-xs font-medium ${
                  postStatus.facebook === "posted"
                    ? "text-green-700"
                    : "text-red-700"
                }`}
              >
                {statusLabel("facebook")}
              </span>
            )}
          </div>
        </div>
      }
    >
      <div className="bg-white/60 rounded-md p-3 text-sm text-gray-800 whitespace-pre-line">
        {socialPost}
      </div>
    </ResultCard>
  );
}
