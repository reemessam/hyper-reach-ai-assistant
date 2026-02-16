import { NextResponse } from "next/server";
import OpenAI from "openai";
import type { GenerateRequest, GenerateResponse } from "@/app/types";

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error: missing API key" },
      { status: 500 }
    );
  }

  let body: GenerateRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { incidentType, location, severity, confirmedFacts } = body;

  if (!incidentType || !location || !severity || !confirmedFacts) {
    return NextResponse.json(
      { error: "All fields are required: incidentType, location, severity, confirmedFacts" },
      { status: 400 }
    );
  }

  const openai = new OpenAI({ apiKey });

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.3,
      messages: [
        {
          role: "system",
          content:
            "You are an emergency communication assistant. Use only confirmed facts. Do not invent details. Write clearly and concisely. Always return valid JSON.",
        },
        {
          role: "user",
          content: `Generate emergency messages based on the following incident details:

Incident Type: ${incidentType}
Location: ${location}
Severity: ${severity}
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
- Do not speculate or add unverified information
- Adjust urgency of tone to match the severity level (${severity})
- Return ONLY the JSON object, no other text`,
        },
      ],
    });

    const content = completion.choices[0]?.message?.content;
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
    if (error instanceof OpenAI.APIError) {
      return NextResponse.json(
        { error: `OpenAI API error: ${error.message}` },
        { status: 502 }
      );
    }
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
