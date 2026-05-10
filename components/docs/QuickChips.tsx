"use client";
import { useT } from "@/lib/i18n";

const CHIP_KEYS_BY_DOC_TYPE: Record<string, string[]> = {
  bill: ["docs.chip.billExpensive", "docs.chip.billNegotiate", "docs.chip.billCharity"],
  lab_report: ["docs.chip.labMeaning", "docs.chip.labFollowup"],
  prescription: ["docs.chip.rxGeneric", "docs.chip.rxSideEffects"],
  visit_summary: ["docs.chip.visitQuestions", "docs.chip.visitWatch"],
  insurance_eob: ["docs.chip.eobAppeal", "docs.chip.eobMatch"],
  other: ["docs.chip.genericExplain", "docs.chip.genericNext"],
};

export default function QuickChips({
  docType,
  filename,
  onAsk,
}: {
  docType?: string;
  filename: string;
  onAsk: (question: string) => void;
}) {
  const { t } = useT();
  const keys = CHIP_KEYS_BY_DOC_TYPE[docType || "other"] || CHIP_KEYS_BY_DOC_TYPE.other;
  return (
    <div className="flex flex-wrap gap-1.5">
      {keys.map((k) => {
        const text = t(k);
        return (
          <button
            key={k}
            type="button"
            onClick={() => onAsk(`${text} (${filename})`)}
            className="rounded-full border border-medical-100 bg-white px-3 py-1.5 text-xs font-medium text-medical-700 transition hover:border-medical-600 hover:bg-medical-50"
          >
            {text}
          </button>
        );
      })}
    </div>
  );
}
