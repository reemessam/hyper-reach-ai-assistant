"use client";

import { useState, useCallback } from "react";
import type { IncidentRecord, IncidentLifecycleData, FollowUp } from "@/app/types";
import { sendSms, sendEmail } from "@/lib/actions";
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

type DeliveryChannelStatus = "queued" | "sent" | "failed";

interface IncidentDetailProps {
  incident: IncidentRecord;
  onUpdateLifecycle: (id: string, patch: Partial<IncidentLifecycleData>) => void;
  onAddFollowUp: (incidentId: string, fu: Omit<FollowUp, "id" | "createdAtIso">) => string;
  onUpdateFollowUp: (incidentId: string, fuId: string, updater: (fu: FollowUp) => FollowUp) => void;
}

function resolveDeliveryStatus(
  smsEnabled: boolean,
  emailEnabled: boolean,
  smsResult: { ok: boolean },
  emailResult: { ok: boolean }
): {
  overallStatus: DeliveryChannelStatus;
  smsStatus: DeliveryChannelStatus;
  emailStatus: DeliveryChannelStatus;
  followUpStatus: FollowUp["status"];
} {
  const smsStatus: DeliveryChannelStatus = smsEnabled
    ? smsResult.ok ? "sent" : "failed"
    : "sent";
  const emailStatus: DeliveryChannelStatus = emailEnabled
    ? emailResult.ok ? "sent" : "failed"
    : "sent";
  const allFailed =
    (smsEnabled && !smsResult.ok) &&
    (emailEnabled && !emailResult.ok);

  return {
    overallStatus: allFailed ? "failed" : "sent",
    smsStatus,
    emailStatus,
    followUpStatus: allFailed ? "failed" : "sent",
  };
}

export default function IncidentDetail({
  incident,
  onUpdateLifecycle,
  onAddFollowUp,
  onUpdateFollowUp,
}: IncidentDetailProps) {
  const { copiedField, copyToClipboard } = useClipboard();
  const [activeTab, setActiveTab] = useState<Tab>("results");
  const [followUpSending, setFollowUpSending] = useState(false);
  const result = incident.outputs;
  const severity = incident.severity;

  const markTimelineFollowUpSent = useCallback(() => {
    if (!incident.lifecycle.followUpSentAt) {
      onUpdateLifecycle(incident.id, { followUpSentAt: new Date().toISOString() });
    }
  }, [incident.id, incident.lifecycle.followUpSentAt, onUpdateLifecycle]);

  const handleSendNow = useCallback(
    async (fu: Omit<FollowUp, "id" | "createdAtIso">) => {
      setFollowUpSending(true);

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

      const smsResult = fu.channels.sms
        ? await sendSms(fu.content.sms, fu.recipients?.smsTo)
        : { ok: true };

      const emailResult = fu.channels.email
        ? await sendEmail(fu.content.email.subject, fu.content.email.body, fu.recipients?.emailTo)
        : { ok: true };

      const delivery = resolveDeliveryStatus(
        fu.channels.sms, fu.channels.email, smsResult, emailResult
      );

      onUpdateFollowUp(incident.id, fuId, (existing) => ({
        ...existing,
        status: delivery.followUpStatus,
        delivery: {
          status: delivery.overallStatus,
          channels: { sms: delivery.smsStatus, email: delivery.emailStatus },
          queuedAtIso: existing.delivery?.queuedAtIso ?? null,
          sentAtIso: new Date().toISOString(),
        },
      }));

      if (delivery.followUpStatus === "sent") {
        markTimelineFollowUpSent();
      }

      setFollowUpSending(false);
    },
    [incident.id, onAddFollowUp, onUpdateFollowUp, markTimelineFollowUpSent]
  );

  const handleFollowUpSendNow = useCallback(
    async (followUpId: string) => {
      const fu = incident.followUps.find((f) => f.id === followUpId);
      if (!fu) return;

      onUpdateFollowUp(incident.id, followUpId, (existing) => ({
        ...existing,
        status: "sent",
        sentAtIso: new Date().toISOString(),
        delivery: {
          status: "queued",
          channels: {
            sms: existing.channels.sms ? "queued" : "sent",
            email: existing.channels.email ? "queued" : "sent",
          },
          queuedAtIso: new Date().toISOString(),
          sentAtIso: null,
        },
      }));

      const smsResult = fu.channels.sms
        ? await sendSms(fu.content.sms, fu.recipients?.smsTo)
        : { ok: true };

      const emailResult = fu.channels.email
        ? await sendEmail(fu.content.email.subject, fu.content.email.body, fu.recipients?.emailTo)
        : { ok: true };

      const delivery = resolveDeliveryStatus(
        fu.channels.sms, fu.channels.email, smsResult, emailResult
      );

      onUpdateFollowUp(incident.id, followUpId, (existing) => ({
        ...existing,
        status: delivery.followUpStatus,
        delivery: {
          status: delivery.overallStatus,
          channels: { sms: delivery.smsStatus, email: delivery.emailStatus },
          queuedAtIso: existing.delivery?.queuedAtIso ?? null,
          sentAtIso: new Date().toISOString(),
        },
      }));

      if (delivery.followUpStatus === "sent") {
        markTimelineFollowUpSent();
      }
    },
    [incident.id, incident.followUps, onUpdateFollowUp, markTimelineFollowUpSent]
  );

  const tabs: { key: Tab; label: string; count?: number }[] = [
    { key: "results", label: "Results" },
    { key: "timeline", label: "Timeline" },
    { key: "followups", label: "Follow-Ups", count: incident.followUps.length },
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
            onSendNow={handleSendNow}
            sending={followUpSending}
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
