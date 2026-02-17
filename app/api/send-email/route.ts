import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface SendEmailBody {
  subject: string;
  body: string;
  to?: string;
}

export async function POST(request: Request): Promise<NextResponse> {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, EMAIL_FROM, EMAIL_TO } =
    process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return NextResponse.json(
      { error: "SMTP is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS." },
      { status: 500 }
    );
  }

  let payload: SendEmailBody;
  try {
    payload = (await request.json()) as SendEmailBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload.subject?.trim() || !payload.body?.trim()) {
    return NextResponse.json(
      { error: "subject and body are required." },
      { status: 400 }
    );
  }

  const recipient = payload.to?.trim() || EMAIL_TO;
  if (!recipient) {
    return NextResponse.json(
      { error: "No recipient. Provide 'to' in the body or set EMAIL_TO." },
      { status: 400 }
    );
  }

  const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  try {
    await transporter.sendMail({
      from: EMAIL_FROM || SMTP_USER,
      to: recipient,
      subject: payload.subject,
      text: payload.body,
    });
    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown SMTP error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
