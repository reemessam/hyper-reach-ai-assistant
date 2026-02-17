"use client";

import { useState, useCallback } from "react";
import type { Tone, IncidentRecord, FollowUp, FollowUpGenerateResponse } from "@/app/types";
import { TONE_OPTIONS } from "@/app/types";

interface FollowUpEditorProps {
  incident: IncidentRecord;
  onSaveDraft: (fu: Omit<FollowUp, "id" | "createdAtIso">) => void;
  onSendNow: (fu: Omit<FollowUp, "id" | "createdAtIso">) => void;
  onSchedule: (fu: Omit<FollowUp, "id" | "createdAtIso">) => void;
}

export default function FollowUpEditor({
  incident,
  onSaveDraft,
  onSendNow,
  onSchedule,
}: FollowUpEditorProps) {
  const [open, setOpen] = useState(false);
  const [tone, setTone] = useState<Tone>(incident.tone || "Neutral");
  const [smsChannel, setSmsChannel] = useState(true);
  const [emailChannel, setEmailChannel] = useState(true);
  const [smsText, setSmsText] = useState("");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailBody, setEmailBody] = useState("");
  const [scheduleDate, setScheduleDate] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
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

  function buildFollowUpData(
    status: FollowUp["status"],
    scheduledAtIso?: string | null
  ): Omit<FollowUp, "id" | "createdAtIso"> {
    return {
      status,
      scheduledAtIso: scheduledAtIso ?? null,
      sentAtIso: status === "sent" ? new Date().toISOString() : null,
      content: {
        sms: smsText,
        email: { subject: emailSubject, body: emailBody },
      },
      channels: { sms: smsChannel, email: emailChannel },
      tone,
      compliance_flags: complianceFlags,
      delivery:
        status === "sent"
          ? {
              status: "queued",
              channels: {
                sms: smsChannel ? "queued" : "sent",
                email: emailChannel ? "queued" : "sent",
              },
              queuedAtIso: new Date().toISOString(),
              sentAtIso: null,
            }
          : undefined,
    };
  }

  function handleSaveDraft() {
    const flags = validateFollowUp();
    setComplianceFlags(flags);
    onSaveDraft(buildFollowUpData("draft"));
    resetForm();
  }

  function handleSendNow() {
    const flags = validateFollowUp();
    setComplianceFlags(flags);

    if (flags.length > 0 && !confirmSend) {
      setConfirmSend(true);
      return;
    }

    setConfirmSend(false);
    onSendNow(buildFollowUpData("sent"));
    resetForm();
  }

  function handleSchedule() {
    if (!scheduleDate) return;
    const flags = validateFollowUp();
    setComplianceFlags(flags);
    onSchedule(buildFollowUpData("scheduled", new Date(scheduleDate).toISOString()));
    resetForm();
  }

  async function handleDraftWithAI() {
    setAiLoading(true);
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
      }
    } catch {
      // Silently handle — user can still manually draft
    } finally {
      setAiLoading(false);
    }
  }

  function resetForm() {
    setSmsText("");
    setEmailSubject("");
    setEmailBody("");
    setScheduleDate("");
    setComplianceFlags([]);
    setConfirmSend(false);
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
          <label className="block text-sm font-medium text-gray-700 mb-1">Tone</label>
          <select
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

        {/* SMS textarea */}
        {smsChannel && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
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
              value={smsText}
              onChange={(e) => setSmsText(e.target.value)}
              rows={2}
              placeholder="Follow-up SMS message..."
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-none font-mono text-sm"
            />
            {smsText.length > 160 && (
              <p className="text-xs text-red-600 mt-1">SMS exceeds 160 characters</p>
            )}
          </div>
        )}

        {/* Email fields */}
        {emailChannel && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Subject</label>
              <input
                type="text"
                value={emailSubject}
                onChange={(e) => setEmailSubject(e.target.value)}
                placeholder="Follow-up email subject..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email Body</label>
              <textarea
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                rows={4}
                placeholder="Follow-up email body..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-vertical"
              />
            </div>
          </div>
        )}

        {/* Schedule datetime */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Schedule <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <input
            type="datetime-local"
            value={scheduleDate}
            onChange={(e) => setScheduleDate(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

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
            onClick={handleSaveDraft}
            className="px-4 py-2 rounded-md border border-gray-300 text-gray-700 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Save Draft
          </button>
          <button
            type="button"
            onClick={handleSendNow}
            className="px-4 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 transition-colors"
          >
            {confirmSend ? "Send Anyway" : "Send Now"}
          </button>
          {scheduleDate && (
            <button
              type="button"
              onClick={handleSchedule}
              className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Schedule
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
