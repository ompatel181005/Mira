"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useT } from "@/lib/i18n";
import { loadForm, saveForm, type FormState } from "@/lib/session";
import { detectEmergency, type EmergencyMatch } from "@/lib/emergency";
import EmergencyBanner from "./EmergencyBanner";
import FeatureCard from "./FeatureCard";

const CIRCS = ["pregnant", "children", "immigrant", "emergency"] as const;
const INSURANCE = ["none", "medicaid", "private", "medicare"] as const;

export default function HomeForm() {
  const { t, lang } = useT();
  const router = useRouter();
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
    router.push("/care");
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]">
      {emergency && (
        <div className="lg:col-span-2">
          <EmergencyBanner
            match={emergency}
            onDismiss={() => {
              setEmergency(null);
              proceed();
            }}
          />
        </div>
      )}

      <form onSubmit={onSubmit} className="ui-card p-5 sm:p-6 space-y-5">
        <div>
          <div className="page-kicker">Start here for care</div>
          <h2 className="mt-1 text-2xl font-bold tracking-tight text-slate-950">{t("home.careTitle")}</h2>
          <p className="mt-2 text-sm leading-6 text-slate-600">{t("home.careHint")}</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">{t("form.zip")} *</label>
            <input
              type="text"
              inputMode="numeric"
              maxLength={5}
              pattern="\d{5}"
              required
              placeholder={t("form.zipPlaceholder")}
              value={form.zip}
              onChange={(e) => setForm({ ...form, zip: e.target.value.replace(/\D/g, "") })}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">{t("form.language")} *</label>
            <select
              value={lang}
              onChange={(e) => {
                const newLang = e.target.value as "en" | "es" | "ar";
                window.sessionStorage.setItem("mira:lang", newLang);
                window.dispatchEvent(new Event("mira:lang-change"));
              }}
              className="field-input"
            >
              <option value="en">English</option>
              <option value="es">Español</option>
              <option value="ar">العربية</option>
            </select>
          </div>
        </div>

        <div>
          <label className="field-label">{t("form.symptoms")}</label>
          <textarea
            rows={2}
            placeholder={t("form.symptomsPlaceholder")}
            value={form.symptoms}
            onChange={(e) => setForm({ ...form, symptoms: e.target.value })}
            className="field-input min-h-[88px]"
          />
        </div>

        <div>
          <span className="field-label">{t("form.insurance")} *</span>
          <div className="flex flex-wrap gap-2">
            {INSURANCE.map((ins) => (
              <button
                type="button"
                key={ins}
                onClick={() => setForm({ ...form, insurance: ins })}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  form.insurance === ins
                    ? "bg-teal-700 text-white border-teal-700 shadow-sm"
                    : "bg-white border-slate-300 text-slate-700 hover:border-teal-300 hover:bg-teal-50"
                }`}
              >
                {t("form.insurance." + ins)}
              </button>
            ))}
          </div>
        </div>

        <div>
          <span className="field-label">{t("form.circumstances")}</span>
          <div className="flex flex-wrap gap-2">
            {CIRCS.map((c) => (
              <button
                type="button"
                key={c}
                onClick={() => toggleCirc(c)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition ${
                  form.circumstances.includes(c)
                    ? "bg-slate-900 text-white border-slate-900 shadow-sm"
                    : "bg-white border-slate-300 text-slate-700 hover:border-slate-400 hover:bg-slate-50"
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
          className="primary-button w-full py-3"
        >
          {t("cta.findCare")}
        </button>
      </form>

      <aside className="space-y-3">
        <div className="ui-card p-5">
          <h2 className="text-lg font-semibold text-slate-950">{t("home.moreTitle")}</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">{t("home.moreHint")}</p>
        </div>
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
      </aside>
    </div>
  );
}
