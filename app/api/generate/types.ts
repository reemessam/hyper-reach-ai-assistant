// ---------------------------------------------------------------------------
// Internal types used exclusively by the API route modules
// ---------------------------------------------------------------------------

/** Raw incoming request body before validation. */
export interface RawRequestBody {
  stage?: "initial" | "follow_up";
  incidentType?: string;
  location?: string;
  severity?: string;
  confirmedFacts?: string;
  requiredAction?: string;
  audience?: string;
  readingLevel?: number;
  tone?: string;
  sender?: string;
  previousSms?: string;
  lastFollowUpSms?: string | null;
}

/** Validated and defaulted incident context passed between modules. */
export interface IncidentContext {
  incidentType: string;
  location: string;
  severity: string;
  confirmedFacts: string;
  requiredAction: string | undefined;
  audience: string;
  readingLevel: number;
  tone: string;
  sender: string;
}

/** Shape of a single content block inside an Anthropic Messages response. */
export interface AnthropicContentBlock {
  type: string;
  text?: string;
}

/** Minimal shape of the Anthropic Messages API response we care about. */
export interface AnthropicResponse {
  content?: AnthropicContentBlock[];
}
