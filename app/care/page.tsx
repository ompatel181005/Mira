"use client";
import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useT } from "@/lib/i18n";
import { loadForm } from "@/lib/session";
import CareCard, { type CareResult } from "@/components/care/CareCard";
import EmergencyBanner from "@/components/EmergencyBanner";
import type { EmergencyMatch } from "@/lib/emergency";
import { detectEmergency } from "@/lib/emergency";

const CareMap = dynamic(() => import("@/components/care/CareMap"), { ssr: false });

export default function CarePage() {
  const { t, lang } = useT();
  const [data, setData] = useState<{
    center: { lat: number; lng: number };
    results: CareResult[];
  } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [zip, setZip] = useState("");
  const [emergency, setEmergency] = useState<EmergencyMatch | null>(null);

  useEffect(() => {
    const form = loadForm();
    setZip(form.zip);
    if (!form.zip) {
      setError("No ZIP set — please return to the home page.");
      setLoading(false);
      return;
    }
    if (form.circumstances.includes("emergency")) {
      setEmergency({ category: "cardiac", severity: "critical", keyword_matched: "emergency" });
    } else {
      const m = detectEmergency(form.symptoms, lang);
      if (m) setEmergency(m);
    }
    fetch("/api/care", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        zip: form.zip,
        symptoms: form.symptoms,
        language: lang,
        insurance: form.insurance,
        circumstances: form.circumstances,
      }),
    })
      .then((r) => (r.ok ? r.json() : r.json().then((j) => Promise.reject(j.error))))
      .then((j) => {
        setData({ center: j.center, results: j.results });
        setLoading(false);
      })
      .catch((e) => {
        setError(typeof e === "string" ? e : "Could not load results");
        setLoading(false);
      });
  }, [lang]);

  const pins = useMemo(
    () =>
      (data?.results || []).map((r: any) => ({
        name: r.name,
        lat: r.lat,
        lng: r.lng,
        phone: r.phone,
        has_er: r.has_er,
        source: r.source,
      })),
    [data]
  );

  return (
    <div className="page-shell space-y-5">
      <div>
        <div className="page-kicker">Nearby options</div>
        <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-950">{t("care.header")}</h1>
        <div className="mt-2 text-sm text-slate-600">
          ZIP {zip} · {data?.results.length ?? 0} {t("care.results")}
        </div>
      </div>

      {emergency && <EmergencyBanner match={emergency} onDismiss={() => setEmergency(null)} />}

      {loading && <div className="ui-card p-4 text-slate-500">Loading…</div>}
      {error && <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-700">{error}</div>}

      {data && (
        <div className="grid lg:grid-cols-5 gap-4">
          <div className="ui-card overflow-hidden p-2 lg:col-span-3">
            <CareMap center={data.center} pins={pins as any} />
          </div>
          <div className="lg:col-span-2 space-y-3 max-h-[420px] overflow-auto pr-1">
            {data.results.map((r, i) => (
              <CareCard key={i} r={r} />
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-slate-500">{t("disclaimer")}</p>
    </div>
  );
}
