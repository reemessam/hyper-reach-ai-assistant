"use client";

import { useState } from "react";
import type { SeverityLevel } from "@/app/types";
import ResultCard from "@/components/ResultCard";

interface EmailResultProps {
  email: { subject: string; body: string };
  severity: SeverityLevel;
  onCopy: () => void;
  copied: boolean;
}

export default function EmailResult({ email, severity, onCopy, copied }: EmailResultProps) {
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "sent" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  async function handleSendEmail() {
    setSending(true);
    setSendStatus("idle");
    setErrorMsg("");
    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: email.subject, body: email.body }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to send email");
      }
      setSendStatus("sent");
      setTimeout(() => setSendStatus("idle"), 3000);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setErrorMsg(msg);
      setSendStatus("error");
      setTimeout(() => setSendStatus("idle"), 5000);
    } finally {
      setSending(false);
    }
  }

  return (
    <ResultCard
      title="Email"
      icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="20" height="16" rx="2" />
          <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
        </svg>
      }
      severity={severity}
      onCopy={onCopy}
      copied={copied}
      copyLabel="Copy Email"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSendEmail}
            disabled={sending}
            className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 rounded-md font-medium transition-colors"
          >
            {sending ? "Sending..." : "Send via SMTP"}
          </button>
          {sendStatus === "sent" && (
            <span className="text-xs text-green-700 font-medium">Email sent!</span>
          )}
          {sendStatus === "error" && (
            <span className="text-xs text-red-700 font-medium">{errorMsg || "Failed to send."}</span>
          )}
        </div>
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
          <div className="mt-1 bg-white/60 rounded-md p-3 text-sm text-gray-800 whitespace-pre-line">
            {email.body}
          </div>
        </div>
      </div>
    </ResultCard>
  );
}
