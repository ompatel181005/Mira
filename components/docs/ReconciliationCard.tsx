"use client";
import { useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import RichText from "@/components/RichText";

type Finding = {
  severity: "critical" | "warning" | "info" | string;
  title: string;
  detail: string;
  docs_referenced: string[];
};

type Combined = {
  headline: string;
  findings: Finding[];
  combined_next_steps: string[];
};

function severityStyles(s: string) {
  if (s === "critical") return "border-red-300 bg-red-50";
  if (s === "warning") return "border-amber-300 bg-amber-50";
  return "border-slate-200 bg-white";
}

function severityIcon(s: string) {
  if (s === "critical") return "⚠️";
  if (s === "warning") return "⚡";
  return "ℹ️";
}

export default function ReconciliationCard({
  docs,
  language,
}: {
  docs: { filename: string; extracted: any }[];
  language: string;
}) {
  const { t } = useT();
  const [data, setData] = useState<Combined | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Cache key = filenames joined; if the set changes we refetch.
  const cacheKey = docs.map((d) => d.filename).join("|");
  const lastKey = useRef<string>("");

  useEffect(() => {
    if (docs.length < 2) {
      setData(null);
      return;
    }
    if (cacheKey === lastKey.current) return;
    lastKey.current = cacheKey;

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch("/api/docs/combine", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ docs, language }),
    })
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.error) setError(j.error);
        else setData(j);
      })
      .catch((e) => {
        if (!cancelled) setError(e?.message || "Failed to reconcile");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [cacheKey, docs, language]);

  if (docs.length < 2) return null;

  if (loading) {
    return (
      <div className="ui-card p-4 text-sm text-slate-500">
        {t("docs.reconciling")}
      </div>
    );
  }

  if (error) return null;
  if (!data) return null;
  if (
    !data.headline &&
    (!data.findings || data.findings.length === 0) &&
    (!data.combined_next_steps || data.combined_next_steps.length === 0)
  ) {
    return null;
  }

  return (
    <div className="ui-card p-5 space-y-3 border-medical-100 bg-medical-50/50">
      <div className="flex items-center gap-2">
        <span className="rounded-full bg-medical-100 px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-medical-700">
          {t("docs.combinedView")}
        </span>
        <span className="text-xs text-slate-500">
          {docs.length} {t("docs.documents")}
        </span>
      </div>

      {data.headline && (
        <RichText
          text={data.headline}
          className="text-base font-medium text-slate-900"
        />
      )}

      {data.findings && data.findings.length > 0 && (
        <div className="space-y-2">
          {data.findings.map((f, i) => (
            <div
              key={i}
              className={`rounded-lg border p-3 text-sm ${severityStyles(f.severity)}`}
            >
              <div className="font-semibold flex items-center gap-1.5">
                <span>{severityIcon(f.severity)}</span>
                <span>{f.title}</span>
              </div>
              <RichText text={f.detail} className="text-sm text-slate-700 mt-1" />
              {f.docs_referenced && f.docs_referenced.length > 0 && (
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {f.docs_referenced.map((fn, j) => (
                    <span
                      key={j}
                      className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-xs text-slate-600"
                    >
                      {fn}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {data.combined_next_steps && data.combined_next_steps.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-slate-700">
            {t("docs.combinedNextSteps")}
          </h4>
          <ol className="list-decimal ms-5 mt-1 text-sm text-slate-700 space-y-1">
            {data.combined_next_steps.map((s, j) => (
              <li key={j}>
                <RichText text={s} />
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
