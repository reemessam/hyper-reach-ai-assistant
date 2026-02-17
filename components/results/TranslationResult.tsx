"use client";

import { useState } from "react";
import type { SeverityLevel } from "@/app/types";
import ResultCard from "@/components/ResultCard";

const LANGUAGE_LABELS: Record<string, string> = {
  es: "Spanish",
  fr: "French",
  ar: "Arabic",
  zh: "Chinese",
  hi: "Hindi",
};

interface TranslationResultProps {
  translations: Record<string, string>;
  severity: SeverityLevel;
  onCopy: (lang: string) => void;
  copiedLang: string | null;
}

export default function TranslationResult({
  translations,
  severity,
  onCopy,
  copiedLang,
}: TranslationResultProps) {
  const langs = Object.keys(translations);
  const [activeLang, setActiveLang] = useState(langs[0] || "es");
  const activeText = translations[activeLang] || "";

  if (langs.length === 0) return null;

  return (
    <ResultCard
      title="SMS Translations"
      icon={
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <line x1="2" y1="12" x2="22" y2="12" />
          <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
        </svg>
      }
      severity={severity}
      badge={
        <span
          className={`text-xs font-medium px-2 py-1 rounded-full ${
            activeText.length <= 160
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {activeText.length}/160 chars
        </span>
      }
      onCopy={() => onCopy(activeLang)}
      copied={copiedLang === activeLang}
      copyLabel={`Copy ${LANGUAGE_LABELS[activeLang] || activeLang} SMS`}
    >
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {langs.map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveLang(lang)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                activeLang === lang
                  ? "bg-blue-600 text-white"
                  : "bg-white/70 text-gray-700 hover:bg-white"
              }`}
            >
              {LANGUAGE_LABELS[lang] || lang.toUpperCase()}
            </button>
          ))}
        </div>
        <p
          className="text-gray-800 bg-white/60 rounded-md p-3 text-sm font-mono"
          dir={activeLang === "ar" ? "rtl" : "ltr"}
        >
          {activeText}
        </p>
      </div>
    </ResultCard>
  );
}
