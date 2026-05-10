"use client";
type Props = {
  icon: string;
  label: string;
  active: boolean;
  onClick: () => void;
};
export default function FeatureCard({ icon, label, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 sm:p-5 text-center transition w-full
        ${active ? "border-brand-500 bg-brand-50 shadow-sm" : "border-slate-200 bg-white hover:bg-slate-50"}`}
    >
      <span className="text-3xl" aria-hidden>
        {icon}
      </span>
      <span className="font-medium text-sm sm:text-base">{label}</span>
    </button>
  );
}
