"use client";

import { useState } from "react";
import type { GenerateResponse, IncidentType, SeverityLevel } from "@/app/types";
import { INCIDENT_TYPES, SEVERITY_LEVELS } from "@/app/types";

export default function Home() {
  const [incidentType, setIncidentType] = useState<IncidentType>(INCIDENT_TYPES[0]);
  const [location, setLocation] = useState("");
  const [severity, setSeverity] = useState<SeverityLevel>("Medium");
  const [confirmedFacts, setConfirmedFacts] = useState("");

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!location.trim() || !confirmedFacts.trim()) {
      setError("Please fill in all fields.");
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ incidentType, location, severity, confirmedFacts }),
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

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
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

            {/* Severity */}
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
            {/* SMS Result */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">SMS Message</h2>
                <span
                  className={`text-xs font-medium px-2 py-1 rounded-full ${
                    result.sms.length <= 160
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {result.sms.length}/160 chars
                </span>
              </div>
              <p className="text-gray-800 bg-gray-50 rounded-md p-3 text-sm font-mono">
                {result.sms}
              </p>
              <button
                onClick={() => copyToClipboard(result.sms)}
                className="mt-3 text-sm text-blue-600 hover:text-blue-800 font-medium transition-colors"
              >
                {copied ? "Copied!" : "Copy SMS"}
              </button>
            </div>

            {/* Email Result */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Email</h2>
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
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
