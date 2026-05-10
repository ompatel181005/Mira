"use client";

import { useT } from "@/lib/i18n";

export default function Footer() {
  const { t } = useT();
  return (
    <footer className="text-center text-xs text-slate-500 py-6 px-4">
      MIRA · {t("disclaimer")}
    </footer>
  );
}
