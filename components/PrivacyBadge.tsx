"use client";
import { useT } from "@/lib/i18n";
import { wipeSession } from "@/lib/session";

export default function PrivacyBadge() {
  const { t } = useT();
  return (
    <div className="hidden md:flex items-center gap-2 text-xs text-slate-600">
      <span className="bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full px-2 py-1">
        {t("privacy.badge")}
      </span>
      <button
        type="button"
        onClick={() => {
          if (confirm(t("privacy.wipe") + "?")) wipeSession();
        }}
        className="underline text-slate-500 hover:text-slate-700"
      >
        {t("privacy.wipe")}
      </button>
    </div>
  );
}
