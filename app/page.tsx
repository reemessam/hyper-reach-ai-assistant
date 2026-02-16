"use client";

import { useState } from "react";
import type { GenerateResponse, IncidentType, SeverityLevel, Tone } from "@/app/types";
import { INCIDENT_TYPES, SEVERITY_LEVELS, TONE_OPTIONS } from "@/app/types";
import VoiceNotePlayer from "@/components/VoiceNotePlayer";

export default function Home() {
  const [incidentType, setIncidentType] = useState<IncidentType>(INCIDENT_TYPES[0]);
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState<SeverityLevel>("Medium");
  const [confirmedFacts, setConfirmedFacts] = useState("");
  const [requiredAction, setRequiredAction] = useState("");
  const [audience, setAudience] = useState("");
  const [readingLevel, setReadingLevel] = useState(6);
  const [tone, setTone] = useState<Tone>("Neutral");
  const [sender, setSender] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!location.trim() || !confirmedFacts.trim()) {
      setError("Please fill in all required fields.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          incidentType,
          location,
          severity,
          confirmedFacts,
          requiredAction: requiredAction.trim() || undefined,
          audience: audience.trim() || undefined,
          readingLevel,
          tone,
          sender: sender.trim() || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.");
        return;
      }

      setResult(data);
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard(text: string, field: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    }
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

        {/* Input Form */}
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
        >
          <div className="space-y-4">
            {/* Incident Type */}
            <div>
              <label htmlFor="incidentType" className="block text-sm font-medium text-gray-700 mb-1">
                Incident Type
              </label>
              <select
                id="incidentType"
                value={incidentType}
                onChange={(e) => setIncidentType(e.target.value as IncidentType)}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              >
                {INCIDENT_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Location */}
            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
                Location
              </label>
              <input
                id="location"
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., 123 Main St, Springfield, IL"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Severity & Tone row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="severity" className="block text-sm font-medium text-gray-700 mb-1">
                  Severity
                </label>
                <select
                  id="severity"
                  value={severity}
                  onChange={(e) => setSeverity(e.target.value as SeverityLevel)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {SEVERITY_LEVELS.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="tone" className="block text-sm font-medium text-gray-700 mb-1">
                  Tone
                </label>
                <select
                  id="tone"
                  value={tone}
                  onChange={(e) => setTone(e.target.value as Tone)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                >
                  {TONE_OPTIONS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Audience & Reading Level row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="audience" className="block text-sm font-medium text-gray-700 mb-1">
                  Audience <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <input
                  id="audience"
                  type="text"
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  placeholder="e.g., residents, employees, students"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="readingLevel" className="block text-sm font-medium text-gray-700 mb-1">
                  Reading Level <span className="text-gray-400 font-normal">(grade {readingLevel})</span>
                </label>
                <input
                  id="readingLevel"
                  type="range"
                  min={1}
                  max={12}
                  value={readingLevel}
                  onChange={(e) => setReadingLevel(Number(e.target.value))}
                  className="w-full mt-2 accent-blue-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-1">
                  <span>1</span>
                  <span>6</span>
                  <span>12</span>
                </div>
              </div>
            </div>

            {/* Sender */}
            <div>
              <label htmlFor="sender" className="block text-sm font-medium text-gray-700 mb-1">
                Sender <span className="text-gray-400 font-normal">(optional, defaults to Emergency Management Office)</span>
              </label>
              <input
                id="sender"
                type="text"
                value={sender}
                onChange={(e) => setSender(e.target.value)}
                placeholder="e.g., Springfield Fire Department"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Required Action */}
            <div>
              <label htmlFor="requiredAction" className="block text-sm font-medium text-gray-700 mb-1">
                Required Action <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <input
                id="requiredAction"
                type="text"
                value={requiredAction}
                onChange={(e) => setRequiredAction(e.target.value)}
                placeholder="e.g., Evacuate immediately via north exits"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
              />
            </div>

            {/* Confirmed Facts */}
            <div>
              <label htmlFor="confirmedFacts" className="block text-sm font-medium text-gray-700 mb-1">
                Confirmed Facts
              </label>
              <textarea
                id="confirmedFacts"
                value={confirmedFacts}
                onChange={(e) => setConfirmedFacts(e.target.value)}
                rows={4}
                placeholder="Enter only verified information about the incident..."
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none resize-vertical"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Generating..." : "Generate Messages"}
          </button>
        </form>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="space-y-4">
            {/* Metadata bar */}
            {result.metadata && (
              <div className="bg-gray-100 rounded-lg px-4 py-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-gray-600">
                <span>
                  <span className="font-medium text-gray-700">Time:</span>{" "}
                  {result.metadata.formatted_time}
                </span>
                <span>
                  <span className="font-medium text-gray-700">Sender:</span>{" "}
                  {result.metadata.sender}
                </span>
                <span>
                  <span className="font-medium text-gray-700">Tone:</span>{" "}
                  {result.metadata.tone}
                </span>
              </div>
            )}

            {/* SMS Result */}
            <ResultCard
              title="SMS Message"
              badge={
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    result.sms.length <= 160
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {result.sms.length}/160 chars
                </span>
              }
              onCopy={() => copyToClipboard(result.sms, "sms")}
              copied={copiedField === "sms"}
              copyLabel="Copy SMS"
            >
              <p className="text-gray-800 bg-gray-50 rounded-md p-3 text-sm font-mono">
                {result.sms}
              </p>
            </ResultCard>

            {/* Voice Script */}
            <ResultCard
              title="Voice Script"
              onCopy={() => copyToClipboard(result.voice_script, "voice")}
              copied={copiedField === "voice"}
              copyLabel="Copy Script"
            >
              <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-800 whitespace-pre-line">
                {result.voice_script}
              </div>
              <VoiceNotePlayer text={result.voice_script} />
            </ResultCard>

            {/* Email Result */}
            <ResultCard
              title="Email"
              onCopy={() =>
                copyToClipboard(
                  `Subject: ${result.email.subject}\n\n${result.email.body}`,
                  "email"
                )
              }
              copied={copiedField === "email"}
              copyLabel="Copy Email"
            >
              <div className="space-y-3">
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Subject
                  </span>
                  <p className="text-gray-800 font-medium mt-1">{result.email.subject}</p>
                </div>
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                    Body
                  </span>
                  <div className="mt-1 bg-gray-50 rounded-md p-3 text-sm text-gray-800 whitespace-pre-line">
                    {result.email.body}
                  </div>
                </div>
              </div>
            </ResultCard>

            {/* Social Post */}
            <ResultCard
              title="Social Media Post"
              onCopy={() => copyToClipboard(result.social_post, "social")}
              copied={copiedField === "social"}
              copyLabel="Copy Post"
            >
              <div className="bg-gray-50 rounded-md p-3 text-sm text-gray-800 whitespace-pre-line">
                {result.social_post}
              </div>
            </ResultCard>

            {/* Spanish SMS Translation */}
            <ResultCard
              title="Spanish SMS Translation"
              badge={
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    result.translations.es_sms.length <= 160
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {result.translations.es_sms.length}/160 chars
                </span>
              }
              onCopy={() => copyToClipboard(result.translations.es_sms, "es_sms")}
              copied={copiedField === "es_sms"}
              copyLabel="Copy Spanish SMS"
            >
              <p className="text-gray-800 bg-gray-50 rounded-md p-3 text-sm font-mono">
                {result.translations.es_sms}
              </p>
            </ResultCard>

            {/* Metadata row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Readability Grade */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Readability</h2>
                <p className="text-3xl font-bold text-blue-600">
                  Grade {result.readability_grade_estimate}
                </p>
              </div>

              {/* Compliance Flags */}
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Compliance Flags</h2>
                {result.compliance_flags.length === 0 ? (
                  <p className="text-sm text-green-600 font-medium">No compliance issues detected</p>
                ) : (
                  <ul className="space-y-1">
                    {result.compliance_flags.map((flag, i) => (
                      <li key={i} className="text-sm text-amber-700 flex items-start gap-1.5">
                        <span className="text-amber-500 mt-0.5 shrink-0">!</span>
                        {flag}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Follow-Up Suggestion */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h2 className="text-lg font-semibold text-blue-900 mb-2">Suggested Follow-Up</h2>
              <p className="text-sm text-blue-800">{result.follow_up_suggestion}</p>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

function ResultCard({
  title,
  badge,
  onCopy,
  copied,
  copyLabel,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  onCopy: () => void;
  copied: boolean;
  copyLabel: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        {badge}
      </div>
      {children}
      <button
        onClick={onCopy}
        className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
      >
        {copied ? "Copied!" : copyLabel}
      </button>
    </div>
  );
}
