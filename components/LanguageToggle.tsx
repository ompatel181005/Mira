"use client";
import { LANGUAGE_OPTIONS, useT, type Lang } from "@/lib/i18n";

export default function LanguageToggle() {
  const { lang, setLang } = useT();
  return (
    <select
      aria-label="Language selector"
      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
    >
      {LANGUAGE_OPTIONS.map((option) => (
        <option key={option.code} value={option.code}>
          {option.nativeLabel}
        </option>
      ))}
    </select>
  );
}
