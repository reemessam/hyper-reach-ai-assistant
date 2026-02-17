/**
 * Copy text to clipboard with fallback for older browsers.
 */
export async function copyText(text: string): Promise<void> {
  try {
    await navigator.clipboard.writeText(text);
  } catch {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
  }
}

/**
 * Send an SMS via the /api/send-sms endpoint.
 */
export async function sendSms(
  message: string,
  to?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/send-sms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, ...(to ? { to } : {}) }),
    });
    if (res.ok) return { ok: true };
    const data = await res.json();
    return { ok: false, error: data.error || "SMS send failed" };
  } catch {
    return { ok: false, error: "Network error sending SMS" };
  }
}

/**
 * Send an email via the /api/send-email endpoint.
 */
export async function sendEmail(
  subject: string,
  body: string,
  to?: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch("/api/send-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subject, body, ...(to ? { to } : {}) }),
    });
    if (res.ok) return { ok: true };
    const data = await res.json();
    return { ok: false, error: data.error || "Email send failed" };
  } catch {
    return { ok: false, error: "Network error sending email" };
  }
}
