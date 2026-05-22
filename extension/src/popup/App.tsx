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

type Status = 'loading' | 'ready' | 'error';

export default function App() {
  const [range, setRange] = useState<TimeRange>('day');
  const [data, setData] = useState<TotalsResponse | null>(null);
  const [status, setStatus] = useState<Status>('loading');

  useEffect(() => {
    let active = true;
    setStatus('loading');

    // Guard against the service worker never replying (e.g. it failed to load),
    // so the popup shows an error instead of spinning forever.
    const timeout = setTimeout(() => {
      if (active) setStatus('error');
    }, 4000);

    chrome.runtime
      .sendMessage({ type: 'GET_TOTALS', range })
      .then((res: TotalsResponse | undefined) => {
        if (!active) return;
        clearTimeout(timeout);
        if (res) {
          setData(res);
          setStatus('ready');
        } else {
          setStatus('error');
        }
      })
      .catch(() => {
        if (!active) return;
        clearTimeout(timeout);
        setStatus('error');
      });

    return () => {
      active = false;
      clearTimeout(timeout);
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

      {status === 'loading' && (
        <div className="py-10 text-center text-xs text-gray-400">Loading…</div>
      )}

      {status === 'error' && (
        <div className="py-8 text-center text-xs text-gray-500">
          <p className="font-medium text-gray-700">Couldn&apos;t reach the tracker.</p>
          <p className="mt-1">
            The background service worker isn&apos;t responding. Try reloading the
            extension at <span className="font-mono">chrome://extensions</span>.
          </p>
        </div>
      )}

      {status === 'ready' && data && (
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
