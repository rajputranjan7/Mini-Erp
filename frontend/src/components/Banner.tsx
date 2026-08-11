export function ErrorBanner({ message }: { message: string }) {
  if (!message) return null;
  return (
    <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">{message}</div>
  );
}

export function EmptyState({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 py-16 text-center">
      <p className="font-display text-sm font-semibold text-slate-600">{title}</p>
      {subtitle && <p className="text-sm text-slate-400">{subtitle}</p>}
    </div>
  );
}
