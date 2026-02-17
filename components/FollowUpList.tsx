"use client";

import { useState, useCallback } from "react";
import type { FollowUp } from "@/app/types";

interface FollowUpListProps {
  followUps: FollowUp[];
  onSendNow: (followUpId: string) => void;
}

function StatusBadge({ status }: { status: FollowUp["status"] }) {
  const styles: Record<FollowUp["status"], string> = {
    draft: "bg-gray-100 text-gray-700",
    scheduled: "bg-blue-100 text-blue-700",
    sent: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function DeliveryLine({ delivery }: { delivery: FollowUp["delivery"] }) {
  if (!delivery) return null;

  const smsLabel =
    delivery.channels.sms === "sent"
      ? "SMS sent"
      : delivery.channels.sms === "queued"
        ? "SMS queued"
        : "SMS failed";
  const emailLabel =
    delivery.channels.email === "sent"
      ? "Email sent"
      : delivery.channels.email === "queued"
        ? "Email queued"
        : "Email failed";

  return (
    <p className="text-xs text-gray-500 mt-1">
      Delivery: {smsLabel} &bull; {emailLabel}
    </p>
  );
}

export default function FollowUpList({ followUps, onSendNow }: FollowUpListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const copyContent = useCallback(async (fu: FollowUp) => {
    const text = `SMS: ${fu.content.sms}\n\nEmail Subject: ${fu.content.email.subject}\n\nEmail Body: ${fu.content.email.body}`;
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
    }
  }, []);

  if (followUps.length === 0) {
    return (
      <div className="text-center py-8 text-sm text-gray-400">
        No follow-up messages yet. Create one above.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {followUps.map((fu) => (
        <div
          key={fu.id}
          className="bg-white rounded-lg shadow-sm border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <StatusBadge status={fu.status} />
              <span className="text-xs text-gray-500">
                {new Date(fu.createdAtIso).toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setExpandedId(expandedId === fu.id ? null : fu.id)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                {expandedId === fu.id ? "Hide" : "View"}
              </button>
              <button
                type="button"
                onClick={() => copyContent(fu)}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Copy
              </button>
              {(fu.status === "draft" || fu.status === "scheduled") && (
                <button
                  type="button"
                  onClick={() => onSendNow(fu.id)}
                  className="text-xs font-medium px-2 py-1 rounded bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  Send Now
                </button>
              )}
            </div>
          </div>

          {/* SMS preview */}
          <p className="text-sm text-gray-600 mt-2 truncate">
            {fu.content.sms || "(no SMS)"}
          </p>

          {/* Delivery line for sent messages */}
          {fu.status === "sent" && <DeliveryLine delivery={fu.delivery} />}

          {/* Scheduled time */}
          {fu.status === "scheduled" && fu.scheduledAtIso && (
            <p className="text-xs text-blue-600 mt-1">
              Scheduled: {new Date(fu.scheduledAtIso).toLocaleString()}
            </p>
          )}

          {/* Expanded view */}
          {expandedId === fu.id && (
            <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">SMS</span>
                <p className="text-sm text-gray-800 bg-gray-50 rounded-md p-2 mt-1 font-mono">
                  {fu.content.sms || "-"}
                </p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Email Subject</span>
                <p className="text-sm text-gray-800 mt-1 font-medium">{fu.content.email.subject || "-"}</p>
              </div>
              <div>
                <span className="text-xs font-medium text-gray-500 uppercase">Email Body</span>
                <div className="text-sm text-gray-800 bg-gray-50 rounded-md p-2 mt-1 whitespace-pre-line">
                  {fu.content.email.body || "-"}
                </div>
              </div>
              {fu.compliance_flags.length > 0 && (
                <div>
                  <span className="text-xs font-medium text-gray-500 uppercase">Compliance</span>
                  <ul className="mt-1 space-y-1">
                    {fu.compliance_flags.map((flag, i) => (
                      <li key={i} className="text-xs text-amber-700">! {flag}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
