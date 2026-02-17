"use client";

import { useState } from "react";
import type { SeverityLevel } from "@/app/types";
import { sendEmail } from "@/lib/actions";
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
  const [recipient, setRecipient] = useState("");

  async function handleSendEmail() {
    setSending(true);
    setSendStatus("idle");
    setErrorMsg("");

    const result = await sendEmail(email.subject, email.body, recipient.trim() || undefined);

    setSending(false);
    if (result.ok) {
      setSendStatus("sent");
      setTimeout(() => setSendStatus("idle"), 3000);
    } else {
      setErrorMsg(result.error || "Failed to send email");
      setSendStatus("error");
      setTimeout(() => setSendStatus("idle"), 5000);
    }
  }

  function handleOpenMailClient() {
    const mailto = `mailto:${encodeURIComponent(recipient.trim())}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`;
    window.open(mailto, "_blank");
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
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <input
              type="email"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Email address (optional)"
              className="text-sm border border-gray-300 rounded-md px-2 py-1 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-56"
            />
            <button
              type="button"
              onClick={handleSendEmail}
              disabled={sending}
              className="text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-1 rounded-md font-medium transition-colors"
            >
              {sending ? "Sending..." : "Send Email"}
            </button>
            <button
              type="button"
              onClick={handleOpenMailClient}
              className="text-sm border border-gray-300 text-gray-700 hover:bg-gray-50 px-3 py-1 rounded-md font-medium transition-colors"
            >
              Open in Mail
            </button>
          </div>
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
