import { badgeLabel } from '../lib/copy';
import type { SessionImpactResponse } from '../lib/types';
import { mountBadge, type Severity } from './badge';

// --- Extension-context safety ----------------------------------------------
// After the extension is reloaded/updated, content scripts in already-open tabs
// keep running but lose their connection. chrome.runtime.sendMessage then throws
// "Extension context invalidated" — synchronously, so .catch() can't help. Guard
// every call and tear down our timers once the context is gone.

const timers: ReturnType<typeof setInterval>[] = [];

function extensionAlive(): boolean {
  try {
    return Boolean(chrome.runtime?.id);
  } catch {
    return false;
  }
}

function teardown(): void {
  for (const t of timers) clearInterval(t);
  timers.length = 0;
}

async function safeSend<T>(message: unknown): Promise<T | undefined> {
  if (!extensionAlive()) {
    teardown();
    return undefined;
  }
  try {
    return (await chrome.runtime.sendMessage(message)) as T;
  } catch {
    if (!extensionAlive()) teardown();
    return undefined;
  }
}

// --- Session accounting ----------------------------------------------------
// Tracked per page load ("session"): cumulative bytes loaded and active seconds
// spent looking at this tab. The badge reflects only this current session.

function sumEntries(entries: PerformanceEntryList): number {
  let total = 0;
  for (const e of entries) {
    total += (e as PerformanceResourceTiming).transferSize || 0;
  }
  return total;
}

let pendingBytes = 0; // not yet flushed to the background's historical ledger
let sessionBytes = 0; // cumulative for this page load (badge)

function addBytes(n: number): void {
  if (n <= 0) return;
  pendingBytes += n;
  sessionBytes += n;
}

// Active time = wall-clock while this tab is visible.
let sessionActiveMs = 0;
let lastResume: number | null = document.visibilityState === 'visible' ? Date.now() : null;

function accrueActive(): void {
  if (lastResume !== null) {
    sessionActiveMs += Date.now() - lastResume;
    lastResume = Date.now();
  }
}

function sessionActiveSeconds(): number {
  accrueActive();
  return sessionActiveMs / 1000;
}

function flushBytes(): void {
  if (pendingBytes <= 0) return;
  const bytes = pendingBytes;
  pendingBytes = 0;
  void safeSend({ type: 'PAGE_BYTES', bytes });
}

function startSessionTracking(): void {
  // Initial document + resources already loaded.
  addBytes(sumEntries(performance.getEntriesByType('navigation')));
  addBytes(sumEntries(performance.getEntriesByType('resource')));

  try {
    const observer = new PerformanceObserver((list) => {
      addBytes(sumEntries(list.getEntries()));
    });
    observer.observe({ type: 'resource', buffered: false });
  } catch {
    // PerformanceObserver unsupported — initial sum still counts.
  }

  timers.push(setInterval(flushBytes, 15_000));

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
      lastResume = Date.now();
    } else {
      accrueActive();
      lastResume = null;
      flushBytes();
    }
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
  const impact = await safeSend<SessionImpactResponse | null>({
    type: 'GET_SESSION_IMPACT',
    activeSeconds: sessionActiveSeconds(),
    bytes: sessionBytes,
  });
  if (impact) {
    update(badgeLabel(impact.litersWater, impact.kwh), severityOf(impact.kwh));
  }
}

function startBadge(): void {
  const badge = mountBadge();
  if (!badge) return;
  void refreshBadge(badge.update);
  // Refresh often so the session figures climb visibly as you browse.
  timers.push(setInterval(() => void refreshBadge(badge.update), 5_000));
}

if (window.top === window.self) {
  startSessionTracking();
  startBadge();
}
