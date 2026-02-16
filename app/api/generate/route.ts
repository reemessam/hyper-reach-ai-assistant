import { NextResponse } from "next/server";
import type { GenerateResponse } from "@/app/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "meta-llama/llama-4-maverick:free";
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // ms

const SYSTEM_PROMPT = `You are an AI Crisis Communication Copilot for emergency mass notification systems.

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

interface RequestBody {
  incidentType?: string;
  location?: string;
  severity?: string;
  confirmedFacts?: string;
  requiredAction?: string;
  audience?: string;
  readingLevel?: number;
  tone?: string;
  sender?: string;
}

function generateTimestamps(): { timestamp_iso: string; formatted_time: string } {
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

function buildComplianceFlags(
  requiredAction: string | undefined,
  confirmedFacts: string
): string[] {
  const flags: string[] = [];
  if (!requiredAction) {
    flags.push("Missing required action step.");
  }
  if (confirmedFacts.length < 15) {
    flags.push("Insufficient confirmed details provided.");
  }
  return flags;
}

function mockResponse(
  incidentType: string,
  location: string,
  confirmedFacts: string,
  requiredAction: string | undefined,
  audience: string,
  readingLevel: number,
  tone: string,
  sender: string
): GenerateResponse {
  const { timestamp_iso, formatted_time } = generateTimestamps();

  const actionPart = requiredAction
    ? ` ${requiredAction}`
    : " Follow official guidance.";

  const tonePrefix =
    tone === "Urgent"
      ? "URGENT: "
      : tone === "Calm"
        ? ""
        : "";

  const sms = `${tonePrefix}ALERT: ${incidentType} at ${location}.${actionPart}`.slice(
    0,
    160
  );

  const voiceToneIntro =
    tone === "Calm"
      ? "Please remain calm. "
      : tone === "Urgent"
        ? "This is an urgent message. "
        : "";

  return {
    sms,
    voice_script: `${voiceToneIntro}Attention ${audience}. This is an emergency alert from ${sender} at ${formatted_time}. A ${incidentType} has been reported at ${location}. ${confirmedFacts}${requiredAction ? ` ${requiredAction}` : ""} Please follow all official instructions and stay tuned for updates.`,
    email: {
      subject: `${tone === "Urgent" ? "URGENT - " : ""}Emergency Alert: ${incidentType} at ${location}`,
      body: `This is an official emergency notification from ${sender}.\nIssued: ${formatted_time}\n\nIncident: ${incidentType}\nLocation: ${location}\n\nConfirmed details:\n${confirmedFacts}${requiredAction ? `\n\nRequired Action:\n${requiredAction}` : ""}\n\nPlease follow all official instructions and monitor local news for updates.`,
    },
    social_post: `${tone === "Urgent" ? "🚨" : "⚠️"} EMERGENCY: ${incidentType} reported at ${location} (${formatted_time}). ${confirmedFacts.slice(0, 80)}${requiredAction ? ` ${requiredAction}` : " Follow official guidance."} — ${sender}`,
    translations: {
      es_sms: `ALERTA: ${incidentType} en ${location}.${requiredAction ? ` ${requiredAction}` : " Siga las instrucciones oficiales."}`.slice(
        0,
        160
      ),
    },
    readability_grade_estimate: readingLevel,
    compliance_flags: buildComplianceFlags(requiredAction, confirmedFacts),
    follow_up_suggestion: `Send a follow-up message in 30 minutes with updated status on the ${incidentType} at ${location}.`,
    metadata: {
      timestamp_iso,
      formatted_time,
      sender,
      tone,
    },
  };
}

function sanitizeResponse(
  raw: Record<string, unknown>,
  metadata: GenerateResponse["metadata"],
  serverComplianceFlags: string[]
): GenerateResponse {
  const sms = typeof raw.sms === "string" ? raw.sms.slice(0, 160) : "";

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
  const translations = {
    es_sms:
      typeof translationsObj?.es_sms === "string"
        ? translationsObj.es_sms.slice(0, 160)
        : "",
  };

  const readability_grade_estimate =
    typeof raw.readability_grade_estimate === "number"
      ? raw.readability_grade_estimate
      : 6;

  const aiFlags = Array.isArray(raw.compliance_flags)
    ? (raw.compliance_flags.filter((f) => typeof f === "string") as string[])
    : [];

  // Merge AI-returned flags with server-side compliance flags (deduplicated)
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

function parseJsonResponse(
  content: string,
  metadata: GenerateResponse["metadata"],
  serverComplianceFlags: string[]
): GenerateResponse | null {
  let raw: Record<string, unknown> | null = null;

  // Step 1: try direct parse
  try {
    raw = JSON.parse(content);
  } catch {
    // Step 2: extract first {...} block
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

  // Must have at least sms and email to be considered valid
  if (!raw.sms || !(raw.email as Record<string, unknown>)?.subject) {
    return null;
  }

  return sanitizeResponse(raw, metadata, serverComplianceFlags);
}

function buildUserPrompt(
  incidentType: string,
  location: string,
  confirmedFacts: string,
  severity: string,
  requiredAction: string | undefined,
  audience: string,
  readingLevel: number,
  tone: string,
  sender: string,
  formattedTime: string
): string {
  const requiredActionLine = requiredAction
    ? `\nRequired Action: ${requiredAction}`
    : "\nRequired Action: (not specified — flag this in compliance_flags)";

  return `Generate emergency messages based on the following incident details:

