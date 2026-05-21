import { addUsage } from '../lib/storage';
import { epochHour } from '../lib/timeBuckets';

// In-progress active-viewing tick, persisted to session storage so it survives
// service-worker restarts.
interface Tick {
  domain: string | null;
  ts: number;
  idle: boolean;
}

const TICK_KEY = 'activeTick';
const MAX_SEGMENT_SECONDS = 3600; // clamp pathological gaps (e.g. machine sleep)

async function getTick(): Promise<Tick> {
  const res = await chrome.storage.session.get(TICK_KEY);
  return (res[TICK_KEY] as Tick) ?? { domain: null, ts: Date.now(), idle: false };
}

async function setTick(tick: Tick): Promise<void> {
  await chrome.storage.session.set({ [TICK_KEY]: tick });
}

/** Bank the active time elapsed since the last tick, then advance the clock. */
export async function flushActive(now: number = Date.now()): Promise<void> {
  const tick = await getTick();
  if (tick.domain && !tick.idle) {
    const seconds = Math.min(Math.max((now - tick.ts) / 1000, 0), MAX_SEGMENT_SECONDS);
    if (seconds > 0) {
      await addUsage(tick.domain, epochHour(tick.ts), { a: seconds });
    }
  }
  await setTick({ ...tick, ts: now });
}

/** Switch which domain is being actively viewed (null = no countable tab). */
export async function setActiveDomain(
  domain: string | null,
  now: number = Date.now(),
): Promise<void> {
  await flushActive(now);
  const tick = await getTick();
  await setTick({ domain, ts: now, idle: tick.idle });
}

/** Pause/resume counting based on the OS idle state. */
export async function setIdle(idle: boolean, now: number = Date.now()): Promise<void> {
  await flushActive(now);
  const tick = await getTick();
  await setTick({ ...tick, idle, ts: now });
}

/** Count a page visit for a domain in the current hour bucket. */
export async function recordVisit(domain: string): Promise<void> {
  await addUsage(domain, epochHour(), { v: 1 });
}
