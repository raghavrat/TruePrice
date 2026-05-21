interface Props {
  label: string;
  value: string;
  sub?: string;
  accent?: string;
}

export function MetricCard({ label, value, sub, accent = 'text-gray-900' }: Props) {
  return (
    <div className="rounded-xl bg-white p-3 shadow-sm">
      <div className="text-xs font-medium text-gray-500">{label}</div>
      <div className={`mt-1 text-lg font-bold ${accent}`}>{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-gray-400">{sub}</div>}
    </div>
  );
}
