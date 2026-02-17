import type { GenerateResponse } from "@/app/types";
import type { IncidentContext } from "./types";
import { SMS_MAX_LENGTH } from "./config";
import { buildMetadata, buildComplianceFlags } from "./metadata";

// ---------------------------------------------------------------------------
// Deterministic mock response — used when LLM_MOCK="true"
// ---------------------------------------------------------------------------

export function buildMockResponse(ctx: IncidentContext): GenerateResponse {
  const metadata = buildMetadata(ctx.sender, ctx.tone);

  const actionPart = ctx.requiredAction
    ? ` ${ctx.requiredAction}`
    : " Follow official guidance.";

  const tonePrefix = ctx.tone === "Urgent" ? "URGENT: " : "";

  const sms = `${tonePrefix}ALERT: ${ctx.incidentType} at ${ctx.location}.${actionPart}`.slice(
    0,
    SMS_MAX_LENGTH
  );

  const voiceToneIntro =
    ctx.tone === "Calm"
      ? "Please remain calm. "
      : ctx.tone === "Urgent"
        ? "This is an urgent message. "
        : "";

  const voice_script = `${voiceToneIntro}Attention ${ctx.audience}. This is an emergency alert from ${ctx.sender} at ${metadata.formatted_time}. A ${ctx.incidentType} has been reported at ${ctx.location}. ${ctx.confirmedFacts}${ctx.requiredAction ? ` ${ctx.requiredAction}` : ""} Please follow all official instructions and stay tuned for updates.`;

  const emailSubjectPrefix = ctx.tone === "Urgent" ? "URGENT - " : "";
  const email = {
    subject: `${emailSubjectPrefix}Emergency Alert: ${ctx.incidentType} at ${ctx.location}`,
    body: `This is an official emergency notification from ${ctx.sender}.\nIssued: ${metadata.formatted_time}\n\nIncident: ${ctx.incidentType}\nLocation: ${ctx.location}\n\nConfirmed details:\n${ctx.confirmedFacts}${ctx.requiredAction ? `\n\nRequired Action:\n${ctx.requiredAction}` : ""}\n\nPlease follow all official instructions and monitor local news for updates.`,
  };

  const socialEmoji = ctx.tone === "Urgent" ? "\u{1F6A8}" : "\u26A0\uFE0F";
  const social_post = `${socialEmoji} EMERGENCY: ${ctx.incidentType} reported at ${ctx.location} (${metadata.formatted_time}). ${ctx.confirmedFacts.slice(0, 80)}${ctx.requiredAction ? ` ${ctx.requiredAction}` : " Follow official guidance."} \u2014 ${ctx.sender}`;

  const actionMock = ctx.requiredAction || "Follow official guidance.";
  const translations: Record<string, string> = {
    es: `ALERTA: ${ctx.incidentType} en ${ctx.location}. ${actionMock}`.slice(0, SMS_MAX_LENGTH),
    fr: `ALERTE: ${ctx.incidentType} a ${ctx.location}. ${actionMock}`.slice(0, SMS_MAX_LENGTH),
    ar: `\u062A\u0646\u0628\u064A\u0647: ${ctx.incidentType} \u0641\u064A ${ctx.location}. ${actionMock}`.slice(0, SMS_MAX_LENGTH),
    zh: `\u8B66\u62A5: ${ctx.location} \u53D1\u751F ${ctx.incidentType}\u3002${actionMock}`.slice(0, SMS_MAX_LENGTH),
    hi: `\u0905\u0932\u0930\u094D\u091F: ${ctx.location} \u092A\u0930 ${ctx.incidentType}\u0964 ${actionMock}`.slice(0, SMS_MAX_LENGTH),
  };

  return {
    sms,
    voice_script,
    email,
    social_post,
    translations,
    readability_grade_estimate: ctx.readingLevel,
    compliance_flags: buildComplianceFlags(
      ctx.requiredAction,
      ctx.confirmedFacts
    ),
    follow_up_suggestion: `Send a follow-up message in 30 minutes with updated status on the ${ctx.incidentType} at ${ctx.location}.`,
    metadata,
  };
}
