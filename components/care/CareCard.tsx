"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n";

export type CareResult = {
  name: string;
  address: string;
  phone: string;
  distance_miles: number;
  services: string[];
  languages: string[];
  sliding_scale: boolean;
  accepts_uninsured: boolean;
  source: "FQHC" | "Nonprofit Hospital" | "Free Clinic";
  has_er?: boolean;
  charity_care_policy_url?: string | null;
};

export default function CareCard({ r }: { r: CareResult }) {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const dirUrl = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(r.address)}`;
  return (
    <div className="ui-card p-4 transition hover:border-medical-100 hover:shadow-md">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold">{r.name}</h3>
            {r.has_er && (
              <span className="soft-pill border-red-200 bg-red-50 text-red-700">
                ER
              </span>
            )}
            <span className="soft-pill border-slate-200 bg-slate-100 text-slate-600">
              {r.source}
            </span>
          </div>
          <div className="text-sm text-slate-600 mt-0.5">{r.address}</div>
          <div className="text-xs text-slate-500 mt-1">{r.distance_miles} mi away</div>
        </div>
      </div>

      <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
        {r.sliding_scale && (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
            ✓ {t("care.slidingScale")}
          </span>
        )}
        {r.accepts_uninsured && (
          <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-0.5">
            ✓ {t("care.acceptsUninsured")}
          </span>
        )}
        {r.charity_care_policy_url && (
          <a
            href={r.charity_care_policy_url}
            target="_blank"
            rel="noreferrer"
            className="bg-amber-50 text-amber-800 border border-amber-200 rounded-full px-2 py-0.5 underline"
          >
            {t("care.charityCare")} — {t("care.applyVia")}
          </a>
        )}
        {r.languages.includes("Spanish") && (
          <span className="bg-slate-50 text-slate-700 border border-slate-200 rounded-full px-2 py-0.5">
            {t("care.habla")}
          </span>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <a
          href={dirUrl}
          target="_blank"
          rel="noreferrer"
          className="secondary-button"
        >
          🧭 {t("care.directions")}
        </a>
        <a
          href={`tel:${r.phone}`}
          className="primary-button px-3 py-2 text-sm"
        >
          📞 {t("care.callNow")}
        </a>
        <button
          onClick={() => setOpen((v) => !v)}
          className="secondary-button"
        >
          {open ? "▴" : "▾"} {t("care.whyRecommend")}
        </button>
      </div>

      {open && (
        <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-3 text-sm text-slate-700">
          <ul className="list-disc ms-5 space-y-1">
            {r.source === "FQHC" && (
              <li>
                Federally Qualified Health Center — required to serve all patients regardless of ability to pay or immigration status.
              </li>
            )}
            {r.sliding_scale && <li>Offers sliding-scale fees based on income.</li>}
            {r.accepts_uninsured && <li>Accepts uninsured patients.</li>}
            {r.languages.length > 0 && (
              <li>Languages: {r.languages.join(", ")}</li>
            )}
            {(r.services || []).slice(0, 6).length > 0 && (
              <li>Services: {(r.services || []).slice(0, 6).join(", ")}</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
