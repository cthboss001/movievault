type StatsCardProps = {
  label: string;
  value: string;
  detail?: string;
};

export function StatsCard({ label, value, detail }: StatsCardProps) {
  return (
    <div className="rounded-xl glass-card p-5">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted">
        {label}
      </h3>
      <p className="mt-2 text-3xl font-black tracking-tight text-text">
        {value}
      </p>
      <p className="mt-1 text-xs font-semibold text-muted/70">{detail}</p>
    </div>
  );
}
