"use client";
import Link from "next/link";
import LanguageToggle from "./LanguageToggle";
import PrivacyBadge from "./PrivacyBadge";
import TalkToReal from "./TalkToReal";
import { useT } from "@/lib/i18n";

export default function Header() {
  const { t } = useT();
  return (
    <header className="border-b bg-white">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center gap-3">
        <Link href="/" className="font-semibold text-brand-600 text-lg">
          MIRA
        </Link>
        <span className="text-slate-400 text-sm hidden sm:inline">{t("app.title")}</span>
        <div className="ms-auto flex items-center gap-2">
          <PrivacyBadge />
          <TalkToReal />
          <LanguageToggle />
        </div>
      </div>
    </header>
  );
}
