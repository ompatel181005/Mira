"use client";
import Link from "next/link";
import LanguageToggle from "./LanguageToggle";
import PrivacyBadge from "./PrivacyBadge";
import TalkToReal from "./TalkToReal";
import { useT } from "@/lib/i18n";

export default function Header() {
  const { t } = useT();
  return (
    <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/85 backdrop-blur-xl">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link href="/" className="flex items-center gap-2 font-semibold text-slate-950 text-lg">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-teal-700 text-sm font-bold text-white shadow-sm">
            M
          </span>
          <span>MIRA</span>
        </Link>
        <span className="hidden max-w-sm truncate text-sm text-slate-500 sm:inline">{t("app.title")}</span>
        <div className="ms-auto flex items-center gap-2">
          <PrivacyBadge />
          <TalkToReal />
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
