"use client";
type Props = {
  icon: string;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
};
export default function FeatureCard({ icon, label, description, active, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      type="button"
      className={`group flex min-h-[112px] w-full items-start gap-4 rounded-lg border p-4 text-left shadow-sm transition sm:p-5
        ${active ? "border-teal-500 bg-teal-50 text-teal-950 shadow-teal-100" : "border-slate-200 bg-white/90 text-slate-700 hover:-translate-y-0.5 hover:border-slate-300 hover:bg-white hover:shadow-md"}`}
    >
      <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg text-2xl transition ${active ? "bg-white shadow-sm" : "bg-slate-50 group-hover:bg-teal-50"}`} aria-hidden>
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold sm:text-base">{label}</span>
        <span className="mt-1 block text-xs leading-5 text-slate-500 sm:text-sm">{description}</span>
      </span>
    </button>
  );
}
