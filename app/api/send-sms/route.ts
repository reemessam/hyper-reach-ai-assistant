import { NextResponse } from "next/server";
import twilio from "twilio";

interface SendSmsBody {
  message: string;
  to?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  const {
    TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER,
    SMS_TO_NUMBER,
  } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    return NextResponse.json(
      {
        error:
          "Twilio is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER.",
      },
      { status: 500 }
    );
  }

  let payload: SendSmsBody;
  try {
    payload = (await request.json()) as SendSmsBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.message?.trim()) {
    return NextResponse.json(
      { error: "message is required." },
      { status: 400 }
    );
  }

  const recipient = payload.to?.trim() || SMS_TO_NUMBER;
  if (!recipient) {
    return NextResponse.json(
      { error: "No recipient. Provide 'to' in the body or set SMS_TO_NUMBER." },
      { status: 400 }
    );
  }

  const client = twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  try {
    const msg = await client.messages.create({
      body: payload.message,
      from: TWILIO_PHONE_NUMBER,
      to: recipient,
    });
    return NextResponse.json({ success: true, sid: msg.sid });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown Twilio error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
