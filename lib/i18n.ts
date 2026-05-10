"use client";

import i18n from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import { initReactI18next, useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import enMessages from "@/locales/en.json";

export const SUPPORTED_LANGS = [
  "en",
  "hi",
  "gu",
  "es",
  "zh",
  "ar",
  "tl",
  "vi",
  "ur",
  "ko",
  "ru",
  "fr",
  "bn",
  "pa",
  "pt",
] as const;

export type Lang = (typeof SUPPORTED_LANGS)[number];

export const LANGUAGE_OPTIONS: { code: Lang; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "gu", label: "Gujarati", nativeLabel: "ગુજરાતી" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "zh", label: "Chinese", nativeLabel: "中文" },
  { code: "ar", label: "Arabic", nativeLabel: "العربية" },
  { code: "tl", label: "Tagalog", nativeLabel: "Tagalog" },
  { code: "vi", label: "Vietnamese", nativeLabel: "Tiếng Việt" },
  { code: "ur", label: "Urdu", nativeLabel: "اردو" },
  { code: "ko", label: "Korean", nativeLabel: "한국어" },
  { code: "ru", label: "Russian", nativeLabel: "Русский" },
  { code: "fr", label: "French", nativeLabel: "Français" },
  { code: "bn", label: "Bengali", nativeLabel: "বাংলা" },
  { code: "pa", label: "Punjabi", nativeLabel: "ਪੰਜਾਬੀ" },
  { code: "pt", label: "Portuguese", nativeLabel: "Português" },
];

const RTL_LANGS = new Set<Lang>(["ar", "ur"]);

const loaders: Record<Lang, () => Promise<Record<string, string>>> = {
  en: () => Promise.resolve(enMessages),
  hi: () => import("@/locales/hi.json").then((m) => m.default),
  gu: () => import("@/locales/gu.json").then((m) => m.default),
  es: () => import("@/locales/es.json").then((m) => m.default),
  zh: () => import("@/locales/zh.json").then((m) => m.default),
  ar: () => import("@/locales/ar.json").then((m) => m.default),
  tl: () => import("@/locales/tl.json").then((m) => m.default),
  vi: () => import("@/locales/vi.json").then((m) => m.default),
  ur: () => import("@/locales/ur.json").then((m) => m.default),
  ko: () => import("@/locales/ko.json").then((m) => m.default),
  ru: () => import("@/locales/ru.json").then((m) => m.default),
  fr: () => import("@/locales/fr.json").then((m) => m.default),
  bn: () => import("@/locales/bn.json").then((m) => m.default),
  pa: () => import("@/locales/pa.json").then((m) => m.default),
  pt: () => import("@/locales/pt.json").then((m) => m.default),
};

let initPromise: Promise<unknown> | null = null;
const loaded = new Set<Lang>(["en"]);

export function normalizeLang(value?: string | null): Lang {
  const base = (value || "en").toLowerCase().split("-")[0];
  return SUPPORTED_LANGS.includes(base as Lang) ? (base as Lang) : "en";
}

export function isRtl(lang: Lang) {
  return RTL_LANGS.has(lang);
}

function syncDocumentDirection(lang: Lang) {
  if (typeof document === "undefined") return;
  document.documentElement.lang = lang;
  document.documentElement.dir = isRtl(lang) ? "rtl" : "ltr";
}

async function loadLanguage(lang: Lang) {
  if (loaded.has(lang)) return;
  const messages = await loaders[lang]();
  i18n.addResourceBundle(lang, "translation", messages, true, true);
  loaded.add(lang);
}

export async function initI18n() {
  if (!initPromise) {
    initPromise = i18n
      .use(LanguageDetector)
      .use(initReactI18next)
      .init({
        fallbackLng: "en",
        supportedLngs: [...SUPPORTED_LANGS],
        defaultNS: "translation",
        ns: ["translation"],
        resources: { en: { translation: enMessages } },
        interpolation: { escapeValue: false },
        detection: {
          order: ["localStorage", "navigator", "htmlTag"],
          caches: ["localStorage"],
          lookupLocalStorage: "mira:lang",
          convertDetectedLanguage: normalizeLang,
        },
        react: { useSuspense: false },
      });
  }
  await initPromise;
  await loadLanguage("en");
  const lang = normalizeLang(i18n.language);
  await loadLanguage(lang);
  if (i18n.language !== lang) await i18n.changeLanguage(lang);
  syncDocumentDirection(lang);
  return i18n;
}

export function detectLang(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem("mira:lang");
  if (stored) return normalizeLang(stored);
  return normalizeLang(window.navigator.language);
}

export async function setLang(lang: Lang) {
  await initI18n();
  await loadLanguage(lang);
  await i18n.changeLanguage(lang);
  window.localStorage.setItem("mira:lang", lang);
  syncDocumentDirection(lang);
}

export function tFor(lang: Lang, key: string): string {
  return i18n.getFixedT(lang)(key);
}

void initI18n();

export function useT(): {
  t: (key: string, options?: Record<string, unknown>) => string;
  lang: Lang;
  setLang: (lang: Lang) => void;
  ready: boolean;
} {
  const { t } = useTranslation();
  const [lang, setLangState] = useState<Lang>("en");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let mounted = true;
    initI18n().then(() => {
      const next = normalizeLang(i18n.language);
      if (!mounted) return;
      setLangState(next);
      setReady(true);
      syncDocumentDirection(next);
    });
    const handler = (nextLang: string) => {
      const next = normalizeLang(nextLang);
      loadLanguage(next).then(() => {
        syncDocumentDirection(next);
        setLangState(next);
        setReady(true);
      });
    };
    i18n.on("languageChanged", handler);
    return () => {
      mounted = false;
      i18n.off("languageChanged", handler);
    };
  }, []);

  return {
    t: (key, options) => t(key, options),
    lang,
    ready,
    setLang: (next) => {
      setReady(false);
      setLang(next).then(() => {
        setLangState(next);
        setReady(true);
      });
    },
  };
}
