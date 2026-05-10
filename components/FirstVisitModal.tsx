"use client";
import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";

const KEY = "mira:seen-privacy";

export default function FirstVisitModal() {
  const { t } = useT();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!window.sessionStorage.getItem(KEY)) setOpen(true);
  }, []);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl">
        <h3 className="font-semibold text-lg mb-3">{t("privacy.modalTitle")}</h3>
        <ul className="space-y-2 text-sm text-slate-700 list-disc ms-5">
          <li>{t("privacy.b1")}</li>
          <li>{t("privacy.b2")}</li>
          <li>{t("privacy.b3")}</li>
        </ul>
        <button
          onClick={() => {
            window.sessionStorage.setItem(KEY, "1");
            setOpen(false);
          }}
          className="mt-5 w-full py-2.5 rounded-md bg-brand-600 text-white font-medium"
        >
          {t("privacy.gotIt")}
        </button>
      </div>
    </div>
  );
}
