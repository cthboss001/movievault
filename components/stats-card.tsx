type StatsCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function StatsCard({ label, value, detail }: StatsCardProps) {
  return (
    <div className="rounded-xl border border-ink/8 bg-white p-5 shadow-sm transition hover:shadow-soft">
      <p className="text-xs font-black uppercase tracking-[0.16em] text-ink/40">
        {label}
      </p>
      <p className="mt-3 text-4xl font-black tracking-[-0.03em] text-ink">
        {value}
      </p>
      {detail ? (
        <p className="mt-2 text-xs font-semibold text-ink/45">{detail}</p>
      ) : null}
    </div>
  );
}
