"use client";
import { useT } from "@/lib/i18n";
import type { EmergencyMatch } from "@/lib/emergency";

export default function EmergencyBanner({
  match,
  onDismiss,
}: {
  match: EmergencyMatch;
  onDismiss?: () => void;
}) {
  const { t } = useT();
  const psychiatric = match.category === "psychiatric";
  return (
    <div role="alert" className="bg-red-600 text-white rounded-xl p-4 shadow-lg">
      <div className="flex items-start gap-3">
        <span className="text-2xl">🚨</span>
        <div className="flex-1">
          <h3 className="font-bold text-lg">{t("emergency.title")}</h3>
          <p className="mt-1 text-sm">
            {psychiatric ? t("emergency.psychiatric") : t("emergency.body")}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <a href="tel:911" className="bg-white text-red-700 font-semibold rounded-md px-3 py-1.5 text-sm">
              📞 911
            </a>
            {psychiatric && (
              <a href="tel:988" className="bg-white text-red-700 font-semibold rounded-md px-3 py-1.5 text-sm">
                💬 988
              </a>
            )}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="bg-red-800 text-white rounded-md px-3 py-1.5 text-sm"
              >
                {t("emergency.dismiss")}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
