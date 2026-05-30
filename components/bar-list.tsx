type BarListItem = {
  label: string;
  value: number;
};

type BarListProps = {
  title: string;
  items: BarListItem[];
};

export function BarList({ title, items }: BarListProps) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <section className="rounded-xl glass-card p-5">
      <h2 className="text-base font-black tracking-[-0.02em] text-text">{title}</h2>
      <div className="mt-5 space-y-3.5">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.label}>
              <div className="mb-1.5 flex items-center justify-between gap-3 text-xs font-bold text-muted">
                <span className="truncate">{item.label}</span>
                <span className="shrink-0 tabular-nums">{item.value}</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
                <div
                  className="h-full rounded-full bg-accent transition-all duration-500"
                  style={{ width: `${Math.max((item.value / max) * 100, 4)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm font-semibold text-muted/50">
            No data yet. Sync your movies to see stats here.
          </p>
        )}
      </div>
    </section>
  );
}
