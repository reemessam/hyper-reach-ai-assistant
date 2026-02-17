"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  GenerateRequest,
  GenerateResponse,
  IncidentRecord,
  SeverityLevel,
} from "@/app/types";

const STORAGE_KEY = "hyper-reach-incidents";

const FOLLOW_UP_OFFSET: Record<SeverityLevel, number> = {
  High: 15 * 60_000,
  Medium: 30 * 60_000,
  Low: 60 * 60_000,
};

function generateId(): string {
  return (
    Date.now().toString(36) +
    "-" +
    Math.random().toString(36).slice(2, 10)
  );
}

function readStorage(): IncidentRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as IncidentRecord[];
  } catch {
    return [];
  }
}

function writeStorage(incidents: IncidentRecord[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(incidents));
}

export function useIncidentLog() {
  const [incidents, setIncidents] = useState<IncidentRecord[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Hydrate from localStorage on mount
  useEffect(() => {
    const stored = readStorage();
    setIncidents(stored);
    if (stored.length > 0) {
      setSelectedId(stored[0].id);
    }
  }, []);

  const selected = incidents.find((i) => i.id === selectedId) ?? null;

  const addIncident = useCallback(
    (request: GenerateRequest, outputs: GenerateResponse) => {
      const now = new Date().toISOString();
      const record: IncidentRecord = {
        id: generateId(),
        createdAt: now,
        incidentType: request.incidentType,
        location: request.location,
        severity: request.severity,
        tone: request.tone ?? "Neutral",
        sender: request.sender ?? "Emergency Management Office",
        confirmedFacts: request.confirmedFacts,
        requiredAction: request.requiredAction ?? "",
        audience: request.audience ?? "",
        readingLevel: request.readingLevel ?? 6,
        outputs,
        lifecycle: {
          initialSentAt: now,
          followUpDueAt: new Date(
            Date.now() + FOLLOW_UP_OFFSET[request.severity]
          ).toISOString(),
          followUpSentAt: null,
          allClearGeneratedAt: null,
          resolvedAt: null,
        },
      };
      setIncidents((prev) => {
        const next = [record, ...prev];
        writeStorage(next);
        return next;
      });
      setSelectedId(record.id);
    },
    []
  );

  const updateLifecycle = useCallback(
    (
      id: string,
      patch: Partial<IncidentRecord["lifecycle"]>
    ) => {
      setIncidents((prev) => {
        const next = prev.map((inc) =>
          inc.id === id
            ? { ...inc, lifecycle: { ...inc.lifecycle, ...patch } }
            : inc
        );
        writeStorage(next);
        return next;
      });
    },
    []
  );

  return {
    incidents,
    selected,
    selectedId,
    setSelectedId,
    addIncident,
    updateLifecycle,
  } as const;
}
