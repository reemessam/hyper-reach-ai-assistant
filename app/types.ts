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

export interface GenerateRequest {
  incidentType: IncidentType;
  location: string;
  severity: SeverityLevel;
  confirmedFacts: string;
  audience?: string;
  readingLevel?: number;
}

export interface GenerateResponse {
  sms: string;
  voice_script: string;
  email: {
    subject: string;
    body: string;
  };
  social_post: string;
  translations: {
    es_sms: string;
  };
  readability_grade_estimate: number;
  compliance_flags: string[];
  follow_up_suggestion: string;
}
