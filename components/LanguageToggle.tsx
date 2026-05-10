"use client";
import { useT, type Lang } from "@/lib/i18n";

export default function LanguageToggle() {
  const { lang, setLang } = useT();
  return (
    <select
      aria-label="Language"
      className="rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-sm shadow-sm outline-none transition focus:border-teal-500 focus:ring-4 focus:ring-teal-100"
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
    >
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="ar">العربية</option>
    </select>
  );
}
