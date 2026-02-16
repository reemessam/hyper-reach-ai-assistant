import { NextResponse } from "next/server";
import type { GenerateResponse } from "@/app/types";

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "mistralai/mistral-7b-instruct:free";

function mockResponse(
  incidentType: string,
  location: string,
  confirmedFacts: string
): GenerateResponse {
  return {
    sms: `ALERT: ${incidentType} at ${location}. ${confirmedFacts.slice(0, 60)}. Follow official guidance.`.slice(
      0,
      160
    ),
    email: {
      subject: `Emergency Alert: ${incidentType} at ${location}`,
      body: `This is an official emergency notification.\n\nIncident: ${incidentType}\nLocation: ${location}\n\nConfirmed details:\n${confirmedFacts}\n\nPlease follow all official instructions and monitor local news for updates.`,
    },
  };
}

function parseJsonResponse(content: string): GenerateResponse | null {
  // First, try direct parse
  try {
    const direct = JSON.parse(content);
    if (direct.sms && direct.email?.subject && direct.email?.body) {
      return direct as GenerateResponse;
    }
  } catch {
    // fall through to extraction
  }

  // Extract first {...} block (handles markdown code blocks or surrounding text)
  const jsonMatch = content.match(/\{[\s\S]*\}/);
  if (!jsonMatch) return null;

  try {
    const extracted = JSON.parse(jsonMatch[0]);
    if (extracted.sms && extracted.email?.subject && extracted.email?.body) {
      return extracted as GenerateResponse;
    }
  } catch {
    // fall through
  }

  return null;
}

export async function POST(request: Request) {
  let body: {
    incidentType?: string;
    location?: string;
    severity?: string;
    confirmedFacts?: string;
  };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { incidentType, location, severity, confirmedFacts } = body;

  if (!incidentType || !location || !confirmedFacts) {
    return NextResponse.json(
      {
        error:
          "All fields are required: incidentType, location, confirmedFacts",
      },
      { status: 400 }
    );
  }

  // Mock mode — deterministic response, no API call
  if (process.env.LLM_MOCK === "true") {
    return NextResponse.json(
      mockResponse(incidentType, location, confirmedFacts)
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

  const severityLine = severity ? `\nSeverity: ${severity}` : "";

  const prompt = `Generate emergency messages based on the following incident details:

Incident Type: ${incidentType}
Location: ${location}${severityLine}
Confirmed Facts: ${confirmedFacts}

Return a JSON object with this exact structure:
{
  "sms": "<SMS message, max 160 characters>",
  "email": {
    "subject": "<email subject line>",
    "body": "<email body text>"
  }
}

Rules:
- SMS must be 160 characters or fewer
- Use only confirmed facts provided above
- Include clear action steps for recipients
- Do not speculate or add unverified information${severity ? `\n- Adjust urgency of tone to match the severity level (${severity})` : ""}
- Return ONLY the JSON object, no other text`;

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

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers,
      body: JSON.stringify({
        model,
        temperature: 0.3,
        messages: [
          {
            role: "system",
            content:
              "You are an emergency communication assistant. Use only confirmed facts. Do not invent details. Write clearly and concisely. Always return valid JSON.",
          },
          { role: "user", content: prompt },
        ],
      }),
    });

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
        mockResponse(incidentType, location, confirmedFacts)
      );
    }

    const parsed = parseJsonResponse(content);

    if (!parsed) {
      // Fallback to mock when JSON parsing fails entirely
      return NextResponse.json(
        mockResponse(incidentType, location, confirmedFacts)
      );
    }

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
