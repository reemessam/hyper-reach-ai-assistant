import { MIN_CONFIRMED_FACTS_LENGTH } from "./config";
import type { ResponseMetadata } from "./config";

// ---------------------------------------------------------------------------
// Timestamp generation
// ---------------------------------------------------------------------------

export function generateTimestamps(): {
  timestamp_iso: string;
  formatted_time: string;
} {
  const now = new Date();
  return {
    timestamp_iso: now.toISOString(),
    formatted_time: now.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }),
  };
}

// ---------------------------------------------------------------------------
// Build the metadata block that is attached to every response
// ---------------------------------------------------------------------------

export function buildMetadata(
  sender: string,
  tone: string
): ResponseMetadata {
  const { timestamp_iso, formatted_time } = generateTimestamps();
  return { timestamp_iso, formatted_time, sender, tone };
}

// ---------------------------------------------------------------------------
// Server-side compliance flag checks
// ---------------------------------------------------------------------------

export function buildComplianceFlags(
  requiredAction: string | undefined,
  confirmedFacts: string
): string[] {
  const flags: string[] = [];
  if (!requiredAction) {
    flags.push("Missing required action step.");
  }
  if (confirmedFacts.length < MIN_CONFIRMED_FACTS_LENGTH) {
    flags.push("Insufficient confirmed details provided.");
  }
  return flags;
}
