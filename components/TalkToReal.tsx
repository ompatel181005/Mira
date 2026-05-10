"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "@/lib/i18n";

export default function TalkToReal() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const modal = open ? (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4"
      onClick={() => setOpen(false)}
    >
      <div
        className="ui-card max-h-[90vh] w-full max-w-md overflow-y-auto p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-lg mb-3">{t("talkToReal")}</h3>
        <ul className="space-y-2 text-sm">
          <li>🚨 <a className="text-brand-600 underline" href="tel:911">911</a> — Emergency</li>
          <li>💬 <a className="text-brand-600 underline" href="tel:988">988</a> — Suicide & Crisis Lifeline</li>
          <li>🤝 <a className="text-brand-600 underline" href="tel:211">211</a> — Community services</li>
          <li>🏥 <a className="text-brand-600 underline" href="tel:18774644772">1-877-464-4772</a> — HRSA Find a Health Center</li>
        </ul>
        <button onClick={() => setOpen(false)} className="primary-button mt-4 w-full">Close</button>
      </div>
    </div>
  ) : null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium shadow-sm transition hover:bg-slate-50"
      >
        ☎ {t("talkToReal")}
      </button>
      {mounted && modal ? createPortal(modal, document.body) : null}
    </>
  );
}
