import type { GenerateResponse } from "@/app/types";

// ---------------------------------------------------------------------------
// Anthropic API configuration
// ---------------------------------------------------------------------------

export const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
export const ANTHROPIC_VERSION = "2023-06-01";
export const DEFAULT_MODEL = "claude-sonnet-4-20250514";
export const MAX_TOKENS = 1000;
export const TEMPERATURE = 0.3;

// ---------------------------------------------------------------------------
// Retry configuration
// ---------------------------------------------------------------------------

export const MAX_RETRIES = 3;
export const RETRY_DELAYS_MS = [1000, 2000, 4000] as const;
export const RETRYABLE_STATUS_CODES = new Set([429, 502, 503, 529]);

// ---------------------------------------------------------------------------
// Field defaults
// ---------------------------------------------------------------------------

export const DEFAULT_AUDIENCE = "general public";
export const DEFAULT_READING_LEVEL = 6;
export const DEFAULT_TONE = "Neutral";
export const DEFAULT_SENDER = "Emergency Management Office";
export const DEFAULT_SEVERITY = "Medium";

export const SMS_MAX_LENGTH = 160;
export const MIN_CONFIRMED_FACTS_LENGTH = 15;

// ---------------------------------------------------------------------------
// Type for the metadata block attached to every response
// ---------------------------------------------------------------------------

export type ResponseMetadata = GenerateResponse["metadata"];
