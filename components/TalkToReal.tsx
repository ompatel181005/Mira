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
        className="text-xs px-3 py-1.5 rounded-full border border-slate-300 hover:bg-slate-50"
      >
        ☎ {t("talkToReal")}
      </button>
      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold text-lg mb-3">{t("talkToReal")}</h3>
            <ul className="space-y-2 text-sm">
              <li>🚨 <a className="text-brand-600 underline" href="tel:911">911</a> — Emergency</li>
              <li>💬 <a className="text-brand-600 underline" href="tel:988">988</a> — Suicide & Crisis Lifeline</li>
              <li>🤝 <a className="text-brand-600 underline" href="tel:211">211</a> — Community services</li>
              <li>🏥 <a className="text-brand-600 underline" href="tel:18774644772">1-877-464-4772</a> — HRSA Find a Health Center</li>
            </ul>
            <button onClick={() => setOpen(false)} className="mt-4 w-full py-2 rounded-md bg-slate-900 text-white">Close</button>
          </div>
        </div>
      )}
    </>
  );
}
