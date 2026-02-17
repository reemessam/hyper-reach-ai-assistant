"use client";

import { useState, useCallback } from "react";
import type { Tone, IncidentRecord, FollowUp, FollowUpGenerateResponse } from "@/app/types";
import { TONE_OPTIONS } from "@/app/types";

interface FollowUpEditorProps {
  incident: IncidentRecord;
  onSendNow: (fu: Omit<FollowUp, "id" | "createdAtIso">) => void;
  sending?: boolean;
}

export default function FollowUpEditor({
  incident,
  onSendNow,
  sending = false,
}: FollowUpEditorProps) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<Tone>(incident.tone || "Neutral");
  const [smsChannel, setSmsChannel] = useState(true);
  const [emailChannel, setEmailChannel] = useState(true);
  const [smsText, setSmsText] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [smsRecipient, setSmsRecipient] = useState("");
  const [emailRecipient, setEmailRecipient] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [complianceFlags, setComplianceFlags] = useState<string[]>([]);
  const [confirmSend, setConfirmSend] = useState(false);

  const validateFollowUp = useCallback((): string[] => {
    const flags: string[] = [];
    if (smsChannel && smsText.length > 160) {
      flags.push("SMS exceeds 160 character limit.");
    }
    if (incident.severity === "High" && !incident.requiredAction) {
      flags.push("Missing required action for high severity incident.");
    }
    if (incident.confirmedFacts.length < 15) {
      flags.push("Insufficient confirmed details provided.");
    }
    return flags;
  }, [smsChannel, smsText.length, incident.severity, incident.requiredAction, incident.confirmedFacts]);

  function buildFollowUpData(): Omit<FollowUp, "id" | "createdAtIso"> {
    return {
      status: "sent",
      sentAtIso: new Date().toISOString(),
      content: {
        sms: smsText,
        email: { subject: emailSubject, body: emailBody },
      },
      channels: { sms: smsChannel, email: emailChannel },
      recipients: {
        smsTo: smsRecipient.trim() || undefined,
        emailTo: emailRecipient.trim() || undefined,
      },
      tone,
      compliance_flags: complianceFlags,
    };
  }

  function handleSendNow() {
    if (!smsChannel && !emailChannel) return;
    if (smsChannel && !smsText.trim()) return;
    if (emailChannel && (!emailSubject.trim() || !emailBody.trim())) return;

    const flags = validateFollowUp();
    setComplianceFlags(flags);

    if (flags.length > 0 && !confirmSend) {
      setConfirmSend(true);
      return;
    }

    setConfirmSend(false);
    onSendNow(buildFollowUpData());
    resetForm();
  }

  async function handleDraftWithAI() {
    setAiLoading(true);
    setAiError(null);
    setComplianceFlags([]);

    const lastFollowUpSms =
      incident.followUps.length > 0 ? incident.followUps[0].content.sms : null;

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: "follow_up",
          incidentType: incident.incidentType,
          location: incident.location,
          severity: incident.severity,
          confirmedFacts: incident.confirmedFacts,
          requiredAction: incident.requiredAction,
          audience: incident.audience,
          readingLevel: incident.readingLevel,
          tone,
          sender: incident.sender,
          previousSms: incident.outputs.sms,
          lastFollowUpSms,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        const fu = data as FollowUpGenerateResponse;
        setSmsText(fu.follow_up.sms);
        setEmailSubject(fu.follow_up.email.subject);
        setEmailBody(fu.follow_up.email.body);
        if (fu.follow_up.compliance_flags.length > 0) {
          setComplianceFlags(fu.follow_up.compliance_flags);
        }
      } else {
        setAiError(data.error || "Failed to generate follow-up.");
      }
    } catch {
      setAiError("Network error. You can still write manually.");
    } finally {
      setAiLoading(false);
    }
  }

  function resetForm() {
    setSmsText("");
    setEmailSubject("");
    setEmailBody("");
    setSmsRecipient("");
    setEmailRecipient("");
    setComplianceFlags([]);
    setConfirmSend(false);
    setAiError(null);
    setOpen(false);
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full rounded-md border-2 border-dashed border-gray-300 px-4 py-3 text-sm font-medium text-gray-600 hover:border-blue-400 hover:text-blue-600 transition-colors"
      >
        + Create Follow-Up
      </button>
    );
  }

  const canSend =
    (smsChannel && smsText.trim()) || (emailChannel && emailSubject.trim() && emailBody.trim());

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Create Follow-Up</h3>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-gray-400 hover:text-gray-600 text-sm font-medium"
        >
          Cancel
        </button>
      </div>

      <div className="space-y-4">
        {/* Tone */}
        <div>
          <label htmlFor="fu-tone" className="block text-sm font-medium text-gray-700 mb-1">
            Tone
          </label>
          <select
            id="fu-tone"
            value={tone}
            onChange={(e) => setTone(e.target.value as Tone)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          >
            {TONE_OPTIONS.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>

        {/* Channel toggles */}
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={smsChannel}
              onChange={(e) => setSmsChannel(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            SMS
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={emailChannel}
              onChange={(e) => setEmailChannel(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            Email
          </label>
        </div>

        {/* SMS fields */}
        {smsChannel && (
          <div className="space-y-2">
            <div>
              <label htmlFor="fu-sms-to" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number <span className="text-gray-400 font-normal">(optional — uses default if empty)</span>
              </label>
              <input
                id="fu-sms-to"
                type="tel"
                value={smsRecipient}
                onChange={(e) => setSmsRecipient(e.target.value)}
                placeholder="+1234567890"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="fu-sms" className="block text-sm font-medium text-gray-700 mb-1">
                SMS Message
                <span
                  className={`ml-2 text-xs font-normal ${
                    smsText.length > 160 ? "text-red-600" : "text-gray-400"
                  }`}
                >
                  {smsText.length}/160
                </span>
              </label>
              <textarea
                id="fu-sms"
                value={smsText}
                onChange={(e) => setSmsText(e.target.value)}
                rows={2}
                placeholder="Follow-up SMS message..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
              />
            </div>
          </div>
        )}

        {/* Email fields */}
        {emailChannel && (
          <div className="space-y-2">
            <div>
              <label htmlFor="fu-email-to" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address <span className="text-gray-400 font-normal">(optional — uses default if empty)</span>
              </label>
              <input
                id="fu-email-to"
                type="email"
                value={emailRecipient}
                onChange={(e) => setEmailRecipient(e.target.value)}
                placeholder="recipient@example.com"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="fu-email-subject" className="block text-sm font-medium text-gray-700 mb-1">
                Email Subject
              </label>
              <input
                id="fu-email-subject"
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Follow-up email subject..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label htmlFor="fu-email-body" className="block text-sm font-medium text-gray-700 mb-1">
                Email Body
              </label>
              <textarea
                id="fu-email-body"
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={4}
                placeholder="Follow-up email body..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-vertical"
              />
            </div>
          </div>
        )}

        {/* AI error */}
        {aiError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-700">{aiError}</p>
          </div>
        )}

        {/* Compliance flags */}
        {complianceFlags.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-md p-3">
            <ul className="space-y-1">
              {complianceFlags.map((flag, i) => (
                <li key={i} className="text-sm text-amber-700 flex items-start gap-1.5">
                  <span className="text-amber-500 mt-0.5 shrink-0">!</span>
                  {flag}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            type="button"
            onClick={handleDraftWithAI}
            disabled={aiLoading}
            className="px-4 py-2 rounded-md bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {aiLoading ? "Drafting..." : "Draft with AI"}
          </button>
          <button
            type="button"
            onClick={handleSendNow}
            disabled={!canSend || sending}
            className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {sending ? "Sending..." : confirmSend ? "Send Anyway" : "Send Now"}
          </button>
        </div>
      </div>
    </div>
  );
}
