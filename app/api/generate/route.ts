import { NextResponse } from "next/server";

import {
  DEFAULT_AUDIENCE,
  DEFAULT_READING_LEVEL,
  DEFAULT_TONE,
  DEFAULT_SENDER,
  DEFAULT_SEVERITY,
} from "./config";
import type { RawRequestBody, IncidentContext } from "./types";
import { buildUserPrompt, buildFollowUpPrompt } from "./prompts";
import { buildMetadata, buildComplianceFlags } from "./metadata";
import { buildMockResponse, buildMockFollowUpResponse } from "./mock";
import { parseJsonResponse, parseFollowUpJsonResponse } from "./parse";
import { callAnthropic } from "./client";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

function validateBody(
  body: RawRequestBody
): { valid: true; ctx: IncidentContext } | { valid: false; error: string } {
  const { incidentType, location, confirmedFacts } = body;

  if (!incidentType || !location || !confirmedFacts) {
    return {
      valid: false,
      error: "All fields are required: incidentType, location, confirmedFacts",
    };
  }

  return {
    valid: true,
    ctx: {
      incidentType,
      location,
      severity: body.severity || DEFAULT_SEVERITY,
      confirmedFacts,
      requiredAction: body.requiredAction || undefined,
      audience: body.audience || DEFAULT_AUDIENCE,
      readingLevel:
        typeof body.readingLevel === "number"
          ? body.readingLevel
          : DEFAULT_READING_LEVEL,
      tone: body.tone || DEFAULT_TONE,
      sender: body.sender || DEFAULT_SENDER,
    },
  };
}

// ---------------------------------------------------------------------------
// POST handler
// ---------------------------------------------------------------------------

export async function POST(request: Request) {
  // 1. Parse incoming JSON
  let body: RawRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const stage = body.stage || "initial";

  // 2. Validate & build context
  const validation = validateBody(body);
  if (!validation.valid) {
    return NextResponse.json({ error: validation.error }, { status: 400 });
  }
  const ctx = validation.ctx;

  // 3. Build metadata + compliance flags (server-side)
  const metadata = buildMetadata(ctx.sender, ctx.tone);
  const serverFlags = buildComplianceFlags(
    ctx.requiredAction,
    ctx.confirmedFacts
  );

  // 4. Mock mode — deterministic response, no API call
  if (process.env.LLM_MOCK === "true") {
    if (stage === "follow_up") {
      return NextResponse.json(buildMockFollowUpResponse(ctx));
    }
    return NextResponse.json(buildMockResponse(ctx));
  }

  // 5. Ensure API key is configured
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server configuration error: missing API key" },
      { status: 500 }
    );
  }

  // 6. Build prompt based on stage
  const userPrompt =
    stage === "follow_up"
      ? buildFollowUpPrompt(
          ctx,
          metadata.formatted_time,
          body.previousSms,
          body.lastFollowUpSms
        )
      : buildUserPrompt(ctx, metadata.formatted_time);

  try {
    const result = await callAnthropic(apiKey, userPrompt);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error },
        { status: result.status }
      );
    }

    // Empty content — fall back to mock
    if (!result.content) {
      if (stage === "follow_up") {
        return NextResponse.json(buildMockFollowUpResponse(ctx));
      }
      return NextResponse.json(buildMockResponse(ctx));
    }

    // 7. Parse AI response JSON based on stage
    if (stage === "follow_up") {
      const parsed = parseFollowUpJsonResponse(result.content, serverFlags);
      if (!parsed) {
        return NextResponse.json(buildMockFollowUpResponse(ctx));
      }
      return NextResponse.json(parsed);
    }

    const parsed = parseJsonResponse(result.content, metadata, serverFlags);
    if (!parsed) {
      return NextResponse.json(buildMockResponse(ctx));
    }

    return NextResponse.json(parsed);
  } catch {
    return NextResponse.json(
      { error: "An unexpected error occurred" },
      { status: 500 }
    );
  }
}
