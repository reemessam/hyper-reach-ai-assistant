import {
  ANTHROPIC_API_URL,
  ANTHROPIC_VERSION,
  DEFAULT_MODEL,
  MAX_TOKENS,
  TEMPERATURE,
  MAX_RETRIES,
  RETRY_DELAYS_MS,
  RETRYABLE_STATUS_CODES,
} from "./config";
import { SYSTEM_PROMPT } from "./prompts";
import type { AnthropicResponse } from "./types";

// ---------------------------------------------------------------------------
// Result type returned by the client
// ---------------------------------------------------------------------------

export type ClientResult =
  | { ok: true; content: string }
  | { ok: false; error: string; status: number };

// ---------------------------------------------------------------------------
// Build Anthropic request headers
// ---------------------------------------------------------------------------

function buildHeaders(apiKey: string): Record<string, string> {
  return {
    "x-api-key": apiKey,
    "anthropic-version": ANTHROPIC_VERSION,
    "content-type": "application/json",
  };
}

// ---------------------------------------------------------------------------
// Build Anthropic request body
// ---------------------------------------------------------------------------

function buildBody(userPrompt: string): string {
  const model = process.env.ANTHROPIC_MODEL || DEFAULT_MODEL;

  return JSON.stringify({
    model,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: userPrompt }],
  });
}

// ---------------------------------------------------------------------------
// Extract the text content from an Anthropic Messages response
// ---------------------------------------------------------------------------

function extractContent(data: AnthropicResponse): string | null {
  if (!data.content || !Array.isArray(data.content)) return null;

  const textBlock = data.content.find((block) => block.type === "text");
  return textBlock?.text ?? null;
}

// ---------------------------------------------------------------------------
// Call the Anthropic Messages API with exponential-backoff retry
// ---------------------------------------------------------------------------

export async function callAnthropic(
  apiKey: string,
  userPrompt: string
): Promise<ClientResult> {
  const headers = buildHeaders(apiKey);
  const body = buildBody(userPrompt);

  let lastError = "";

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const res = await fetch(ANTHROPIC_API_URL, {
      method: "POST",
      headers,
      body,
    });

    // Retry on transient / rate-limit errors
    if (RETRYABLE_STATUS_CODES.has(res.status) && attempt < MAX_RETRIES) {
      lastError = await res.text();
      await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
      continue;
    }

    if (!res.ok) {
      const errBody = await res.text();
      return {
        ok: false,
        error: `Anthropic API error (${res.status}): ${errBody}`,
        status: 500,
      };
    }

    const data: AnthropicResponse = await res.json();
    const content = extractContent(data);

    if (!content) {
      return { ok: true, content: "" };
    }

    return { ok: true, content };
  }

  return {
    ok: false,
    error: `Anthropic API rate limited after ${MAX_RETRIES} retries: ${lastError}`,
    status: 500,
  };
}
