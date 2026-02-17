"use client";

import {useState} from "react";
import Image from "next/image";
import type {GenerateRequest, SeverityLevel} from "@/app/types";
import {useClipboard} from "@/hooks/useClipboard";
import {useGenerateMessages} from "@/hooks/useGenerateMessages";
import IncidentForm from "@/components/IncidentForm";
import MetadataBar from "@/components/MetadataBar";
import SmsResult from "@/components/results/SmsResult";
import VoiceScriptResult from "@/components/results/VoiceScriptResult";
import EmailResult from "@/components/results/EmailResult";
import SocialPostResult from "@/components/results/SocialPostResult";
import TranslationResult from "@/components/results/TranslationResult";
import MetadataPanel from "@/components/results/MetadataPanel";
import FollowUpPanel from "@/components/results/FollowUpPanel";
import IncidentLifecycle from "@/components/results/IncidentLifecycle";

export default function Home() {
    const {loading, result, error, generate} = useGenerateMessages();
    const {copiedField, copyToClipboard} = useClipboard();
    const [severity, setSeverity] = useState<SeverityLevel>("Medium");

    function handleSubmit(data: GenerateRequest) {
        setSeverity(data.severity);
        generate(data);
    }

    return (
        <main className="min-h-screen bg-gray-50 py-8 px-4">
            <div className="max-w-3xl mx-auto">
                {/* Header with logo */}
                <div className="flex flex-col items-center mb-8">
                    <Image
                        src="/images/hyper-reach-logo.png"
                        alt="Hyper Reach logo"
                        width={200}
                        height={60}
                        className="mb-3"
                        priority
                    />
                    <h1 className="text-3xl font-bold text-gray-900 text-balance text-center">
                        Hyper Reach AI Crisis Message Generator
                    </h1>
                    <p className="mt-2 text-gray-600 text-center text-pretty">
                        Generate structured emergency communications from confirmed incident details.
                    </p>
                </div>

                <IncidentForm onSubmit={handleSubmit} loading={loading}/>

                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                        <p className="text-red-700 text-sm">{error}</p>
                    </div>
                )}

                {result && (
                    <div className="space-y-4">
                        {result.metadata && (
                            <MetadataBar metadata={result.metadata} severity={severity}/>
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

                        <FollowUpPanel suggestion={result.follow_up_suggestion} severity={severity}/>
                        <IncidentLifecycle
                            sms={result.sms}
                            followUpSuggestion={result.follow_up_suggestion}
                            formattedTime={result.metadata?.formatted_time}
                            timestampIso={result.metadata?.timestamp_iso}
                            severity={severity}
                            sender={result.metadata?.sender}
                            tone={result.metadata?.tone}
                        />
                    </div>
                )}
            </div>
        </main>
    );
}
