import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

interface SendEmailBody {
  to?: string;
  subject: string;
  body: string;
}

export async function POST(request: Request) {
  let payload: SendEmailBody;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const { subject, body, to } = payload;

  if (!subject || !body) {
    return NextResponse.json(
      { error: "Subject and body are required." },
      { status: 400 }
    );
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const defaultTo = process.env.EMAIL_TO;

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    return NextResponse.json(
      { error: "SMTP is not configured. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS environment variables." },
      { status: 500 }
    );
  }

  const recipient = to || defaultTo;
  if (!recipient) {
    return NextResponse.json(
      { error: "No recipient specified. Provide a 'to' field or set the EMAIL_TO environment variable." },
      { status: 400 }
    );
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    });

    await transporter.sendMail({
      from: smtpUser,
      to: recipient,
      subject,
      text: body,
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Failed to send email";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
