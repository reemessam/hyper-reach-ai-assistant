import type { IncidentContext } from "./types";

// ---------------------------------------------------------------------------
// System prompt — injected as a top-level `system` param in Anthropic API
// ---------------------------------------------------------------------------

export const SYSTEM_PROMPT = `You are an AI Crisis Communication Copilot for emergency mass notification systems.

Rules:
- Use ONLY confirmed facts.
- Never invent details.
- Avoid speculation or blame.
- Include requiredAction explicitly in every channel if provided.
- If requiredAction is missing, add a compliance flag.
- Adapt tone based on:
    Calm → reassuring, steady
    Neutral → clear and direct
    Urgent → concise and commanding
- Use plain language at the requested reading level.
- SMS must be <= 160 characters.
- Include sender name when appropriate.
- Include timestamp naturally in longer channels (voice/email/social).
- Return ONLY valid JSON matching schema exactly.`;

// ---------------------------------------------------------------------------
// User prompt — built from the validated incident context
// ---------------------------------------------------------------------------

export function buildUserPrompt(
  ctx: IncidentContext,
  formattedTime: string
): string {
  const requiredActionLine = ctx.requiredAction
    ? `\nRequired Action: ${ctx.requiredAction}`
    : "\nRequired Action: (not specified — flag this in compliance_flags)";

  return `Generate emergency messages based on the following incident details:

Incident Type: ${ctx.incidentType}
Location: ${ctx.location}
Severity: ${ctx.severity}
Confirmed Facts: ${ctx.confirmedFacts}${requiredActionLine}
Audience: ${ctx.audience}
Reading Level: Grade ${ctx.readingLevel}
Tone: ${ctx.tone}
Sender: ${ctx.sender}
Time: ${formattedTime}

Return STRICT JSON with this exact schema:

{
  "sms": "...",
  "voice_script": "...",
  "email": { "subject": "...", "body": "..." },
  "social_post": "...",
  "translations": { "es": "...", "fr": "...", "ar": "...", "zh": "...", "hi": "..." },
  "readability_grade_estimate": ${ctx.readingLevel},
  "compliance_flags": [],
  "follow_up_suggestion": "..."
}

Do not include explanations. No extra keys. No markdown. No commentary.`;
}
