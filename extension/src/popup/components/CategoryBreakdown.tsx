import { CATEGORY_LABELS, type Category, type ImpactTotals } from '../../lib/types';

const COLORS: Record<Category, string> = {
  video_streaming: 'bg-red-500',
  llm_ai: 'bg-violet-500',
  crypto: 'bg-orange-500',
  social: 'bg-pink-500',
  search: 'bg-sky-500',
  ecommerce: 'bg-teal-500',
  news: 'bg-amber-500',
  generic: 'bg-gray-400',
};

export function CategoryBreakdown({
  byCategory,
}: {
  byCategory: Record<Category, ImpactTotals>;
}) {
  const entries = (Object.entries(byCategory) as [Category, ImpactTotals][])
    .filter(([, t]) => t.kwh > 0)
    .sort((a, b) => b[1].kwh - a[1].kwh);

  const total = entries.reduce((sum, [, t]) => sum + t.kwh, 0);
  if (total === 0) return null;

  return (
    <div>
      <div className="flex h-2 overflow-hidden rounded-full bg-gray-200">
        {entries.map(([cat, t]) => (
          <div
            key={cat}
            className={COLORS[cat]}
            style={{ width: `${(t.kwh / total) * 100}%` }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {entries.map(([cat, t]) => (
          <div key={cat} className="flex items-center gap-1 text-[11px] text-gray-600">
            <span className={`h-2 w-2 rounded-full ${COLORS[cat]}`} />
            {CATEGORY_LABELS[cat]} {Math.round((t.kwh / total) * 100)}%
          </div>
        ))}
      </div>
    </div>
  );
}
