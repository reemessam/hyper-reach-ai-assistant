"use client";

import { useEffect, useState } from "react";
import type { IncidentRecord, IncidentLifecycleData } from "@/app/types";
import { sendSms, sendEmail } from "@/lib/actions";

interface Props {
  incident: IncidentRecord;
  onUpdateLifecycle: (id: string, patch: Partial<IncidentLifecycleData>) => void;
}

const severityCadence: Record<"Low" | "Medium" | "High", number> = {
  High: 15,
  Medium: 30,
  Low: 60,
};

export default function IncidentLifecycleTimeline({
  incident,
  onUpdateLifecycle,
}: Props) {
  const [now, setNow] = useState<Date>(new Date());
  const { lifecycle, outputs, severity, id } = incident;
  const cadenceMinutes = severityCadence[severity];
  const sms = outputs.sms;
  const sender = incident.sender;
  const followUpSuggestion = outputs.follow_up_suggestion;

  // All-clear send state
  const [allClearSending, setAllClearSending] = useState(false);
  const [allClearSendStatus, setAllClearSendStatus] = useState<"idle" | "sent" | "error">("idle");
  const [allClearError, setAllClearError] = useState("");
  const [allClearSmsTo, setAllClearSmsTo] = useState("");
  const [allClearEmailTo, setAllClearEmailTo] = useState("");

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  const followUpDue = new Date(lifecycle.followUpDueAt);
  const timeDiffMs = now.getTime() - followUpDue.getTime();
  const timeDiffMinutes = Math.floor(timeDiffMs / 60_000);
  const isFollowUpOverdue =
    timeDiffMs > 0 && !lifecycle.followUpSentAt;
  const isFollowUpSent = !!lifecycle.followUpSentAt;

  const isAllClearGenerated = !!lifecycle.allClearGeneratedAt;
  const isResolved = !!lifecycle.resolvedAt;

  const allClearMessage = `All clear: The situation has been resolved. ${sms.slice(0, 80)}... - ${sender}`;

  function handleMarkFollowUpSent() {
    onUpdateLifecycle(id, { followUpSentAt: new Date().toISOString() });
  }

  function handleGenerateAllClear() {
    onUpdateLifecycle(id, {
      allClearGeneratedAt: new Date().toISOString(),
    });
  }

  function handleMarkResolved() {
    onUpdateLifecycle(id, { resolvedAt: new Date().toISOString() });
  }

  async function handleSendAllClear() {
    setAllClearSending(true);
    setAllClearSendStatus("idle");
    setAllClearError("");

    const [smsResult, emailResult] = await Promise.all([
      sendSms(allClearMessage, allClearSmsTo.trim() || undefined),
      sendEmail(
        `All Clear: ${incident.incidentType} at ${incident.location}`,
        allClearMessage,
        allClearEmailTo.trim() || undefined
      ),
    ]);

    setAllClearSending(false);

    const errors: string[] = [];
    if (!smsResult.ok) errors.push(`SMS: ${smsResult.error}`);
    if (!emailResult.ok) errors.push(`Email: ${emailResult.error}`);

    if (errors.length === 0) {
      setAllClearSendStatus("sent");
      setTimeout(() => setAllClearSendStatus("idle"), 4000);
    } else if (smsResult.ok || emailResult.ok) {
      setAllClearError(errors.join(" | "));
      setAllClearSendStatus("sent");
      setTimeout(() => { setAllClearSendStatus("idle"); setAllClearError(""); }, 5000);
    } else {
      setAllClearError(errors.join(" | "));
      setAllClearSendStatus("error");
      setTimeout(() => { setAllClearSendStatus("idle"); setAllClearError(""); }, 5000);
    }
  }

  const initialTime = new Date(lifecycle.initialSentAt);

  return (
    <div className="mt-6 p-4 bg-white shadow-md rounded-lg">
      <h3 className="text-lg font-semibold text-gray-900">
        Incident Communication Lifecycle
      </h3>
      <p className="text-sm text-gray-600">
        Maintains communication cadence based on severity and tracks message
        status.
      </p>

      <div className="mt-4">
        <span
          className={`inline-block px-3 py-1 text-xs font-medium rounded-full ${
            severity === "High"
              ? "bg-red-100 text-red-700"
              : severity === "Medium"
                ? "bg-yellow-100 text-yellow-700"
                : "bg-green-100 text-green-700"
          }`}
        >
          Recommended cadence: every {cadenceMinutes} minutes
        </span>
      </div>

      <div className="relative border-l border-gray-300 mt-6">
        {/* Initial Alert */}
        <div className="mb-6 pl-6 relative">
          <div className="absolute -left-3 top-1.5 w-6 h-6 bg-green-500 rounded-full border-2 border-white" />
          <h4 className="text-sm font-medium text-gray-900">Initial Alert</h4>
          <p className="text-xs text-gray-500">
            {initialTime.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p className="text-sm text-gray-700 mt-1">
            {sms.length > 90 ? `${sms.slice(0, 90)}...` : sms}
          </p>
        </div>

        {/* Follow-up */}
        <div className="mb-6 pl-6 relative">
          <div
            className={`absolute -left-3 top-1.5 w-6 h-6 ${
              isFollowUpSent
                ? "bg-green-500"
                : isFollowUpOverdue
                  ? "bg-red-500"
                  : "bg-yellow-500"
            } rounded-full border-2 border-white`}
          />
          <h4 className="text-sm font-medium text-gray-900">
            Follow-up Update
            {!isFollowUpSent && !isResolved && (
              <button
                type="button"
                onClick={handleMarkFollowUpSent}
                className="ml-2 text-xs text-blue-600 hover:underline"
              >
                Mark Follow-up Sent
              </button>
            )}
          </h4>
          <p className="text-xs text-gray-500">
            {isFollowUpSent
              ? `Sent at ${new Date(lifecycle.followUpSentAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
              : isFollowUpOverdue
                ? `Overdue by ${timeDiffMinutes} min`
                : `Due in ${-timeDiffMinutes} min`}
          </p>
          <p className="text-sm text-gray-700 mt-1">
            {followUpSuggestion.length > 140
              ? `${followUpSuggestion.slice(0, 140)}...`
              : followUpSuggestion}
          </p>
        </div>

        {/* All Clear */}
        <div className="mb-6 pl-6 relative">
          <div
            className={`absolute -left-3 top-1.5 w-6 h-6 ${
              isAllClearGenerated ? "bg-green-500" : "bg-gray-400"
            } rounded-full border-2 border-white`}
          />
          <h4 className="text-sm font-medium text-gray-900">All Clear</h4>
          {isAllClearGenerated ? (
            <>
              <p className="text-xs text-gray-500">
                Generated at{" "}
                {new Date(
                  lifecycle.allClearGeneratedAt!
                ).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
              <p className="text-sm text-gray-700 mt-1">{allClearMessage}</p>

              {/* Send All Clear */}
              {!isResolved && (
                <div className="mt-3 space-y-2 bg-gray-50 rounded-md p-3">
                  <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    Send All Clear via SMS & Email
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="tel"
                      value={allClearSmsTo}
                      onChange={(e) => setAllClearSmsTo(e.target.value)}
                      placeholder="Phone (optional)"
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none flex-1"
                    />
                    <input
                      type="email"
                      value={allClearEmailTo}
                      onChange={(e) => setAllClearEmailTo(e.target.value)}
                      placeholder="Email (optional)"
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none flex-1"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleSendAllClear}
                      disabled={allClearSending}
                      className="text-xs bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
                    >
                      {allClearSending ? "Sending..." : "Send All Clear"}
                    </button>
                    {allClearSendStatus === "sent" && !allClearError && (
                      <span className="text-xs text-green-700 font-medium">Sent!</span>
                    )}
                    {allClearSendStatus === "sent" && allClearError && (
                      <span className="text-xs text-amber-700 font-medium">Partially sent: {allClearError}</span>
                    )}
                    {allClearSendStatus === "error" && (
                      <span className="text-xs text-red-700 font-medium">{allClearError}</span>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <p className="text-xs text-gray-500">When resolved</p>
              <p className="text-sm text-gray-700 mt-1">
                Generate an all-clear message once authorities confirm it is
                safe.
              </p>
              {!isResolved && (
                <button
                  type="button"
                  onClick={handleGenerateAllClear}
                  className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full font-medium transition-colors"
                >
                  Generate All Clear
                </button>
              )}
            </>
          )}
        </div>

        {/* Resolved */}
        <div className="pl-6 relative">
          <div
            className={`absolute -left-3 top-1.5 w-6 h-6 ${
              isResolved ? "bg-green-500" : "bg-gray-400"
            } rounded-full border-2 border-white`}
          />
          <h4 className="text-sm font-medium text-gray-900">Resolved</h4>
          {isResolved ? (
            <p className="text-xs text-gray-500">
              Resolved at{" "}
              {new Date(lifecycle.resolvedAt!).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-500">Pending resolution</p>
              <button
                type="button"
                onClick={handleMarkResolved}
                className="mt-2 text-xs bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded-full font-medium transition-colors"
              >
                Mark Resolved
              </button>
            </>
          )}
        </div>
      </div>

      {/* Escalation Indicator */}
      {severity === "High" && isFollowUpOverdue && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
          <strong>Update overdue.</strong> Consider sending an immediate status
          update.
        </div>
      )}
    </div>
  );
}
