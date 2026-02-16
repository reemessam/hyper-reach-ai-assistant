"use client";

import { useState } from "react";
import ResultCard from "@/components/ResultCard";

interface EmailResultProps {
  email: { subject: string; body: string };
  onCopy: () => void;
  copied: boolean;
}

export default function EmailResult({ email, onCopy, copied }: EmailResultProps) {
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "success" | "error">("idle");
  const [sendError, setSendError] = useState<string | null>(null);

  async function handleSend() {
    setSending(true);
    setSendStatus("idle");
    setSendError(null);

    try {
      const res = await fetch("/api/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: email.subject, body: email.body }),
      });

      const data = await res.json();

      if (!res.ok) {
        setSendStatus("error");
        setSendError(data.error || "Failed to send email.");
        return;
      }

      setSendStatus("success");
      setTimeout(() => setSendStatus("idle"), 3000);
    } catch {
      setSendStatus("error");
      setSendError("Network error. Could not send email.");
    } finally {
      setSending(false);
    }
  }

  return (
    <ResultCard
      title="Email"
      onCopy={onCopy}
      copied={copied}
      copyLabel="Copy Email"
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSend}
            disabled={sending}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending ? "Sending..." : "Send Email"}
          </button>
          {sendStatus === "success" && (
            <span className="text-sm text-green-600 font-medium">Email sent!</span>
          )}
          {sendStatus === "error" && (
            <span className="text-sm text-red-600 font-medium">{sendError}</span>
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
          <div className="mt-1 bg-gray-50 rounded-md p-3 text-sm text-gray-800 whitespace-pre-line">
            {email.body}
          </div>
        </div>
      </div>
    </ResultCard>
  );
}
