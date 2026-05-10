"use client";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { loadForm } from "@/lib/session";

type MedResp = {
  input: string;
  generic: string | null;
  purpose: string | null;
  sources: { source: string; price: string | null; notes: string; action_label: string | null; url: string | null }[];
  externalChecks?: { source: string; status: string; notes: string; action_label: string; url: string }[];
  paps: { generic: string; brand: string | null; manufacturer: string; program_name: string; enrollment_url: string; notes: string }[];
};

type Charity = {
  name: string;
  type: string;
  address: string;
  phone: string;
  url: string;
  languages: string[];
  serves: string[];
  eligibility: string;
  country_focus: string | null;
  distance_miles: number | null;
};

export default function CostsPage() {
  const { t, lang } = useT();
  const [name, setName] = useState("");
  const [zip, setZip] = useState("");
  const [med, setMed] = useState<MedResp | null>(null);
  const [loading, setLoading] = useState(false);
  const [charities, setCharities] = useState<Charity[]>([]);

  useEffect(() => {
    const f = loadForm();
    setZip(f.zip);
    fetch("/api/costs/charities", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ zip: f.zip }),
    })
      .then((r) => r.json())
      .then((j) => setCharities(j.results || []));
  }, []);

  async function search() {
    if (!name.trim()) return;
    setLoading(true);
    setMed(null);
    try {
      const r = await fetch("/api/costs/medication", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name, zip }),
      });
      const j = await r.json();
      setMed(j);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="page-shell max-w-4xl space-y-5">
      <div>
        <div className="page-kicker">Medication and bill support</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{t("nav.lowerCosts")}</h1>
      </div>

      <div className="ui-card p-5">
        <label className="field-label">{t("costs.search")}</label>
        <p className="text-xs text-slate-500 mb-2">{t("costs.searchHint")}</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Lipitor, atorvastatin, insulin…"
            className="field-input flex-1"
          />
          <button onClick={search} disabled={loading} className="primary-button">
            {loading ? "…" : "Search"}
          </button>
        </div>
      </div>

      {med && (
        <div className="ui-card p-5 space-y-3">
          <div className="flex items-baseline justify-between flex-wrap gap-2">
            <div>
              <div className="font-semibold capitalize">{med.input}</div>
              {med.generic && (
                <div className="text-sm text-slate-600">
                  Generic: <span className="font-medium">{med.generic}</span>
                </div>
              )}
            </div>
            {med.purpose && (
              <div className="text-xs text-slate-500 max-w-md">Used for: {med.purpose.slice(0, 200)}</div>
            )}
          </div>

          {med.sources.length > 0 && (
            <>
              <h3 className="font-semibold mt-2">{t("costs.priceTable")}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                    <tr>
                      <th className="rounded-l-lg px-3 py-2">Source</th>
                      <th className="px-3">Price</th>
                      <th className="px-3">Notes</th>
                      <th className="rounded-r-lg px-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {med.sources.map((s, i) => (
                      <tr key={i} className="border-b border-slate-100 last:border-0">
                        <td className="px-3 py-3 font-medium">{s.source}</td>
                        <td className="px-3 font-medium text-slate-900">{s.price || "Unavailable"}</td>
                        <td className="px-3 text-slate-600">{s.notes}</td>
                        <td className="px-3">
                          {s.url && s.action_label && (
                            <a href={s.url} target="_blank" rel="noreferrer" className="text-teal-700 underline text-sm font-medium">
                              {s.action_label}
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {med.externalChecks && med.externalChecks.length > 0 && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <h3 className="font-semibold">Other places to check</h3>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {med.externalChecks.map((check, i) => (
                  <a
                    key={i}
                    href={check.url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-sm transition hover:border-teal-300 hover:bg-teal-50"
                  >
                    <span className="block font-semibold text-slate-950">{check.source}</span>
                    <span className="mt-1 block text-xs font-medium uppercase tracking-wide text-slate-500">{check.status}</span>
                    <span className="mt-2 block text-slate-600">{check.notes}</span>
                    <span className="mt-3 inline-block font-semibold text-teal-700 underline">{check.action_label}</span>
                  </a>
                ))}
              </div>
            </div>
          )}

          {med.paps.length > 0 && (
            <div className="mt-3">
              <h3 className="font-semibold">Manufacturer assistance</h3>
              <ul className="space-y-2 mt-2">
                {med.paps.map((p, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm">
                    <span className="font-medium">{p.program_name}</span>
                    <span className="text-slate-600">— {p.manufacturer}</span>
                    <span className="text-xs text-slate-500">{p.notes}</span>
                    <a href={p.enrollment_url} target="_blank" rel="noreferrer" className="ms-auto text-brand-600 underline">
                      {t("costs.applyPAP")}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="ui-card p-5">
        <h2 className="font-semibold">{t("costs.charities")}</h2>
        <ul className="mt-3 divide-y divide-slate-100">
          {charities.map((c, i) => (
            <li key={i} className="py-3 flex flex-wrap gap-2 items-baseline">
              <div className="min-w-0 flex-1">
                <div className="font-medium">{c.name}</div>
                <div className="text-xs text-slate-500">{c.address}</div>
                <div className="text-xs text-slate-500 mt-0.5">{c.eligibility}</div>
                <div className="text-xs text-slate-500 mt-0.5">Languages: {(c.languages || []).join(", ")}</div>
              </div>
              <div className="flex items-center gap-2 text-sm">
                {c.distance_miles != null && (
                  <span className="text-xs text-slate-500">{c.distance_miles} mi</span>
                )}
                <a href={`tel:${c.phone}`} className="text-brand-600 underline">{c.phone}</a>
                <a href={c.url} target="_blank" rel="noreferrer" className="text-brand-600 underline">Site</a>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <p className="text-xs text-slate-500">{t("disclaimer")}</p>
    </div>
  );
}
