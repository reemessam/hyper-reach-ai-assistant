"use client";

import { useEffect, useState } from "react";
import type { IncidentRecord } from "@/app/types";

interface IncidentSidebarProps {
  incidents: IncidentRecord[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

type BadgeStatus = "Active" | "Follow-up Due Soon" | "Overdue" | "Resolved";

function getStatus(incident: IncidentRecord, now: Date): BadgeStatus {
  if (incident.lifecycle.resolvedAt) return "Resolved";
  const dueAt = new Date(incident.lifecycle.followUpDueAt);
  const msUntilDue = dueAt.getTime() - now.getTime();
  if (!incident.lifecycle.followUpSentAt) {
    if (msUntilDue < 0) return "Overdue";
    if (msUntilDue <= 5 * 60_000) return "Follow-up Due Soon";
  }
  return "Active";
}

const badgeStyles: Record<BadgeStatus, string> = {
  Active: "bg-blue-100 text-blue-700",
  "Follow-up Due Soon": "bg-yellow-100 text-yellow-700",
  Overdue: "bg-red-100 text-red-700",
  Resolved: "bg-green-100 text-green-700",
};

export default function IncidentSidebar({
  incidents,
  selectedId,
  onSelect,
}: IncidentSidebarProps) {
  const [now, setNow] = useState<Date>(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(interval);
  }, []);

  if (incidents.length === 0) {
    return (
      <div className="p-4 text-sm text-gray-500">
        No incidents yet. Generate messages to create your first incident.
      </div>
    );
  }

  return (
    <nav aria-label="Incident log" className="flex flex-col gap-1 p-2">
      <h2 className="px-2 py-1.5 text-xs font-semibold uppercase tracking-wider text-gray-500">
        Incident Log
      </h2>
      {incidents.map((incident) => {
        const status = getStatus(incident, now);
        const isActive = incident.id === selectedId;
        const created = new Date(incident.createdAt);
        return (
          <button
            key={incident.id}
            type="button"
            onClick={() => onSelect(incident.id)}
            className={`w-full text-left rounded-lg px-3 py-2.5 transition-colors ${
              isActive
                ? "bg-blue-50 border border-blue-200"
                : "hover:bg-gray-100 border border-transparent"
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm font-medium text-gray-900 truncate">
                {incident.incidentType}
              </span>
              <span
                className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${badgeStyles[status]}`}
              >
                {status}
              </span>
            </div>
            <p className="text-xs text-gray-500 truncate mt-0.5">
              {incident.location}
              {incident.mapUrl && (
                <a
                  href={incident.mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="ml-1 text-blue-500 hover:text-blue-700"
                  title="View on map"
                >
                  <svg className="inline w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                </a>
              )}
            </p>
            <p className="text-[10px] text-gray-400 mt-0.5">
              {created.toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
              })}{" "}
              {created.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </button>
        );
      })}
    </nav>
  );
}
