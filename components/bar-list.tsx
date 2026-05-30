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
    <section className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <h2 className="text-lg font-black tracking-[0] text-ink">{title}</h2>
      <div className="mt-5 space-y-4">
        {items.length > 0 ? (
          items.map((item) => (
            <div key={item.label}>
              <div className="mb-2 flex items-center justify-between gap-3 text-sm font-bold text-ink/70">
                <span className="truncate">{item.label}</span>
                <span>{item.value}</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-ink/10">
                <div
                  className="h-full rounded-full bg-vault"
                  style={{ width: `${Math.max((item.value / max) * 100, 5)}%` }}
                />
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm font-semibold text-ink/55">
            No watch data available yet.
          </p>
        )}
      </div>
    </section>
  );
}
