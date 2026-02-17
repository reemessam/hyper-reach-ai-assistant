import type { GenerateResponse, FollowUpGenerateResponse } from "@/app/types";
import type { ResponseMetadata } from "./config";
import { SMS_MAX_LENGTH } from "./config";

// ---------------------------------------------------------------------------
// Sanitize an untyped JSON object into a strict GenerateResponse
// ---------------------------------------------------------------------------

export function sanitizeResponse(
  raw: Record<string, unknown>,
  metadata: ResponseMetadata,
  serverComplianceFlags: string[]
): GenerateResponse {
  const sms =
    typeof raw.sms === "string" ? raw.sms.slice(0, SMS_MAX_LENGTH) : "";

  const voice_script =
    typeof raw.voice_script === "string" ? raw.voice_script : "";

  const emailObj = raw.email as Record<string, unknown> | undefined;
  const email = {
    subject:
      typeof emailObj?.subject === "string" ? emailObj.subject : "",
    body: typeof emailObj?.body === "string" ? emailObj.body : "",
  };

  const social_post =
    typeof raw.social_post === "string" ? raw.social_post : "";

  const translationsObj = raw.translations as
    | Record<string, unknown>
    | undefined;
  const translations: Record<string, string> = {};
  if (translationsObj && typeof translationsObj === "object") {
    for (const [lang, val] of Object.entries(translationsObj)) {
      if (typeof val === "string") {
        translations[lang] = val.slice(0, SMS_MAX_LENGTH);
      }
    }
  }

  const readability_grade_estimate =
    typeof raw.readability_grade_estimate === "number"
      ? raw.readability_grade_estimate
      : 6;

  // Merge AI-returned flags with server-side compliance flags (deduplicated)
  const aiFlags = Array.isArray(raw.compliance_flags)
    ? (raw.compliance_flags.filter(
        (f) => typeof f === "string"
      ) as string[])
    : [];

  const allFlags = [...aiFlags];
  for (const flag of serverComplianceFlags) {
    if (!allFlags.includes(flag)) {
      allFlags.push(flag);
    }
  }

  const follow_up_suggestion =
    typeof raw.follow_up_suggestion === "string"
      ? raw.follow_up_suggestion
      : "";

  return {
    sms,
    voice_script,
    email,
    social_post,
    translations,
    readability_grade_estimate,
    compliance_flags: allFlags,
    follow_up_suggestion,
    metadata,
  };
}

// ---------------------------------------------------------------------------
// Parse raw LLM text into a GenerateResponse (or null on failure)
// ---------------------------------------------------------------------------

export function parseJsonResponse(
  content: string,
  metadata: ResponseMetadata,
  serverComplianceFlags: string[]
): GenerateResponse | null {
  let raw: Record<string, unknown> | null = null;

  // Step 1: direct parse
  try {
    raw = JSON.parse(content);
  } catch {
    // Step 2: extract first {...} block from surrounding text
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        raw = JSON.parse(jsonMatch[0]);
      } catch {
        // fall through
      }
    }
  }

  if (!raw || typeof raw !== "object") return null;

  // Must have at least sms and email subject to be considered valid
  if (!raw.sms || !(raw.email as Record<string, unknown>)?.subject) {
    return null;
  }

  return sanitizeResponse(raw, metadata, serverComplianceFlags);
}

// ---------------------------------------------------------------------------
// Parse raw LLM text into a FollowUpGenerateResponse (or null on failure)
// ---------------------------------------------------------------------------

export function parseFollowUpJsonResponse(
  content: string,
  serverComplianceFlags: string[]
): FollowUpGenerateResponse | null {
  let raw: Record<string, unknown> | null = null;

  try {
    raw = JSON.parse(content);
  } catch {
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        raw = JSON.parse(jsonMatch[0]);
      } catch {
        // fall through
      }
    }
  }

  if (!raw || typeof raw !== "object") return null;

  const followUpObj = raw.follow_up as Record<string, unknown> | undefined;
  if (!followUpObj) return null;

  const sms =
    typeof followUpObj.sms === "string"
      ? followUpObj.sms.slice(0, SMS_MAX_LENGTH)
      : "";

  const emailObj = followUpObj.email as Record<string, unknown> | undefined;
  const email = {
    subject: typeof emailObj?.subject === "string" ? emailObj.subject : "",
    body: typeof emailObj?.body === "string" ? emailObj.body : "",
  };

  const aiFlags = Array.isArray(followUpObj.compliance_flags)
    ? (followUpObj.compliance_flags.filter(
        (f) => typeof f === "string"
      ) as string[])
    : [];

  const allFlags = [...aiFlags];
  for (const flag of serverComplianceFlags) {
    if (!allFlags.includes(flag)) {
      allFlags.push(flag);
    }
  }

  return {
    follow_up: {
      sms,
      email,
      compliance_flags: allFlags,
    },
  };
}
