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
}

export interface GenerateResponse {
  sms: string;
  email: {
    subject: string;
    body: string;
  };
}
