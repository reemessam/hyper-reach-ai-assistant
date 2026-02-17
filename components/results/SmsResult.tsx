"use client";

import { useState } from "react";
import type { SeverityLevel } from "@/app/types";
import ResultCard from "@/components/ResultCard";

interface SmsResultProps {
  sms: string;
  severity: SeverityLevel;
  onCopy: () => void;
  copied: boolean;
}

export default function SmsResult({ sms, severity, onCopy, copied }: SmsResultProps) {
  const [sending, setSending] = useState(false);
  const [sendStatus, setSendStatus] = useState<"idle" | "sent" | "error">("idle");

  async function handleSendSms() {
    setSending(true);
    setSendStatus("idle");
    try {
      const res = await fetch("/api/send-sms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: sms }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to send SMS");
      }
      setSendStatus("sent");
      setTimeout(() => setSendStatus("idle"), 3000);
    } catch {
      setSendStatus("error");
      setTimeout(() => setSendStatus("idle"), 4000);
    } finally {
      setSending(false);
    }
  }

  return (
    <ResultCard
      title="SMS Message"
      icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      }
      severity={severity}
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
      actions={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleSendSms}
            disabled={sending}
            className="text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded-md font-medium transition-colors"
          >
            {sending ? "Sending..." : "Send SMS via Twilio"}
          </button>
          {sendStatus === "sent" && (
            <span className="text-xs text-green-700 font-medium">SMS sent!</span>
          )}
          {sendStatus === "error" && (
            <span className="text-xs text-red-700 font-medium">Failed to send. Check Twilio config.</span>
          )}
        </div>
      }
    >
      <p className="text-gray-800 bg-white/60 rounded-md p-3 text-sm font-mono">
        {sms}
      </p>
    </ResultCard>
  );
}
