"use client";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import { loadForm } from "@/lib/session";

type MedResp = {
  input: string;
  generic: string | null;
  purpose: string | null;
  sources: { source: string; price: string | null; notes: string; action_label: string | null; url: string | null }[];
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
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
      <h1 className="text-2xl font-bold">{t("nav.lowerCosts")}</h1>

      <div className="bg-white border rounded-xl p-4">
        <label className="block text-sm font-medium mb-1">{t("costs.search")}</label>
        <p className="text-xs text-slate-500 mb-2">{t("costs.searchHint")}</p>
        <div className="flex gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
            placeholder="Lipitor, atorvastatin, insulin…"
            className="flex-1 border rounded-md px-3 py-2"
          />
          <button onClick={search} disabled={loading} className="bg-brand-600 text-white rounded-md px-4 py-2">
            {loading ? "…" : "Search"}
          </button>
        </div>
      </div>

      {med && (
        <div className="bg-white border rounded-xl p-4 space-y-3">
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

          <h3 className="font-semibold mt-2">{t("costs.priceTable")}</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-xs uppercase text-slate-500 text-left">
                <tr>
                  <th className="py-2">Source</th>
                  <th>Price</th>
                  <th>Notes</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {med.sources.map((s, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2 font-medium">{s.source}</td>
                    <td>{s.price || "—"}</td>
                    <td className="text-slate-600">{s.notes}</td>
                    <td>
                      {s.url && s.action_label && (
                        <a href={s.url} target="_blank" rel="noreferrer" className="text-brand-600 underline text-sm">
                          {s.action_label}
                        </a>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {med.paps.length > 0 && (
            <div className="mt-3">
              <h3 className="font-semibold">Manufacturer assistance</h3>
              <ul className="space-y-2 mt-2">
                {med.paps.map((p, i) => (
                  <li key={i} className="text-sm flex flex-wrap items-center gap-2 bg-emerald-50 border border-emerald-200 rounded p-2">
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

      <div className="bg-white border rounded-xl p-4">
        <h2 className="font-semibold">{t("costs.charities")}</h2>
        <ul className="mt-3 divide-y">
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
