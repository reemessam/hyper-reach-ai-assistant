export const INCIDENT_TYPES = [
  "Gas Leak",
  "Fire",
  "Severe Weather",
  "Lockdown",
  "Utility Outage",
] as const;

export type IncidentType = (typeof INCIDENT_TYPES)[number];

export const SEVERITY_LEVELS = ["Low", "Medium", "High"] as const;

export type SeverityLevel = (typeof SEVERITY_LEVELS)[number];

export const TONE_OPTIONS = ["Calm", "Neutral", "Urgent"] as const;

export type Tone = (typeof TONE_OPTIONS)[number];

export interface GenerateRequest {
  incidentType: IncidentType;
  location: string;
  severity: SeverityLevel;
  confirmedFacts: string;
  requiredAction?: string;
  audience?: string;
  readingLevel?: number;
  tone?: Tone;
  sender?: string;
}

export interface GenerateResponse {
  sms: string;
  voice_script: string;
  email: {
    subject: string;
    body: string;
  };
  social_post: string;
  translations: Record<string, string>;
  readability_grade_estimate: number;
  compliance_flags: string[];
  follow_up_suggestion: string;
  metadata: {
    timestamp_iso: string;
    formatted_time: string;
    sender: string;
    tone: string;
  };
}

/* ── Incident Log ── */

export interface IncidentLifecycleData {
  initialSentAt: string;
  followUpDueAt: string;
  followUpSentAt: string | null;
  allClearGeneratedAt: string | null;
  resolvedAt: string | null;
}

export interface IncidentRecord {
  id: string;
  createdAt: string;
  incidentType: IncidentType;
  location: string;
  severity: SeverityLevel;
  tone: Tone;
  sender: string;
  confirmedFacts: string;
  requiredAction: string;
  audience: string;
  readingLevel: number;
  outputs: GenerateResponse;
  lifecycle: IncidentLifecycleData;
}
