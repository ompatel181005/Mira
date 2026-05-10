"use client";
import en from "@/locales/en.json";
import es from "@/locales/es.json";
import ar from "@/locales/ar.json";
import { useEffect, useState } from "react";

const dicts: Record<string, Record<string, string>> = { en, es, ar };

export type Lang = "en" | "es" | "ar";

export function detectLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.sessionStorage.getItem("mira:lang");
  if (stored === "en" || stored === "es" || stored === "ar") return stored;
  const nav = (navigator.language || "en").slice(0, 2);
  if (nav === "es" || nav === "ar") return nav as Lang;
  return "en";
}

export function setLang(lang: Lang) {
  window.sessionStorage.setItem("mira:lang", lang);
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  window.dispatchEvent(new Event("mira:lang-change"));
}

export function tFor(lang: Lang, key: string): string {
  return dicts[lang]?.[key] ?? dicts.en[key] ?? key;
}

export function useT(): { t: (k: string) => string; lang: Lang; setLang: (l: Lang) => void } {
  const [lang, setLangState] = useState<Lang>("en");
  useEffect(() => {
    setLangState(detectLang());
    document.documentElement.lang = detectLang();
    document.documentElement.dir = detectLang() === "ar" ? "rtl" : "ltr";
    const handler = () => setLangState(detectLang());
    window.addEventListener("mira:lang-change", handler);
    return () => window.removeEventListener("mira:lang-change", handler);
  }, []);
  return {
    t: (k: string) => tFor(lang, k),
    lang,
    setLang: (l: Lang) => {
      setLang(l);
      setLangState(l);
    },
  };
}
