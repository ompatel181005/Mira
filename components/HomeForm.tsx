"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { loadForm, saveForm, type FormState } from "@/lib/session";
import { detectEmergency, type EmergencyMatch } from "@/lib/emergency";
import { motion } from "framer-motion";
import FeatureCard from "./FeatureCard";
import EmergencyBanner from "./EmergencyBanner";

const CIRCS = ["pregnant", "children", "immigrant", "emergency"] as const;
const INSURANCE = ["none", "medicaid", "private", "medicare"] as const;
type Insurance = FormState["insurance"];

export default function HomeForm() {
  const { t, lang } = useT();
  const router = useRouter();
  const [step, setStep] = useState<"idle" | "searching">("idle");
  const [searchInput, setSearchInput] = useState("");
  const [zip, setZip] = useState("");
  const [symptoms, setSymptoms] = useState("");
  const [insurance, setInsurance] = useState<Insurance>("");
  const [circumstances, setCircumstances] = useState<string[]>([]);
  const [emergency, setEmergency] = useState<EmergencyMatch | null>(null);

  // Hydrate any prior session so the user doesn't re-enter what they already gave us.
  useEffect(() => {
    const f = loadForm();
    if (f.zip) {
      setZip(f.zip);
      setSearchInput(f.zip);
    }
    if (f.symptoms) setSymptoms(f.symptoms);
    if (f.insurance) setInsurance(f.insurance);
    if (Array.isArray(f.circumstances)) setCircumstances(f.circumstances);
  }, []);

  // Hero search input is intentionally free-form: ZIP digits OR symptom text.
  function onSearchChange(value: string) {
    setSearchInput(value);
    const digitsOnly = /^\d{5}$/.test(value.trim());
    if (digitsOnly) {
      setZip(value.trim());
      setSymptoms("");
      setEmergency(null);
      return;
    }
    if (value.trim().length >= 4 && /[a-zA-Z]/.test(value)) {
      setSymptoms(value);
      const match = detectEmergency(value, lang);
      setEmergency(match);
    } else {
      setEmergency(null);
    }
  }

  function toggleCirc(c: string) {
    setCircumstances((cs) =>
      cs.includes(c) ? cs.filter((x) => x !== c) : [...cs, c]
    );
  }

  function persistAndGo(path: string) {
    if (!/^\d{5}$/.test(zip)) {
      alert(t("validation.zip5"));
      return;
    }
    saveForm({
      zip,
      language: lang,
      symptoms,
      insurance,
      circumstances,
    } as FormState);
    // Pre-emergency on the form's circumstances also gets surfaced via the banner.
    if (circumstances.includes("emergency") && !emergency) {
      setEmergency({
        category: "cardiac",
        severity: "critical",
        keyword_matched: "emergency",
      });
    }
    router.push(path);
  }

  const startSearching = () => setStep("searching");

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:py-20">
      {/* Inline emergency banner above the hero when symptoms match keywords. */}
      {emergency && step === "idle" && (
        <div className="mx-auto mb-6 max-w-2xl">
          <EmergencyBanner match={emergency} onDismiss={() => setEmergency(null)} />
        </div>
      )}

      {/* HERO */}
      <section className="flex flex-col items-center text-center">
        <motion.div
          animate={{ y: [0, -60, 0], rotate: [-1, 3, -1] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="relative mb-6 h-90 w-90 drop-shadow-2xl"
        >
          <img
            src="/doctor-bird.png"
            alt="Doctor Bird Mascot"
            className="h-full w-full object-contain"
          />
        </motion.div>

        <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 sm:text-6xl">
          {t("app.kicker")}
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
          {t("app.tagline")}
        </p>

        {/* Search-First Input — free form: ZIP digits OR symptom text. */}
        <div className="mt-10 w-full max-w-2xl px-2">
          <div className="relative group">
            <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
              <span className="text-2xl">🔍</span>
            </div>
            <input
              type="text"
              placeholder={t("home.searchPlaceholder")}
              className="w-full rounded-3xl border-0 bg-white py-6 pl-16 pr-36 text-lg shadow-soft ring-1 ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-medical-600 transition-all"
              onClick={startSearching}
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") startSearching();
              }}
            />
            <button
              onClick={startSearching}
              className="absolute right-3 top-2.5 bottom-2.5 px-8 rounded-2xl bg-medical-600 text-white font-bold text-sm hover:bg-medical-700 transition-all active:scale-95"
            >
              {t("cta.findCare")}
            </button>
          </div>
        </div>
      </section>

      {/* DASHBOARD CARDS */}
      <section className="mt-24">
        <div className="mb-10 text-center sm:text-left">
          <h2 className="text-2xl font-bold text-slate-900">{t("home.choose")}</h2>
          <p className="mt-1 text-slate-500">{t("home.chooseHint")}</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-3">
          <FeatureCard
            icon="🧾"
            label={t("nav.lowerCosts")}
            description={t("home.lowerCostsHint")}
            active={false}
            onClick={() => router.push("/costs")}
          />
          <FeatureCard
            icon="📄"
            label={t("nav.understandDocs")}
            description={t("home.docsHint")}
            active={false}
            onClick={() => router.push("/docs")}
          />
          <FeatureCard
            icon="🪪"
            label={t("nav.getHelp")}
            description={t("home.applyHint")}
            active={false}
            onClick={() => router.push("/apply")}
          />
        </div>
      </section>

      {/* MODAL */}
      {step === "searching" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="my-8 w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl sm:p-10"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <img src="/doctor-bird.png" className="h-8 w-8" alt="Bird" />
                <span className="text-xs font-bold uppercase tracking-widest text-medical-600">
                  Navigator Guide
                </span>
              </div>
              <button
                onClick={() => setStep("idle")}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200"
              >
                ✕
              </button>
            </div>

            {emergency && (
              <div className="mb-4">
                <EmergencyBanner
                  match={emergency}
                  onDismiss={() => setEmergency(null)}
                />
              </div>
            )}

            <h3 className="mb-2 text-2xl font-bold leading-tight text-slate-900">
              {t("form.zip")}
            </h3>
            <p className="mb-4 text-sm text-slate-500">{t("home.careHint")}</p>
            <input
              autoFocus
              type="text"
              inputMode="numeric"
              maxLength={5}
              className="mb-6 w-full border-none py-3 text-4xl font-bold text-medical-600 outline-none placeholder:text-slate-200 focus:ring-0"
              placeholder="00000"
              value={zip}
              onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => {
                if (e.key === "Enter") persistAndGo("/care");
              }}
            />

            {/* Insurance chips (optional) */}
            <div className="mb-5">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("form.insurance")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {INSURANCE.map((opt) => {
                  const active = insurance === opt;
                  return (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setInsurance(active ? "" : opt)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? "bg-medical-600 text-white"
                          : "border border-slate-200 bg-white text-slate-700 hover:border-medical-500"
                      }`}
                    >
                      {t(`form.insurance.${opt}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Circumstances chips (optional) */}
            <div className="mb-7">
              <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                {t("form.circumstances")}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {CIRCS.map((c) => {
                  const active = circumstances.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleCirc(c)}
                      className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                        active
                          ? "bg-medical-600 text-white"
                          : "border border-slate-200 bg-white text-slate-700 hover:border-medical-500"
                      }`}
                    >
                      {t(`form.circ.${c}`)}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => persistAndGo("/care")}
              className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-medical-600 py-4 text-lg font-bold text-white shadow-lg shadow-medical-200 transition-all hover:bg-medical-700"
            >
              {t("cta.findCare")}
              <span className="transition-transform group-hover:translate-x-1">
                →
              </span>
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}
