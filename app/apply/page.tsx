"use client";
import { useEffect, useMemo, useState } from "react";
import hospitals from "@/data/cook-county-hospitals.json";
import { useT } from "@/lib/i18n";
import { loadForm } from "@/lib/session";

type CharityResp = {
  hospital: {
    name: string;
    phone: string;
    policy_url: string;
    application_url: string | null;
    required_documents: string[];
    thresholds: { full: number; partial: number };
  };
  verdict: "full" | "partial" | "above" | "unknown";
  fpl_percent: number | null;
  cover_letter: string;
  phone_script: string;
};

type EligResp = {
  eligible: boolean;
  fpl_percent: number | null;
  state_application_url: string;
  program_name: string;
  required_documents: string[];
  notes: string;
};

type FundraiserDraft = {
  title: string;
  story: string;
  update: string;
};

function CopyButton({ text }: { text: string }) {
  const { t } = useT();
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-xs rounded border px-2 py-1 hover:bg-slate-50"
    >
      {copied ? t("apply.copied") : t("apply.copy")}
    </button>
  );
}

export default function ApplyPage() {
  const { t, lang } = useT();
  const [hospitalName, setHospitalName] = useState((hospitals as any[])[0].name);
  const [householdSize, setHouseholdSize] = useState(1);
  const [annualIncome, setAnnualIncome] = useState<string>("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<CharityResp | null>(null);
  const [showMedicaid, setShowMedicaid] = useState(false);
  const [eligibility, setEligibility] = useState<EligResp | null>(null);
  const [fundraiserGoal, setFundraiserGoal] = useState("");
  const [fundraiserDetails, setFundraiserDetails] = useState("");

  useEffect(() => {
    const f = loadForm();
    if (f.circumstances.includes("pregnant") || f.circumstances.includes("emergency")) {
      setShowMedicaid(true);
    }
  }, []);

  async function checkEligibility(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    try {
      const r = await fetch("/api/apply/charity-care", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          hospitalName,
          householdSize,
          annualIncome: annualIncome ? Number(annualIncome) : undefined,
          name: name || undefined,
          address: address || undefined,
          language: lang,
        }),
      });
      const j = await r.json();
      setResult(j);
    } finally {
      setSubmitting(false);
    }
  }

  async function checkMedicaid() {
    const f = loadForm();
    const r = await fetch("/api/apply/eligibility", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        uninsured: f.insurance === "none" || !f.insurance,
        usResident: true,
        householdSize,
        annualIncome: annualIncome ? Number(annualIncome) : undefined,
        condition: f.circumstances.includes("pregnant") ? "pregnant" : f.circumstances.includes("emergency") ? "er_visit" : "other",
      }),
    });
    setEligibility(await r.json());
  }

  const verdictText = useMemo(() => {
    if (!result) return null;
    if (result.verdict === "full") return t("apply.eligibilityFull");
    if (result.verdict === "partial") return t("apply.eligibilityPartial");
    if (result.verdict === "above") return t("apply.eligibilityAbove");
    return null;
  }, [result, t]);

  const fundraiserDraft = useMemo<FundraiserDraft | null>(() => {
    if (!result) return null;
    const displayName = name.trim() || t("apply.fundraiser.defaultName");
    const goal = fundraiserGoal ? Number(fundraiserGoal).toLocaleString() : "____";
    const hospital = result.hospital.name;
    const discountContext =
      result.verdict === "full"
        ? t("apply.fundraiser.fullContext")
        : result.verdict === "partial"
          ? t("apply.fundraiser.partialContext")
          : t("apply.fundraiser.generalContext");
    const details = fundraiserDetails.trim()
      ? `\n\n${fundraiserDetails.trim()}`
      : "";

    return {
      title: t("apply.fundraiser.generatedTitle").replace("{name}", displayName),
      story: t("apply.fundraiser.story")
        .replaceAll("{name}", displayName)
        .replace("{hospital}", hospital)
        .replace("{goal}", goal)
        .replace("{context}", discountContext)
        .replace("{details}", details),
      update: t("apply.fundraiser.update")
        .replace("{hospital}", hospital)
        .replace("{phone}", result.hospital.phone),
    };
  }, [fundraiserDetails, fundraiserGoal, name, result, t]);

  return (
    <div className="page-shell max-w-4xl space-y-5">
      <div>
        <div className="page-kicker">Applications and next steps</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{t("apply.title")}</h1>
      </div>

      <form onSubmit={checkEligibility} className="ui-card p-5 space-y-4">
        <div>
          <label className="field-label">{t("apply.hospital")}</label>
          <select
            value={hospitalName}
            onChange={(e) => setHospitalName(e.target.value)}
            className="field-input"
          >
            {(hospitals as any[]).map((h) => (
              <option key={h.name} value={h.name}>{h.name}</option>
            ))}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">{t("apply.householdSize")}</label>
            <input
              type="number"
              min={1}
              max={20}
              value={householdSize}
              onChange={(e) => setHouseholdSize(Number(e.target.value))}
              className="field-input"
            />
          </div>
          <div>
            <label className="field-label">{t("apply.income")}</label>
            <input
              type="number"
              min={0}
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
              placeholder="e.g. 24000"
              className="field-input"
            />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="field-label">{t("apply.name")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} className="field-input" />
          </div>
          <div>
            <label className="field-label">{t("apply.address")}</label>
            <input value={address} onChange={(e) => setAddress(e.target.value)} className="field-input" />
          </div>
        </div>
        <button disabled={submitting} className="primary-button w-full">
          {submitting ? "…" : t("apply.checkEligibility")}
        </button>
      </form>

      {result && (
        <div className="ui-card p-5 space-y-4">
          <div>
            <div className="font-semibold">{result.hospital.name}</div>
            {result.fpl_percent != null && (
              <div className="text-sm text-slate-600">Estimated household income: {result.fpl_percent}% of FPL</div>
            )}
            {verdictText && (
              <div className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-medium ${
                result.verdict === "full" ? "bg-emerald-100 text-emerald-800" :
                result.verdict === "partial" ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-700"
              }`}>{verdictText}</div>
            )}
          </div>

          {result.hospital.required_documents.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold">{t("apply.requiredDocs")}</h4>
              <ul className="list-disc ms-5 mt-1 text-sm">
                {result.hospital.required_documents.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}

          {result.hospital.application_url && (
            <a href={result.hospital.application_url} target="_blank" rel="noreferrer" className="inline-block bg-slate-900 text-white rounded-md px-4 py-2 text-sm">
              ⬇ {t("apply.downloadApp")}
            </a>
          )}

          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">{t("apply.coverLetter")}</h4>
              <CopyButton text={result.cover_letter} />
            </div>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">{result.cover_letter}</pre>
          </div>

          <div>
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold">{t("apply.phoneScript")}</h4>
              <CopyButton text={result.phone_script} />
            </div>
            <pre className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm">{result.phone_script}</pre>
            <a href={`tel:${result.hospital.phone}`} className="mt-2 inline-block text-brand-600 underline text-sm">
              📞 Call {result.hospital.phone}
            </a>
          </div>
        </div>
      )}

      {result && fundraiserDraft && (
        <div className="ui-card p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="page-kicker">{t("apply.fundraiser.kicker")}</div>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-slate-950">{t("apply.fundraiser.title")}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">{t("apply.fundraiser.body")}</p>
            </div>
            <a
              href="https://www.gofundme.com/start"
              target="_blank"
              rel="noreferrer"
              className="primary-button inline-block text-sm"
            >
              {t("apply.fundraiser.open")}
            </a>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">{t("apply.fundraiser.goal")}</label>
              <input
                type="number"
                min={0}
                value={fundraiserGoal}
                onChange={(e) => setFundraiserGoal(e.target.value)}
                placeholder="e.g. 3500"
                className="field-input"
              />
            </div>
            <div>
              <label className="field-label">{t("apply.fundraiser.note")}</label>
              <input
                value={fundraiserDetails}
                onChange={(e) => setFundraiserDetails(e.target.value)}
                placeholder={t("apply.fundraiser.notePlaceholder")}
                className="field-input"
              />
            </div>
          </div>

          <div className="grid gap-3">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">{t("apply.fundraiser.campaignTitle")}</h3>
                <CopyButton text={fundraiserDraft.title} />
              </div>
              <p className="mt-2 text-sm text-slate-700">{fundraiserDraft.title}</p>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">{t("apply.fundraiser.storyTitle")}</h3>
                <CopyButton text={fundraiserDraft.story} />
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{fundraiserDraft.story}</pre>
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-sm font-semibold">{t("apply.fundraiser.updateTitle")}</h3>
                <CopyButton text={fundraiserDraft.update} />
              </div>
              <pre className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{fundraiserDraft.update}</pre>
            </div>
          </div>

          <div className="rounded-lg border border-teal-200 bg-teal-50 p-3 text-sm text-teal-950">
            {t("apply.fundraiser.disclaimer")}
          </div>
        </div>
      )}

      {showMedicaid && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 shadow-sm space-y-2">
          <h3 className="font-semibold">{t("apply.medicaidEmergency")}</h3>
          <p className="text-sm text-slate-700">
            Illinois Emergency Medicaid covers labor and delivery, ER visits, and dialysis regardless of immigration status.
          </p>
          {!eligibility ? (
            <button onClick={checkMedicaid} className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-800">
              Check Emergency Medicaid eligibility
            </button>
          ) : (
            <div className="text-sm space-y-2">
              <div>
                Likely eligible: <strong>{eligibility.eligible ? "Yes" : "Unclear"}</strong>
                {eligibility.fpl_percent != null && ` (${eligibility.fpl_percent}% of FPL; threshold ≤138%)`}
              </div>
              <div>Program: {eligibility.program_name}</div>
              <div>
                <a href={eligibility.state_application_url} target="_blank" rel="noreferrer" className="text-brand-600 underline">
                  Apply at abe.illinois.gov →
                </a>
              </div>
              <ul className="list-disc ms-5 text-xs text-slate-600">
                {eligibility.required_documents.map((d, i) => <li key={i}>{d}</li>)}
              </ul>
            </div>
          )}
        </div>
      )}

      <p className="text-xs text-slate-500">{t("disclaimer")}</p>
    </div>
  );
}
