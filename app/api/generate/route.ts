import { NextResponse } from "next/server";
import type { GenerateResponse } from "@/app/types";

const GEMINI_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error: missing API key" },
      { status: 500 }
    );
  }

  let body: { incidentType?: string; location?: string; severity?: string; confirmedFacts?: string };
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
      { error: "All fields are required: incidentType, location, confirmedFacts" },
      { status: 400 }
    );
  }

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

  try {
    const res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: "You are an emergency communication assistant. Use only confirmed facts. Do not invent details. Write clearly and concisely. Always return valid JSON.",
            },
          ],
        },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.3,
          responseMimeType: "application/json",
        },
      }),
    });

    if (!res.ok) {
      const errBody = await res.text();
      return NextResponse.json(
        { error: `Gemini API error (${res.status}): ${errBody}` },
        { status: 502 }
      );
    }

    const data = await res.json();

    const content: string | undefined =
      data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      return NextResponse.json(
        { error: "No response from AI model" },
        { status: 502 }
      );
    }

    // Extract JSON from the response (handle markdown code blocks)
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    const parsed: GenerateResponse = JSON.parse(jsonMatch[0]);

    // Validate the expected shape
    if (!parsed.sms || !parsed.email?.subject || !parsed.email?.body) {
      return NextResponse.json(
        { error: "AI response missing required fields" },
        { status: 500 }
      );
    }

    return NextResponse.json(parsed);
  } catch (error) {
    if (error instanceof SyntaxError) {
      return NextResponse.json(
        { error: "Failed to parse AI response as JSON" },
        { status: 500 }
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
