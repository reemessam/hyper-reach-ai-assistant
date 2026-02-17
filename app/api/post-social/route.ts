import { NextResponse } from "next/server";
import crypto from "crypto";

interface PostSocialBody {
  platform: "twitter" | "facebook";
  message: string;
}

// ---- Twitter OAuth 1.0a signing ----

function percentEncode(str: string): string {
  return encodeURIComponent(str).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function buildOAuthSignature(
  method: string,
  url: string,
  params: Record<string, string>,
  consumerSecret: string,
  tokenSecret: string
): string {
  const sortedKeys = Object.keys(params).sort();
  const paramString = sortedKeys
    .map((k) => `${percentEncode(k)}=${percentEncode(params[k])}`)
    .join("&");
  const baseString = `${method}&${percentEncode(url)}&${percentEncode(paramString)}`;
  const signingKey = `${percentEncode(consumerSecret)}&${percentEncode(tokenSecret)}`;
  return crypto
    .createHmac("sha1", signingKey)
    .update(baseString)
    .digest("base64");
}

async function postToTwitter(message: string): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.TWITTER_API_KEY;
  const apiSecret = process.env.TWITTER_API_SECRET;
  const accessToken = process.env.TWITTER_ACCESS_TOKEN;
  const accessSecret = process.env.TWITTER_ACCESS_SECRET;

  if (!apiKey || !apiSecret || !accessToken || !accessSecret) {
    return { success: false, error: "Twitter API keys not configured." };
  }

  const url = "https://api.twitter.com/2/tweets";
  const nonce = crypto.randomBytes(16).toString("hex");
  const timestamp = Math.floor(Date.now() / 1000).toString();

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: apiKey,
    oauth_nonce: nonce,
    oauth_signature_method: "HMAC-SHA1",
    oauth_timestamp: timestamp,
    oauth_token: accessToken,
    oauth_version: "1.0",
  };

  const signature = buildOAuthSignature(
    "POST",
    url,
    oauthParams,
    apiSecret,
    accessSecret
  );
  oauthParams.oauth_signature = signature;

  const authHeader =
    "OAuth " +
    Object.keys(oauthParams)
      .sort()
      .map((k) => `${percentEncode(k)}="${percentEncode(oauthParams[k])}"`)
      .join(", ");

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: authHeader,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text: message }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    return { success: false, error: `Twitter API ${res.status}: ${errBody}` };
  }

  return { success: true };
}

async function postToFacebook(message: string): Promise<{ success: boolean; error?: string }> {
  const pageToken = process.env.FACEBOOK_PAGE_ACCESS_TOKEN;
  const pageId = process.env.FACEBOOK_PAGE_ID;

  if (!pageToken || !pageId) {
    return { success: false, error: "Facebook Page credentials not configured." };
  }

  const url = `https://graph.facebook.com/v19.0/${pageId}/feed`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, access_token: pageToken }),
  });

  if (!res.ok) {
    const errBody = await res.text();
    return { success: false, error: `Facebook API ${res.status}: ${errBody}` };
  }

  return { success: true };
}

export async function POST(request: Request): Promise<NextResponse> {
  let payload: PostSocialBody;
  try {
    payload = (await request.json()) as PostSocialBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.message?.trim()) {
    return NextResponse.json({ error: "message is required." }, { status: 400 });
  }

  if (payload.platform !== "twitter" && payload.platform !== "facebook") {
    return NextResponse.json(
      { error: "platform must be 'twitter' or 'facebook'." },
      { status: 400 }
    );
  }

  const result =
    payload.platform === "twitter"
      ? await postToTwitter(payload.message)
      : await postToFacebook(payload.message);

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
