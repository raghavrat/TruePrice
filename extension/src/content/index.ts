import { badgeLabel } from '../lib/copy';
import type { SiteImpactResponse } from '../lib/types';
import { mountBadge, type Severity } from './badge';

// --- Byte accounting (PerformanceObserver) ---------------------------------

function sumEntries(entries: PerformanceEntryList): number {
  let total = 0;
  for (const e of entries) {
    total += (e as PerformanceResourceTiming).transferSize || 0;
  }
  return total;
}

let pendingBytes = 0;

function flushBytes(): void {
  if (pendingBytes <= 0) return;
  const bytes = pendingBytes;
  pendingBytes = 0;
  chrome.runtime.sendMessage({ type: 'PAGE_BYTES', bytes }).catch(() => {});
}

function startByteTracking(): void {
  // Initial document + resources already loaded.
  pendingBytes += sumEntries(performance.getEntriesByType('navigation'));
  pendingBytes += sumEntries(performance.getEntriesByType('resource'));

  try {
    const observer = new PerformanceObserver((list) => {
      pendingBytes += sumEntries(list.getEntries());
    });
    observer.observe({ type: 'resource', buffered: false });
  } catch {
    // PerformanceObserver unsupported — initial sum still counts.
  }

  setInterval(flushBytes, 15_000);
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushBytes();
  });
  window.addEventListener('pagehide', flushBytes);
  // Flush the initial load promptly.
  setTimeout(flushBytes, 3000);
}

// --- Badge -----------------------------------------------------------------

function severityOf(kwh: number): Severity {
  if (kwh < 0.01) return 'low';
  if (kwh < 0.1) return 'mid';
  return 'high';
}

async function refreshBadge(update: (label: string, severity: Severity) => void): Promise<void> {
  try {
    const impact = (await chrome.runtime.sendMessage({
      type: 'GET_BADGE',
    })) as SiteImpactResponse | null;
    if (impact) {
      update(badgeLabel(impact.todayLitersWater, impact.todayKwh), severityOf(impact.todayKwh));
    }
  } catch {
    // background asleep or page not trackable — leave badge as-is
  }
}

function startBadge(): void {
  const badge = mountBadge();
  if (!badge) return;
  void refreshBadge(badge.update);
  setInterval(() => void refreshBadge(badge.update), 20_000);
}

if (window.top === window.self) {
  startByteTracking();
  startBadge();
}
