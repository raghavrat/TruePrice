import type { TimeRange } from '../../lib/types';

const RANGES: { value: TimeRange; label: string }[] = [
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'week', label: 'Week' },
  { value: 'month', label: 'Month' },
];

interface Props {
  value: TimeRange;
  onChange: (range: TimeRange) => void;
}

export function TimeRangeTabs({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 rounded-lg bg-gray-200 p-1">
      {RANGES.map((r) => (
        <button
          key={r.value}
          onClick={() => onChange(r.value)}
          className={`flex-1 rounded-md px-2 py-1 text-xs font-medium transition ${
            value === r.value
              ? 'bg-white text-gray-900 shadow'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}
