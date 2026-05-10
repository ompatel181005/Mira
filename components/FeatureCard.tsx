"use client";

type Props = {
  icon: string;
  label: string;
  description: string;
  active: boolean;
  onClick: () => void;
};

export default function FeatureCard({ icon, label, description, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      type="button"
      className="group flex flex-col items-center justify-center gap-3 rounded-3xl border border-slate-100 bg-white p-6 text-center shadow-soft transition-all duration-300 hover:-translate-y-2 hover:border-medical-100 hover:shadow-xl"
    >
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-medical-50 text-3xl transition-transform group-hover:scale-110">
        {icon}
      </span>
      <div>
        <span className="block text-base font-bold text-slate-900">{label}</span>
        <span className="mt-2 block text-xs leading-relaxed text-slate-500 line-clamp-2">
          {description}
        </span>
      </div>
    </button>
  );
}