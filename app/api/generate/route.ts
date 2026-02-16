import { NextResponse } from "next/server";
import type { GenerateResponse } from "@/app/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "meta-llama/llama-4-maverick:free";
const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // ms

const SYSTEM_PROMPT = `You are an AI Crisis Communication Copilot for emergency mass notification systems.

Rules:
- Use ONLY confirmed facts.
- Do NOT invent details.
- Avoid speculation or blame.
- Include clear action steps when appropriate.
- Use plain language appropriate to the requested reading level.
- SMS must be <= 160 characters.
- Return ONLY valid JSON matching the schema exactly.`;

interface RequestBody {
  incidentType?: string;
  location?: string;
  severity?: string;
  confirmedFacts?: string;
  audience?: string;
  readingLevel?: number;
}

function mockResponse(
  incidentType: string,
  location: string,
  confirmedFacts: string,
  audience: string,
  readingLevel: number
): GenerateResponse {
  const sms = `ALERT: ${incidentType} at ${location}. ${confirmedFacts.slice(0, 60)}. Follow official guidance.`.slice(
    0,
    160
  );

  return {
    sms,
    voice_script: `Attention ${audience}. This is an emergency alert. A ${incidentType} has been reported at ${location}. ${confirmedFacts} Please follow all official instructions and stay tuned for updates.`,
    email: {
      subject: `Emergency Alert: ${incidentType} at ${location}`,
      body: `This is an official emergency notification.\n\nIncident: ${incidentType}\nLocation: ${location}\n\nConfirmed details:\n${confirmedFacts}\n\nPlease follow all official instructions and monitor local news for updates.`,
    },
    social_post: `⚠️ EMERGENCY: ${incidentType} reported at ${location}. ${confirmedFacts.slice(0, 100)} Follow official guidance. More updates to follow.`,
    translations: {
      es_sms: `ALERTA: ${incidentType} en ${location}. Siga las instrucciones oficiales.`.slice(
        0,
        160
      ),
    },
    readability_grade_estimate: readingLevel,
    compliance_flags: [],
    follow_up_suggestion: `Send a follow-up message in 30 minutes with updated status on the ${incidentType} at ${location}.`,
  };
}

function sanitizeResponse(raw: Record<string, unknown>): GenerateResponse {
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

  const compliance_flags = Array.isArray(raw.compliance_flags)
    ? (raw.compliance_flags.filter((f) => typeof f === "string") as string[])
    : [];

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
    compliance_flags,
    follow_up_suggestion,
  };
}

function parseJsonResponse(content: string): GenerateResponse | null {
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

  return sanitizeResponse(raw);
}

function buildUserPrompt(
  incidentType: string,
  location: string,
  confirmedFacts: string,
  severity: string | undefined,
  audience: string,
  readingLevel: number
): string {
  const severityLine = severity ? `\nSeverity: ${severity}` : "";
  const audienceLine = audience ? `\nAudience: ${audience}` : "";

  return `Generate emergency messages based on the following incident details:

Incident Type: ${incidentType}
Location: ${location}${severityLine}
Confirmed Facts: ${confirmedFacts}${audienceLine}
Reading Level: Grade ${readingLevel}

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

No extra keys. No markdown. No commentary.`;
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
    audience,
    readingLevel,
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

  // Mock mode — deterministic response, no API call
  if (process.env.LLM_MOCK === "true") {
    return NextResponse.json(
      mockResponse(
        incidentType,
        location,
        confirmedFacts,
        effectiveAudience,
        effectiveReadingLevel
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
    severity,
    effectiveAudience,
    effectiveReadingLevel
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
          { status: 502 }
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
            effectiveAudience,
            effectiveReadingLevel
          )
        );
      }

      const parsed = parseJsonResponse(content);

      if (!parsed) {
        return NextResponse.json(
          mockResponse(
            incidentType,
            location,
            confirmedFacts,
            effectiveAudience,
            effectiveReadingLevel
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
      { status: 502 }
    );
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
