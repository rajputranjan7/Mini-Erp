const STYLES: Record<string, string> = {
  LEAD: "bg-slate-100 text-slate-600 border-slate-200",
  ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
  INACTIVE: "bg-slate-100 text-slate-500 border-slate-200",
  DRAFT: "bg-amber-50 text-amber-700 border-amber-200",
  CONFIRMED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  CANCELLED: "bg-red-50 text-red-600 border-red-200",
  IN: "bg-emerald-50 text-emerald-700 border-emerald-200",
  OUT: "bg-slate-100 text-slate-600 border-slate-200",
};

export default function StatusChip({ value }: { value: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide ${
        STYLES[value] ?? "bg-slate-100 text-slate-600 border-slate-200"
      }`}
    >
      {value}
    </span>
  );
}
