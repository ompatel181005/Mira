"use client";
import { useState } from "react";
import { useT } from "@/lib/i18n";

export default function TalkToReal() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium shadow-sm transition hover:bg-slate-50"
      >
        ☎ {t("talkToReal")}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="ui-card max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-3">{t("talkToReal")}</h3>
            <ul className="space-y-2 text-sm">
              <li>🚨 <a className="text-brand-600 underline" href="tel:911">911</a> - {t("support.emergency")}</li>
              <li>💬 <a className="text-brand-600 underline" href="tel:988">988</a> - {t("support.crisis")}</li>
              <li>🤝 <a className="text-brand-600 underline" href="tel:211">211</a> - {t("support.community")}</li>
              <li>🏥 <a className="text-brand-600 underline" href="tel:18774644772">1-877-464-4772</a> - {t("support.hrsa")}</li>
            </ul>
            <button onClick={() => setOpen(false)} className="primary-button mt-4 w-full">{t("common.close")}</button>
          </div>
        </div>
      )}
    </>
  );
}
