"use client";

import { useState } from "react";
import Image from "next/image";
import type { GenerateRequest } from "@/app/types";
import { useGenerateMessages } from "@/hooks/useGenerateMessages";
import { useIncidentLog } from "@/hooks/useIncidentLog";
import IncidentForm from "@/components/IncidentForm";
import IncidentSidebar from "@/components/IncidentSidebar";
import IncidentDetail from "@/components/IncidentDetail";

export default function Home() {
  const { loading, error, generate } = useGenerateMessages();
  const {
    incidents,
    selected,
    selectedId,
    setSelectedId,
    addIncident,
    updateLifecycle,
  } = useIncidentLog();
  const [showForm, setShowForm] = useState(true);

  async function handleSubmit(data: GenerateRequest) {
    const result = await generate(data);
    if (result) {
      addIncident(data, result);
      setShowForm(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <Image
            src="/images/hyper-reach-logo.png"
            alt="Hyper Reach logo"
            width={160}
            height={48}
            priority
          />
          <div>
            <h1 className="text-xl font-bold text-gray-900 text-balance">
              Hyper Reach AI Crisis Message Generator
            </h1>
            <p className="text-sm text-gray-600 text-pretty">
              Generate structured emergency communications from confirmed
              incident details.
            </p>
          </div>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto min-h-[calc(100vh-88px)]">
        {/* Left sidebar — incident log */}
        <aside className="w-72 shrink-0 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-2 border-b border-gray-200">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              + New Incident
            </button>
          </div>
          <IncidentSidebar
            incidents={incidents}
            selectedId={selectedId}
            onSelect={(id) => {
              setSelectedId(id);
              setShowForm(false);
            }}
          />
        </aside>

        {/* Right panel — form or detail view */}
        <div className="flex-1 overflow-y-auto p-6">
          {showForm ? (
            <div className="max-w-3xl mx-auto">
              <IncidentForm onSubmit={handleSubmit} loading={loading} />
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <p className="text-red-700 text-sm">{error}</p>
                </div>
              )}
            </div>
          ) : selected ? (
            <div className="max-w-3xl mx-auto">
              <IncidentDetail
                incident={selected}
                onUpdateLifecycle={updateLifecycle}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400 text-sm">
              Select an incident or create a new one.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
