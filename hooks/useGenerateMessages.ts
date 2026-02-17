"use client";

import { useState, useCallback } from "react";
import type { GenerateRequest, GenerateResponse } from "@/app/types";

interface UseGenerateMessagesReturn {
  loading: boolean;
  error: string | null;
  generate: (data: GenerateRequest) => Promise<GenerateResponse | null>;
}

export function useGenerateMessages(): UseGenerateMessagesReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (data: GenerateRequest): Promise<GenerateResponse | null> => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      const json = await res.json();

      if (!res.ok) {
        setError(json.error || "Something went wrong. Please try again.");
        return null;
      }

      return json as GenerateResponse;
    } catch {
      setError("Network error. Please check your connection and try again.");
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, error, generate };
}
