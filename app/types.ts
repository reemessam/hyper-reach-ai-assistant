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

/* ── Follow-Up Messages ── */

export interface FollowUpDelivery {
  status: "queued" | "sent" | "failed";
  channels: {
    sms: "queued" | "sent" | "failed";
    email: "queued" | "sent" | "failed";
  };
  queuedAtIso?: string | null;
  sentAtIso?: string | null;
}

export interface FollowUp {
  id: string;
  createdAtIso: string;
  status: "draft" | "scheduled" | "sent" | "failed";
  scheduledAtIso?: string | null;
  sentAtIso?: string | null;
  content: {
    sms: string;
    email: { subject: string; body: string };
  };
  channels: { sms: boolean; email: boolean };
  tone?: Tone;
  compliance_flags: string[];
  delivery?: FollowUpDelivery;
}

export interface FollowUpGenerateResponse {
  follow_up: {
    sms: string;
    email: { subject: string; body: string };
    compliance_flags: string[];
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
  followUps: FollowUp[];
}
