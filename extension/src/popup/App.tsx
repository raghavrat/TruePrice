import { useEffect, useState } from 'react';
import { RANGE_LABELS, TAGLINE } from '../lib/copy';
import type { TimeRange, TotalsResponse } from '../lib/types';
import { CategoryBreakdown } from './components/CategoryBreakdown';
import { TimeRangeTabs } from './components/TimeRangeTabs';
import { TopSitesList } from './components/TopSitesList';
import { TotalImpact } from './components/TotalImpact';

const METHODOLOGY_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined ?? 'http://localhost:3000') +
  '/methodology';

export default function App() {
  const [range, setRange] = useState<TimeRange>('day');
  const [data, setData] = useState<TotalsResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    chrome.runtime
      .sendMessage({ type: 'GET_TOTALS', range })
      .then((res: TotalsResponse) => {
        if (active) {
          setData(res);
          setLoading(false);
        }
      })
      .catch(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [range]);

  return (
    <div className="w-[360px] bg-gray-50 p-4 text-gray-900">
      <header className="mb-3">
        <div className="flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-emerald-500" />
          <h1 className="text-base font-bold">TruePrice</h1>
        </div>
        <p className="mt-0.5 text-[11px] text-gray-400">{TAGLINE}</p>
      </header>

      <TimeRangeTabs value={range} onChange={setRange} />

      <p className="mt-3 mb-2 text-xs font-medium text-gray-500">{RANGE_LABELS[range]}</p>

      {loading || !data ? (
        <div className="py-10 text-center text-xs text-gray-400">Loading…</div>
      ) : (
        <div className="space-y-3">
          <TotalImpact totals={data.totals} />
          <CategoryBreakdown byCategory={data.byCategory} />
          <div>
            <p className="mb-1 text-xs font-medium text-gray-500">Top sites</p>
            <TopSitesList sites={data.topSites} />
          </div>
        </div>
      )}

      <footer className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3 text-[11px] text-gray-400">
        <button
          className="hover:text-gray-700"
          onClick={() => chrome.runtime.openOptionsPage()}
        >
          Settings
        </button>
        <a
          href={METHODOLOGY_URL}
          target="_blank"
          rel="noreferrer"
          className="hover:text-gray-700"
        >
          How we calculate
        </a>
      </footer>
    </div>
  );
}
