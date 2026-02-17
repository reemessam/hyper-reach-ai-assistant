"use client";

import type { IncidentRecord, IncidentLifecycleData } from "@/app/types";
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

interface IncidentDetailProps {
  incident: IncidentRecord;
  onUpdateLifecycle: (id: string, patch: Partial<IncidentLifecycleData>) => void;
}

export default function IncidentDetail({
  incident,
  onUpdateLifecycle,
}: IncidentDetailProps) {
  const { copiedField, copyToClipboard } = useClipboard();
  const result = incident.outputs;
  const severity = incident.severity;

  return (
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

      <IncidentLifecycleTimeline
        incident={incident}
        onUpdateLifecycle={onUpdateLifecycle}
      />
    </div>
  );
}
