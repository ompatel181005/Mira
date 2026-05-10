"use client";
import HomeForm from "@/components/HomeForm";
import { useT } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useT();
  return (
    <div className="page-shell max-w-5xl">
      <div className="mb-8 rounded-lg border border-white/70 bg-white/60 p-5 shadow-sm backdrop-blur sm:p-7">
        <div className="page-kicker">{t("app.kicker")}</div>
        <h1 className="page-title mt-2">{t("app.title")}</h1>
        <p className="page-subtitle">{t("app.tagline")}</p>
      </div>
      <HomeForm />
    </div>
  );
}
