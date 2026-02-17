"use client";

import { useState } from "react";
import type { SeverityLevel } from "@/app/types";
import { sendSms } from "@/lib/actions";
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
  const [errorMsg, setErrorMsg] = useState("");
  const [recipient, setRecipient] = useState("");

  async function handleSendSms() {
    setSending(true);
    setSendStatus("idle");
    setErrorMsg("");

    const result = await sendSms(sms, recipient.trim() || undefined);

    setSending(false);
    if (result.ok) {
      setSendStatus("sent");
      setTimeout(() => setSendStatus("idle"), 3000);
    } else {
      setErrorMsg(result.error || "Failed to send SMS");
      setSendStatus("error");
      setTimeout(() => setSendStatus("idle"), 4000);
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
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <input
              type="tel"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              placeholder="Phone number (optional)"
              className="text-sm border border-gray-300 rounded-md px-2 py-1 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none w-48"
            />
            <button
              type="button"
              onClick={handleSendSms}
              disabled={sending}
              className="text-sm bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1 rounded-md font-medium transition-colors"
            >
              {sending ? "Sending..." : "Send SMS"}
            </button>
          </div>
          {sendStatus === "sent" && (
            <span className="text-xs text-green-700 font-medium">SMS sent!</span>
          )}
          {sendStatus === "error" && (
            <span className="text-xs text-red-700 font-medium">{errorMsg || "Failed to send."}</span>
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
