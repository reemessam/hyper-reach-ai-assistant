"use client";

import type { GenerateRequest } from "@/app/types";
import { useClipboard } from "@/hooks/useClipboard";
import { useGenerateMessages } from "@/hooks/useGenerateMessages";
import IncidentForm from "@/components/IncidentForm";
import MetadataBar from "@/components/MetadataBar";
import SmsResult from "@/components/results/SmsResult";
import VoiceScriptResult from "@/components/results/VoiceScriptResult";
import EmailResult from "@/components/results/EmailResult";
import SocialPostResult from "@/components/results/SocialPostResult";
import TranslationResult from "@/components/results/TranslationResult";
import MetadataPanel from "@/components/results/MetadataPanel";
import FollowUpPanel from "@/components/results/FollowUpPanel";

export default function Home() {
  const { loading, result, error, generate } = useGenerateMessages();
  const { copiedField, copyToClipboard } = useClipboard();

  function handleSubmit(data: GenerateRequest) {
    if (!data.location.trim() || !data.confirmedFacts.trim()) {
      return;
    }
    generate(data);
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            AI Crisis Message Generator
          </h1>
          <p className="mt-2 text-gray-600">
            Generate structured emergency communications from confirmed incident details.
          </p>
        </div>

        <IncidentForm onSubmit={handleSubmit} loading={loading} />

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-4">
            {result.metadata && <MetadataBar metadata={result.metadata} />}

            <SmsResult
              sms={result.sms}
              onCopy={() => copyToClipboard(result.sms, "sms")}
              copied={copiedField === "sms"}
            />

            <VoiceScriptResult
              voiceScript={result.voice_script}
              onCopy={() => copyToClipboard(result.voice_script, "voice")}
              copied={copiedField === "voice"}
            />

            <EmailResult
              email={result.email}
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
              onCopy={() => copyToClipboard(result.social_post, "social")}
              copied={copiedField === "social"}
            />

            <TranslationResult
              esSms={result.translations.es_sms}
              onCopy={() => copyToClipboard(result.translations.es_sms, "es_sms")}
              copied={copiedField === "es_sms"}
            />

            <MetadataPanel
              readabilityGrade={result.readability_grade_estimate}
              complianceFlags={result.compliance_flags}
            />

            <FollowUpPanel suggestion={result.follow_up_suggestion} />
          </div>
        )}
      </div>
    </main>
  );
}
