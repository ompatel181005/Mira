"use client";
import HomeForm from "@/components/HomeForm";
import { useT } from "@/lib/i18n";

export default function HomePage() {
  const { t } = useT();
  return (
    <div className="max-w-4xl mx-auto px-4 py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">{t("app.title")}</h1>
        <p className="mt-3 text-slate-600 max-w-2xl">{t("app.tagline")}</p>
      </div>
      <HomeForm />
    </div>
  );
}
