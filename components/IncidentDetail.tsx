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
    (fu: Omit<FollowUp, "id" | "createdAtIso">) => {
      const fuId = onAddFollowUp(incident.id, fu);

      // Simulate delivery: queued -> sent after 2 seconds
      setTimeout(() => {
        onUpdateFollowUp(incident.id, fuId, (existing) => ({
          ...existing,
          delivery: {
            status: "sent" as const,
            channels: { sms: "sent" as const, email: "sent" as const },
            queuedAtIso: existing.delivery?.queuedAtIso ?? null,
            sentAtIso: new Date().toISOString(),
          },
        }));
      }, 2000);
    },
    [incident.id, onAddFollowUp, onUpdateFollowUp]
  );

  const handleSchedule = useCallback(
    (fu: Omit<FollowUp, "id" | "createdAtIso">) => {
      onAddFollowUp(incident.id, fu);
    },
    [incident.id, onAddFollowUp]
  );

  const handleFollowUpSendNow = useCallback(
    (followUpId: string) => {
      onUpdateFollowUp(incident.id, followUpId, (existing) => ({
        ...existing,
        status: "sent" as const,
        sentAtIso: new Date().toISOString(),
        delivery: {
          status: "queued" as const,
          channels: {
            sms: existing.channels.sms ? ("queued" as const) : ("sent" as const),
            email: existing.channels.email ? ("queued" as const) : ("sent" as const),
          },
          queuedAtIso: new Date().toISOString(),
          sentAtIso: null,
        },
      }));

      setTimeout(() => {
        onUpdateFollowUp(incident.id, followUpId, (existing) => ({
          ...existing,
          delivery: {
            status: "sent" as const,
            channels: { sms: "sent" as const, email: "sent" as const },
            queuedAtIso: existing.delivery?.queuedAtIso ?? null,
            sentAtIso: new Date().toISOString(),
          },
        }));
      }, 2000);
    },
    [incident.id, onUpdateFollowUp]
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
            onSchedule={handleSchedule}
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
