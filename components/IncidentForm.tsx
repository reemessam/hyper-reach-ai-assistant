"use client";

import { useState } from "react";
import type {
  GenerateRequest,
  IncidentType,
  SeverityLevel,
  Tone,
} from "@/app/types";
import { INCIDENT_TYPES, SEVERITY_LEVELS, TONE_OPTIONS } from "@/app/types";
import LocationPicker from "@/components/LocationPicker";

interface IncidentFormProps {
  onSubmit: (data: GenerateRequest) => void;
  loading: boolean;
}

interface FieldErrors {
  location?: string;
  confirmedFacts?: string;
}

export default function IncidentForm({ onSubmit, loading }: IncidentFormProps) {
  const [incidentType, setIncidentType] = useState<IncidentType>(
    INCIDENT_TYPES[0]
  );
  const [location, setLocation] = useState("");
  const [mapUrl, setMapUrl] = useState("");
  const [severity, setSeverity] = useState<SeverityLevel>("Medium");
  const [confirmedFacts, setConfirmedFacts] = useState("");
  const [requiredAction, setRequiredAction] = useState("");
  const [audience, setAudience] = useState("");
  const [readingLevel, setReadingLevel] = useState(6);
  const [tone, setTone] = useState<Tone>("Neutral");
  const [sender, setSender] = useState("");
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitted, setSubmitted] = useState(false);

  function validate(): FieldErrors {
    const e: FieldErrors = {};
    if (!location.trim()) e.location = "Location is required.";
    if (!confirmedFacts.trim())
      e.confirmedFacts = "Confirmed facts are required.";
    return e;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitted(true);
    const fieldErrors = validate();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) return;

    onSubmit({
      incidentType,
      location,
      mapUrl: mapUrl.trim() || undefined,
      severity,
      confirmedFacts,
      requiredAction: requiredAction.trim() || undefined,
      audience: audience.trim() || undefined,
      readingLevel,
      tone,
      sender: sender.trim() || undefined,
    });
  }

  function fieldBorder(fieldKey: keyof FieldErrors): string {
    if (submitted && errors[fieldKey]) {
      return "border-red-500 focus:border-red-500 focus:ring-red-500";
    }
    return "border-gray-300 focus:border-blue-500 focus:ring-blue-500";
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6"
    >
      <div className="space-y-4">
        {/* Incident Type */}
        <div>
          <label
            htmlFor="incidentType"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Incident Type
            <span className="text-red-500 ml-0.5" aria-hidden="true">
              *
            </span>
          </label>
          <select
            id="incidentType"
            required
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
          <label
            htmlFor="location"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Location
            <span className="text-red-500 ml-0.5" aria-hidden="true">
              *
            </span>
          </label>
          <LocationPicker
            id="location"
            value={location}
            mapUrl={mapUrl}
            onMapUrlChange={setMapUrl}
            onChange={(val) => {
              setLocation(val);
              if (submitted) {
                setErrors((prev) => ({
                  ...prev,
                  location: val.trim()
                    ? undefined
                    : "Location is required.",
                }));
              }
            }}
            placeholder="e.g., 123 Main St, Springfield, IL"
            className={`w-full rounded-md border px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-1 outline-none ${fieldBorder("location")}`}
            aria-invalid={submitted && !!errors.location}
            aria-describedby={
              submitted && errors.location ? "location-error" : undefined
            }
          />
          {submitted && errors.location && (
            <p id="location-error" className="mt-1 text-xs text-red-600">
              {errors.location}
            </p>
          )}
        </div>

        {/* Severity & Tone row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="severity"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Severity
              <span className="text-red-500 ml-0.5" aria-hidden="true">
                *
              </span>
            </label>
            <select
              id="severity"
              required
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
            <label
              htmlFor="tone"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Tone
              <span className="text-red-500 ml-0.5" aria-hidden="true">
                *
              </span>
            </label>
            <select
              id="tone"
              required
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
            <label
              htmlFor="audience"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Audience{" "}
              <span className="text-gray-400 font-normal">(optional)</span>
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
            <label
              htmlFor="readingLevel"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Reading Level{" "}
              <span className="text-gray-400 font-normal">
                (grade {readingLevel})
              </span>
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
          <label
            htmlFor="sender"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Sender{" "}
            <span className="text-gray-400 font-normal">
              (optional, defaults to Emergency Management Office)
            </span>
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
          <label
            htmlFor="requiredAction"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Required Action{" "}
            <span className="text-gray-400 font-normal">(optional)</span>
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
          <label
            htmlFor="confirmedFacts"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Confirmed Facts
            <span className="text-red-500 ml-0.5" aria-hidden="true">
              *
            </span>
          </label>
          <textarea
            id="confirmedFacts"
            required
            value={confirmedFacts}
            onChange={(e) => {
              setConfirmedFacts(e.target.value);
              if (submitted) {
                setErrors((prev) => ({
                  ...prev,
                  confirmedFacts: e.target.value.trim()
                    ? undefined
                    : "Confirmed facts are required.",
                }));
              }
            }}
            rows={4}
            placeholder="Enter only verified information about the incident..."
            className={`w-full rounded-md border px-3 py-2 text-gray-900 placeholder-gray-400 focus:ring-1 outline-none resize-vertical ${fieldBorder("confirmedFacts")}`}
            aria-invalid={submitted && !!errors.confirmedFacts}
            aria-describedby={
              submitted && errors.confirmedFacts
                ? "confirmedFacts-error"
                : undefined
            }
          />
          {submitted && errors.confirmedFacts && (
            <p
              id="confirmedFacts-error"
              className="mt-1 text-xs text-red-600"
            >
              {errors.confirmedFacts}
            </p>
          )}
        </div>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="mt-6 w-full rounded-md bg-blue-600 px-4 py-2.5 text-white font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? "Generating..." : "Generate Messages"}
      </button>
    </form>
  );
}
