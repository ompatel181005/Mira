"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { loadForm, saveForm, type FormState } from "@/lib/session";
import { detectEmergency, type EmergencyMatch } from "@/lib/emergency";
import EmergencyBanner from "./EmergencyBanner";
import FeatureCard from "./FeatureCard";

type Feature = "care" | "costs" | "docs" | "apply";

const CIRCS = ["pregnant", "children", "immigrant", "emergency"] as const;
const INSURANCE = ["none", "medicaid", "private", "medicare"] as const;

export default function HomeForm() {
  const { t, lang } = useT();
  const router = useRouter();
  const [feature, setFeature] = useState<Feature>("care");
  const [form, setForm] = useState<FormState>({
    zip: "",
    language: "en",
    symptoms: "",
    insurance: "",
    circumstances: [],
  });
  const [emergency, setEmergency] = useState<EmergencyMatch | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loaded = loadForm();
    setForm({ ...loaded, language: lang });
  }, [lang]);

  const ctaLabel = useMemo(() => {
    if (feature === "care") return t("cta.findCare");
    if (feature === "costs") return t("cta.lowerCosts");
    if (feature === "docs") return t("cta.understandDocs");
    return t("cta.getHelp");
  }, [feature, t]);

  function toggleCirc(c: string) {
    setForm((f) => ({
      ...f,
      circumstances: f.circumstances.includes(c)
        ? f.circumstances.filter((x) => x !== c)
        : [...f.circumstances, c],
    }));
  }

  function validate(): string | null {
    if (!/^\d{5}$/.test(form.zip)) return t("form.zip") + " (5 digits)";
    if (!form.insurance) return t("form.insurance");
    return null;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const err = validate();
    if (err) {
      alert(err);
      return;
    }
    saveForm({ ...form, language: lang });
    // Emergency check
    let match = detectEmergency(form.symptoms, lang);
    if (!match && form.circumstances.includes("emergency")) {
      match = { category: "cardiac", severity: "critical", keyword_matched: "emergency" };
    }
    if (match) {
      setEmergency(match);
      // Don't block — user dismisses, we still navigate
      return;
    }
    proceed();
  }

  function proceed() {
    setSubmitting(true);
    if (feature === "care") router.push("/care");
    else if (feature === "costs") router.push("/costs");
    else if (feature === "docs") router.push("/docs");
    else router.push("/apply");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Feature cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <FeatureCard icon="📍" label={t("nav.findCare")} active={feature === "care"} onClick={() => setFeature("care")} />
        <FeatureCard icon="🧾" label={t("nav.lowerCosts")} active={feature === "costs"} onClick={() => setFeature("costs")} />
        <FeatureCard icon="📄" label={t("nav.understandDocs")} active={feature === "docs"} onClick={() => setFeature("docs")} />
        <FeatureCard icon="🪪" label={t("nav.getHelp")} active={feature === "apply"} onClick={() => setFeature("apply")} />
      </div>

      {emergency && (
        <EmergencyBanner
          match={emergency}
          onDismiss={() => {
            setEmergency(null);
            proceed();
          }}
        />
      )}

      {/* Form panel */}
      <div className="bg-white border rounded-xl p-5 sm:p-6 space-y-5 shadow-sm">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t("form.zip")} *</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              pattern="\d{5}"
              required
              placeholder={t("form.zipPlaceholder")}
              value={form.zip}
              onChange={(e) => setForm({ ...form, zip: e.target.value.replace(/\D/g, "") })}
              className="w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">{t("form.language")} *</label>
            <select
              value={lang}
              onChange={(e) => {
                const newLang = e.target.value as "en" | "es" | "ar";
                window.sessionStorage.setItem("mira:lang", newLang);
                window.dispatchEvent(new Event("mira:lang-change"));
              }}
              className="w-full border rounded-md px-3 py-2 bg-white"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">{t("form.symptoms")}</label>
          <textarea
            rows={2}
            placeholder={t("form.symptomsPlaceholder")}
            value={form.symptoms}
            onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
            className="w-full border rounded-md px-3 py-2"
          />
        </div>

        <div>
          <span className="block text-sm font-medium mb-2">{t("form.insurance")} *</span>
          <div className="flex flex-wrap gap-2">
            {INSURANCE.map((ins) => (
              <button
                type="button"
                key={ins}
                onClick={() => setForm({ ...form, insurance: ins })}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  form.insurance === ins
                    ? "bg-brand-600 text-white border-brand-600"
                    : "bg-white border-slate-300"
                }`}
              >
                {t("form.insurance." + ins)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="block text-sm font-medium mb-2">{t("form.circumstances")}</span>
          <div className="flex flex-wrap gap-2">
            {CIRCS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => toggleCirc(c)}
                className={`rounded-full border px-3 py-1.5 text-sm ${
                  form.circumstances.includes(c)
                    ? "bg-slate-900 text-white border-slate-900"
                    : "bg-white border-slate-300"
                }`}
              >
                {t("form.circ." + c)}
              </button>
            ))}
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-3 rounded-md bg-brand-600 text-white font-semibold hover:bg-brand-700 disabled:opacity-60"
        >
          {ctaLabel}
        </button>
      </div>
    </form>
  );
}
