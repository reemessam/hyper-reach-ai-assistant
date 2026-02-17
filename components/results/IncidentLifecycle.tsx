// components/IncidentLifecycle.tsx
"use client";

import { useEffect, useState } from "react";

interface IncidentLifecycleProps {
    sms: string;
    followUpSuggestion: string;
    formattedTime?: string;
    timestampIso?: string;
    severity?: "Low" | "Medium" | "High";
    sender?: string;
    tone?: "Calm" | "Neutral" | "Urgent";
}

const severityCadence: Record<"Low" | "Medium" | "High", number> = {
    High: 15,
    Medium: 30,
    Low: 60,
};

export default function IncidentLifecycle({
                                              sms,
                                              followUpSuggestion,
                                              formattedTime,
                                              timestampIso,
                                              severity = "Medium",
                                              sender = "Emergency Management Office",
                                              tone = "Neutral",
                                          }: IncidentLifecycleProps) {
    const [now, setNow] = useState<Date>(new Date());
    const [nextUpdateStatus, setNextUpdateStatus] = useState<"Due" | "Overdue" | "Sent">("Due");
    const [allClearTemplate, setAllClearTemplate] = useState<string | null>(null);

    const cadenceMinutes = severityCadence[severity];
    const initialTime = formattedTime ? new Date(formattedTime) : now;
    const nextUpdateTime = new Date(initialTime.getTime() + cadenceMinutes * 60000);

    useEffect(() => {
        const interval = setInterval(() => setNow(new Date()), 30000);
        return () => clearInterval(interval);
    }, []);

    const timeDiffMinutes = Math.floor((now.getTime() - nextUpdateTime.getTime()) / 60000);
    const isOverdue = timeDiffMinutes > 0 && nextUpdateStatus === "Due";

    const handleMarkAsSent = () => {
        setNextUpdateStatus("Sent");
    };

    const handleGenerateAllClear = () => {
        const template = `All clear: The situation has been resolved. ${sms.slice(0, 50)}... - ${sender}`;
        setAllClearTemplate(template);
    };

    return (
        <div className="mt-6 p-4 bg-white shadow-md rounded-lg">
            <h3 className="text-lg font-semibold">Incident Communication Lifecycle</h3>
            <p className="text-sm text-gray-600">
                Maintains communication cadence based on severity and tracks message status.
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
                    <div className="absolute -left-3 top-1.5 w-6 h-6 bg-green-500 rounded-full border-2 border-white"></div>
                    <h4 className="text-sm font-medium">Initial Alert</h4>
                    <p className="text-xs text-gray-500">{formattedTime || "Now"}</p>
                    <p className="text-sm text-gray-700 mt-1">
                        {sms.length > 90 ? `${sms.slice(0, 90)}...` : sms}
                    </p>
                </div>

                {/* Next Update */}
                <div className="mb-6 pl-6 relative">
                    <div
                        className={`absolute -left-3 top-1.5 w-6 h-6 ${
                            nextUpdateStatus === "Sent"
                                ? "bg-green-500"
                                : isOverdue
                                    ? "bg-red-500"
                                    : "bg-yellow-500"
                        } rounded-full border-2 border-white`}
                    ></div>
                    <h4 className="text-sm font-medium">
                        Next Update{" "}
                        {nextUpdateStatus === "Due" && (
                            <button
                                onClick={handleMarkAsSent}
                                className="ml-2 text-xs text-blue-600 hover:underline"
                            >
                                Mark as Sent
                            </button>
                        )}
                    </h4>
                    <p className="text-xs text-gray-500">
                        {nextUpdateStatus === "Sent"
                            ? `Sent at ${now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
                            : isOverdue
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
                <div className="pl-6 relative">
                    <div className="absolute -left-3 top-1.5 w-6 h-6 bg-gray-400 rounded-full border-2 border-white"></div>
                    <h4 className="text-sm font-medium">All Clear</h4>
                    <p className="text-xs text-gray-500">When resolved</p>
                    <p className="text-sm text-gray-700 mt-1">
                        Generate an all-clear message once authorities confirm it is safe.
                    </p>
                    <button
                        onClick={handleGenerateAllClear}
                        className="mt-2 text-xs bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-full font-medium transition-colors"
                    >
                        Generate All Clear
                    </button>
                    {allClearTemplate && (
                        <div className="mt-2">
              <textarea
                  readOnly
                  value={allClearTemplate}
                  className="w-full p-2 border border-gray-300 rounded-md text-sm"
              />
                            <button
                                onClick={() => navigator.clipboard.writeText(allClearTemplate)}
                                className="mt-2 text-xs bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded-full font-medium transition-colors"
                            >
                                Copy
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Escalation Indicator */}
            {severity === "High" && isOverdue && nextUpdateStatus === "Due" && (
                <div className="mt-4 p-3 bg-red-100 text-red-700 rounded-md">
                    <strong>Update overdue.</strong> Consider sending an immediate status update.
                </div>
            )}
        </div>
    );
}