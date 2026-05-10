"use client";
import { useT } from "@/lib/i18n";
import { wipeSession } from "@/lib/session";

export default function PrivacyBadge() {
  const { t } = useT();
  return (
    <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
      <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 font-medium text-emerald-700">
        {t("privacy.badge")}
      </span>
      <button
        type="button"
        onClick={() => {
          if (confirm(t("privacy.wipe") + "?")) wipeSession();
        }}
        className="rounded-full px-2 py-1 text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
      >
        {t("privacy.wipe")}
      </button>
    </div>
  );
}
