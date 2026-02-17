"use client";

import { useState, useCallback } from "react";
import type { IncidentRecord, IncidentLifecycleData, FollowUp } from "@/app/types";
import { useClipboard } from "@/hooks/useClipboard";
import MetadataBar from "@/components/MetadataBar";
import SmsResult from "@/components/results/SmsResult";
import VoiceScriptResult from "@/components/results/VoiceScriptResult";
import EmailResult from "@/components/results/EmailResult";
import SocialPostResult from "@/components/results/SocialPostResult";
import TranslationResult from "@/components/results/TranslationResult";
import MetadataPanel from "@/components/results/MetadataPanel";
import FollowUpPanel from "@/components/results/FollowUpPanel";
import IncidentLifecycleTimeline from "@/components/results/IncidentLifecycleTimeline";
import FollowUpEditor from "@/components/FollowUpEditor";
import FollowUpList from "@/components/FollowUpList";

type Tab = "results" | "timeline" | "followups";

interface IncidentDetailProps {
  incident: IncidentRecord;
  onUpdateLifecycle: (id: string, patch: Partial<IncidentLifecycleData>) => void;
  onAddFollowUp: (incidentId: string, fu: Omit<FollowUp, "id" | "createdAtIso">) => string;
  onUpdateFollowUp: (incidentId: string, fuId: string, updater: (fu: FollowUp) => FollowUp) => void;
}

async function sendSms(message: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    if (res.ok) return { ok: true };
    const data = await res.json();
    return { ok: false, error: data.error || "SMS send failed" };
  } catch {
    return { ok: false, error: "Network error sending SMS" };
  }
}

async function sendEmail(subject: string, body: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body }),
    });
    if (res.ok) return { ok: true };
    const data = await res.json();
    return { ok: false, error: data.error || "Email send failed" };
  } catch {
    return { ok: false, error: "Network error sending email" };
  }
}

