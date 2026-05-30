type StatsCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function StatsCard({ label, value, detail }: StatsCardProps) {
  return (
    <div className="rounded-lg border border-ink/10 bg-white p-5 shadow-sm">
      <p className="text-sm font-black uppercase tracking-[0.14em] text-ink/45">
        {label}
      </p>
      <p className="mt-3 text-3xl font-black tracking-[0] text-ink">{value}</p>
      {detail ? <p className="mt-2 text-sm font-semibold text-ink/55">{detail}</p> : null}
    </div>
  );
}