Incident Type: ${incidentType}
Location: ${location}
Severity: ${severity}
Confirmed Facts: ${confirmedFacts}${requiredActionLine}
Audience: ${audience}
Reading Level: Grade ${readingLevel}
Tone: ${tone}
Sender: ${sender}
Time: ${formattedTime}

Return STRICT JSON with this exact schema:

{
  "sms": "...",
  "voice_script": "...",
  "email": { "subject": "...", "body": "..." },
  "social_post": "...",
  "translations": { "es_sms": "..." },
  "readability_grade_estimate": ${readingLevel},
  "compliance_flags": [],
  "follow_up_suggestion": "..."
}

Do not include explanations. No extra keys. No markdown. No commentary.`;
}

export async function POST(request: Request) {
  let body: RequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const {
    incidentType,
    location,
    severity,
    confirmedFacts,
    requiredAction,
    audience,
    readingLevel,
    tone,
    sender,
  } = body;

  if (!incidentType || !location || !confirmedFacts) {
    return NextResponse.json(
      {
        error:
          "All fields are required: incidentType, location, confirmedFacts",
      },
      { status: 400 }
    );
  }

  const effectiveAudience = audience || "general public";
  const effectiveReadingLevel =
    typeof readingLevel === "number" ? readingLevel : 6;
  const effectiveTone = tone || "Neutral";
  const effectiveSender = sender || "Emergency Management Office";
  const effectiveSeverity = severity || "Medium";

  const { timestamp_iso, formatted_time } = generateTimestamps();

  const metadata: GenerateResponse["metadata"] = {
    timestamp_iso,
    formatted_time,
    sender: effectiveSender,
    tone: effectiveTone,
  };

  const serverComplianceFlags = buildComplianceFlags(
    requiredAction,
    confirmedFacts
  );

  // Mock mode — deterministic response, no API call
  if (process.env.LLM_MOCK === "true") {
    return NextResponse.json(
      mockResponse(
        incidentType,
        location,
        confirmedFacts,
        requiredAction,
        effectiveAudience,
        effectiveReadingLevel,
        effectiveTone,
        effectiveSender
      )
    );
  }

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error: missing API key" },
      { status: 500 }
    );
  }

  const model = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;

  const prompt = buildUserPrompt(
    incidentType,
    location,
    confirmedFacts,
    effectiveSeverity,
    requiredAction,
    effectiveAudience,
    effectiveReadingLevel,
    effectiveTone,
    effectiveSender,
    formatted_time
  );

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json",
  };
  if (process.env.APP_URL) {
    headers["HTTP-Referer"] = process.env.APP_URL;
  }
  if (process.env.APP_NAME) {
    headers["X-Title"] = process.env.APP_NAME;
  }

  const requestBody = JSON.stringify({
    model,
    temperature: 0.3,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
  });

  try {
    let lastError = "";

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      const res = await fetch(OPENROUTER_URL, {
        method: "POST",
        headers,
        body: requestBody,
      });

      // Retry on 429 (rate limit) or 502/503 (upstream transient errors)
      if (
        (res.status === 429 || res.status === 502 || res.status === 503) &&
        attempt < MAX_RETRIES
      ) {
        lastError = await res.text();
        await new Promise((r) => setTimeout(r, RETRY_DELAYS[attempt]));
        continue;
      }

      if (!res.ok) {
        const errBody = await res.text();
        return NextResponse.json(
          { error: `OpenRouter API error (${res.status}): ${errBody}` },
          { status: 500 }
        );
      }

      const data = await res.json();

      const content: string | undefined =
        data?.choices?.[0]?.message?.content;

      if (!content) {
        return NextResponse.json(
          mockResponse(
            incidentType,
            location,
            confirmedFacts,
            requiredAction,
            effectiveAudience,
            effectiveReadingLevel,
            effectiveTone,
            effectiveSender
          )
        );
      }

      const parsed = parseJsonResponse(content, metadata, serverComplianceFlags);

      if (!parsed) {
        return NextResponse.json(
          mockResponse(
            incidentType,
            location,
            confirmedFacts,
            requiredAction,
            effectiveAudience,
            effectiveReadingLevel,
            effectiveTone,
            effectiveSender
          )
        );
      }

      return NextResponse.json(parsed);
    }

    // All retries exhausted
    return NextResponse.json(
      {
        error: `OpenRouter API rate limited after ${MAX_RETRIES} retries: ${lastError}`,
      },
      { status: 500 }
    );
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