export default function IncidentDetail({
  incident,
  onUpdateLifecycle,
  onAddFollowUp,
  onUpdateFollowUp,
}: IncidentDetailProps) {
  const { copiedField, copyToClipboard } = useClipboard();
  const [activeTab, setActiveTab] = useState<Tab>("results");
  const result = incident.outputs;
  const severity = incident.severity;

  const handleSaveDraft = useCallback(
    (fu: Omit<FollowUp, "id" | "createdAtIso">) => {
      onAddFollowUp(incident.id, fu);
    },
    [incident.id, onAddFollowUp]
  );

  const handleSendNow = useCallback(
    async (fu: Omit<FollowUp, "id" | "createdAtIso">) => {
      // Add the follow-up in "sent" status with delivery queued
      const fuId = onAddFollowUp(incident.id, {
        ...fu,
        delivery: {
          status: "queued",
          channels: {
            sms: fu.channels.sms ? "queued" : "sent",
            email: fu.channels.email ? "queued" : "sent",
          },
          queuedAtIso: new Date().toISOString(),
          sentAtIso: null,
        },
      });

      // Actually send via the APIs
      const smsResult = fu.channels.sms
        ? await sendSms(fu.content.sms)
        : { ok: true };

      const emailResult = fu.channels.email
        ? await sendEmail(fu.content.email.subject, fu.content.email.body)
        : { ok: true };

      const smsFinal = fu.channels.sms
        ? (smsResult.ok ? "sent" as const : "failed" as const)
        : "sent" as const;

      const emailFinal = fu.channels.email
        ? (emailResult.ok ? "sent" as const : "failed" as const)
        : "sent" as const;

      const overallOk = smsFinal !== "failed" && emailFinal !== "failed";
      const anyOk = smsFinal === "sent" || emailFinal === "sent";

      onUpdateFollowUp(incident.id, fuId, (existing) => ({
        ...existing,
        status: overallOk ? "sent" : anyOk ? "sent" : "failed",
        delivery: {
          status: overallOk ? "sent" as const : anyOk ? "sent" as const : "failed" as const,
          channels: { sms: smsFinal, email: emailFinal },
          queuedAtIso: existing.delivery?.queuedAtIso ?? null,
          sentAtIso: new Date().toISOString(),
        },
      }));
    },
    [incident.id, onAddFollowUp, onUpdateFollowUp]
  );

  const handleFollowUpSendNow = useCallback(
    async (followUpId: string) => {
      const fu = incident.followUps.find((f) => f.id === followUpId);
      if (!fu) return;

      // Mark as queued first
      onUpdateFollowUp(incident.id, followUpId, (existing) => ({
        ...existing,
        status: "sent" as const,
        sentAtIso: new Date().toISOString(),
        delivery: {
          status: "queued" as const,
          channels: {
            sms: existing.channels.sms ? "queued" as const : "sent" as const,
            email: existing.channels.email ? "queued" as const : "sent" as const,
          },
          queuedAtIso: new Date().toISOString(),
          sentAtIso: null,
        },
      }));

      // Actually send via APIs
      const smsResult = fu.channels.sms
        ? await sendSms(fu.content.sms)
        : { ok: true };

      const emailResult = fu.channels.email
        ? await sendEmail(fu.content.email.subject, fu.content.email.body)
        : { ok: true };

      const smsFinal = fu.channels.sms
        ? (smsResult.ok ? "sent" as const : "failed" as const)
        : "sent" as const;

      const emailFinal = fu.channels.email
        ? (emailResult.ok ? "sent" as const : "failed" as const)
        : "sent" as const;

      const overallOk = smsFinal !== "failed" && emailFinal !== "failed";
      const anyOk = smsFinal === "sent" || emailFinal === "sent";

      onUpdateFollowUp(incident.id, followUpId, (existing) => ({
        ...existing,
        status: overallOk ? "sent" : anyOk ? "sent" : "failed",
        delivery: {
          status: overallOk ? "sent" as const : anyOk ? "sent" as const : "failed" as const,
          channels: { sms: smsFinal, email: emailFinal },
          queuedAtIso: existing.delivery?.queuedAtIso ?? null,
          sentAtIso: new Date().toISOString(),
        },
      }));
    },
    [incident.id, incident.followUps, onUpdateFollowUp]
  );

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "results", label: "Results" },
    { key: "timeline", label: "Timeline" },
    {
      key: "followups",
      label: "Follow-Ups",
      count: incident.followUps.length,
    },
  ];

  return (
    <div>
      {/* Tab bar */}
      <div className="flex border-b border-gray-200 mb-4">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.key
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="ml-1.5 bg-gray-100 text-gray-600 text-xs font-medium px-1.5 py-0.5 rounded-full">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Results tab */}
      {activeTab === "results" && (
        <div className="space-y-4">
          {result.metadata && (
            <MetadataBar metadata={result.metadata} severity={severity} />
          )}

          <SmsResult
            sms={result.sms}
            severity={severity}
            onCopy={() => copyToClipboard(result.sms, "sms")}
            copied={copiedField === "sms"}
          />

          <VoiceScriptResult
            voiceScript={result.voice_script}
            severity={severity}
            onCopy={() => copyToClipboard(result.voice_script, "voice")}
            copied={copiedField === "voice"}
          />

          <EmailResult
            email={result.email}
            severity={severity}
            onCopy={() =>
              copyToClipboard(
                `Subject: ${result.email.subject}\n\n${result.email.body}`,
                "email"
              )
            }
            copied={copiedField === "email"}
          />

          <SocialPostResult
            socialPost={result.social_post}
            severity={severity}
            onCopy={() => copyToClipboard(result.social_post, "social")}
            copied={copiedField === "social"}
          />

          <TranslationResult
            translations={result.translations}
            severity={severity}
            onCopy={(lang: string) =>
              copyToClipboard(result.translations[lang] || "", `trans_${lang}`)
            }
            copiedLang={
              copiedField?.startsWith("trans_")
                ? copiedField.replace("trans_", "")
                : null
            }
          />

          <MetadataPanel
            readabilityGrade={result.readability_grade_estimate}
            complianceFlags={result.compliance_flags}
            severity={severity}
          />

          <FollowUpPanel
            suggestion={result.follow_up_suggestion}
            severity={severity}
          />
        </div>
      )}

      {/* Timeline tab */}
      {activeTab === "timeline" && (
        <IncidentLifecycleTimeline
          incident={incident}
          onUpdateLifecycle={onUpdateLifecycle}
        />
      )}

      {/* Follow-Ups tab */}
      {activeTab === "followups" && (
        <div className="space-y-4">
          <FollowUpEditor
            incident={incident}
            onSaveDraft={handleSaveDraft}
            onSendNow={handleSendNow}
          />

          <FollowUpList
            followUps={incident.followUps}
            onSendNow={handleFollowUpSendNow}
          />
        </div>
      )}
    </div>
  );
}
