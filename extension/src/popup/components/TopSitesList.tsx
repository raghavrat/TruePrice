import { formatKwh, formatWater } from '../../lib/copy';
import type { DomainImpact } from '../../lib/types';

export function TopSitesList({ sites }: { sites: DomainImpact[] }) {
  if (sites.length === 0) {
    return <p className="text-xs text-gray-400">No activity tracked yet — keep browsing.</p>;
  }
  return (
    <ul className="space-y-1">
      {sites.map((s) => (
        <li
          key={s.domain}
          className="flex items-center justify-between rounded-lg bg-white px-3 py-2 text-xs shadow-sm"
        >
          <span className="truncate font-medium text-gray-800">{s.domain}</span>
          <span className="ml-2 shrink-0 text-gray-500">
            {formatWater(s.litersWater)} · {formatKwh(s.kwh)}
          </span>
        </li>
      ))}
    </ul>
  );
}
