"use client";
import { useT, type Lang } from "@/lib/i18n";

export default function LanguageToggle() {
  const { lang, setLang } = useT();
  return (
    <select
      aria-label="Language"
      className="border rounded-md px-2 py-1 text-sm bg-white"
      value={lang}
      onChange={(e) => setLang(e.target.value as Lang)}
    >
      <option value="en">English</option>
      <option value="es">Español</option>
      <option value="ar">العربية</option>
    </select>
  );
}
