import type { DomainProfile, Settings } from './types';
import { pruneCutoffHour } from './timeBuckets';

/** Compact per-hour usage bucket: a=activeSeconds, b=bytes, v=visitCount. */
export interface HourBucket {
  a: number;
  b: number;
  v: number;
}

/** domain -> epochHour(string) -> bucket */
export type UsageMap = Record<string, Record<string, HourBucket>>;

const KEYS = {
  usage: 'usage',
  profiles: 'profiles',
  pending: 'pendingDomains',
  settings: 'settings',
  lastSyncHour: 'lastSyncHour',
} as const;

export const DEFAULT_SETTINGS: Settings = {
  syncEnabled: false,
  gridRegion: 'global',
  optOutDomains: [],
};

async function get<T>(key: string, fallback: T): Promise<T> {
  const res = await chrome.storage.local.get(key);
  return (res[key] as T) ?? fallback;
}

async function set(key: string, value: unknown): Promise<void> {
  await chrome.storage.local.set({ [key]: value });
}

// --- Usage ledger ----------------------------------------------------------

export async function getUsage(): Promise<UsageMap> {
  return get<UsageMap>(KEYS.usage, {});
}

/** Accumulate usage for a domain in the given hour bucket. */
export async function addUsage(
  domain: string,
  hour: number,
  delta: Partial<HourBucket>,
): Promise<void> {
  const usage = await getUsage();
  const byHour = (usage[domain] ??= {});
  const key = String(hour);
  const bucket = (byHour[key] ??= { a: 0, b: 0, v: 0 });
  bucket.a += delta.a ?? 0;
  bucket.b += delta.b ?? 0;
  bucket.v += delta.v ?? 0;
  await set(KEYS.usage, usage);
}

/** Drop buckets older than the longest range to keep storage bounded. */
export async function pruneUsage(now: number = Date.now()): Promise<void> {
  const usage = await getUsage();
  const cutoff = pruneCutoffHour(now);
  let changed = false;
  for (const domain of Object.keys(usage)) {
    const byHour = usage[domain];
    for (const hourKey of Object.keys(byHour)) {
      if (Number(hourKey) < cutoff) {
        delete byHour[hourKey];
        changed = true;
      }
    }
    if (Object.keys(byHour).length === 0) delete usage[domain];
  }
  if (changed) await set(KEYS.usage, usage);
}

// --- Profile cache ---------------------------------------------------------

export async function getProfiles(): Promise<Record<string, DomainProfile>> {
  return get<Record<string, DomainProfile>>(KEYS.profiles, {});
}

export async function getCachedProfile(domain: string): Promise<DomainProfile | undefined> {
  const profiles = await getProfiles();
  return profiles[domain];
}

export async function setProfiles(profiles: DomainProfile[]): Promise<void> {
  const existing = await getProfiles();
  for (const p of profiles) existing[p.domain] = p;
  await set(KEYS.profiles, existing);
}

// --- Pending (unknown) domain queue ---------------------------------------

export async function getPendingDomains(): Promise<string[]> {
  return get<string[]>(KEYS.pending, []);
}

export async function addPendingDomain(domain: string): Promise<void> {
  const pending = await getPendingDomains();
  if (!pending.includes(domain)) {
    pending.push(domain);
    await set(KEYS.pending, pending);
  }
}

export async function clearPendingDomains(domains: string[]): Promise<void> {
  const pending = await getPendingDomains();
  const remaining = pending.filter((d) => !domains.includes(d));
  await set(KEYS.pending, remaining);
}

// --- Settings + sync state -------------------------------------------------

export async function getSettings(): Promise<Settings> {
  return { ...DEFAULT_SETTINGS, ...(await get<Partial<Settings>>(KEYS.settings, {})) };
}

export async function setSettings(patch: Partial<Settings>): Promise<Settings> {
  const next = { ...(await getSettings()), ...patch };
  await set(KEYS.settings, next);
  return next;
}

export async function getLastSyncHour(): Promise<number> {
  return get<number>(KEYS.lastSyncHour, 0);
}

export async function setLastSyncHour(hour: number): Promise<void> {
  await set(KEYS.lastSyncHour, hour);
}
