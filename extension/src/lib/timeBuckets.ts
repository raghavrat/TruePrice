import type { TimeRange } from './types';

const MS_PER_HOUR = 3_600_000;

export const RANGE_HOURS: Record<TimeRange, number> = {
  hour: 1,
  day: 24,
  week: 168,
  month: 720,
};

/** Integer hour bucket since the Unix epoch (UTC). Usage is accumulated per bucket. */
export function epochHour(ts: number = Date.now()): number {
  return Math.floor(ts / MS_PER_HOUR);
}

/** All hour buckets covered by a rolling range ending now. */
export function hoursInRange(range: TimeRange, now: number = Date.now()): number[] {
  const current = epochHour(now);
  const span = RANGE_HOURS[range];
  const out: number[] = [];
  for (let h = current - span + 1; h <= current; h++) out.push(h);
  return out;
}

/** The oldest hour bucket worth retaining (anything past the longest range). */
export function pruneCutoffHour(now: number = Date.now()): number {
  return epochHour(now) - RANGE_HOURS.month;
}

/** Local YYYY-MM-DD for a given hour bucket — used for Supabase daily rollups. */
export function dayKeyFromEpochHour(h: number): string {
  const d = new Date(h * MS_PER_HOUR);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
