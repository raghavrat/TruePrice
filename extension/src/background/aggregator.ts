import { getSettings, getUsage } from '../lib/storage';
import { hoursInRange } from '../lib/timeBuckets';
import type {
  Category,
  DomainImpact,
  DomainUsage,
  ImpactTotals,
  SiteImpactResponse,
  TimeRange,
  TotalsResponse,
} from '../lib/types';
import { computeImpact } from './calculator';
import { resolveProfile } from './profileResolver';

const ALL_CATEGORIES: Category[] = [
  'video_streaming',
  'llm_ai',
  'crypto',
  'social',
  'search',
  'ecommerce',
  'news',
  'generic',
];

function emptyTotals(): ImpactTotals {
  return { kwh: 0, gco2: 0, litersWater: 0, m2Land: 0 };
}

function addInto(target: ImpactTotals, src: ImpactTotals): void {
  target.kwh += src.kwh;
  target.gco2 += src.gco2;
  target.litersWater += src.litersWater;
  target.m2Land += src.m2Land;
}

/** Collapse the hourly ledger into per-domain usage for the requested window. */
async function usageForRange(range: TimeRange): Promise<DomainUsage[]> {
  const usage = await getUsage();
  const window = new Set(hoursInRange(range).map(String));
  const out: DomainUsage[] = [];
  for (const [domain, byHour] of Object.entries(usage)) {
    let a = 0;
    let b = 0;
    let v = 0;
    for (const [hourKey, bucket] of Object.entries(byHour)) {
      if (window.has(hourKey)) {
        a += bucket.a;
        b += bucket.b;
        v += bucket.v;
      }
    }
    if (a > 0 || b > 0 || v > 0) {
      out.push({ domain, activeSeconds: a, bytes: b, visitCount: v });
    }
  }
  return out;
}

export async function buildTotals(range: TimeRange): Promise<TotalsResponse> {
  const { gridRegion } = await getSettings();
  const usageList = await usageForRange(range);

  const impacts: DomainImpact[] = [];
  for (const usage of usageList) {
    // Read path: do not trigger AI enqueue here; the live trackers already do.
    const profile = await resolveProfile(usage.domain, { enqueueIfMissing: false });
    impacts.push(computeImpact(profile, usage, gridRegion));
  }

  const totals = emptyTotals();
  const byCategory = Object.fromEntries(
    ALL_CATEGORIES.map((c) => [c, emptyTotals()]),
  ) as Record<Category, ImpactTotals>;

  for (const impact of impacts) {
    addInto(totals, impact);
    addInto(byCategory[impact.category], impact);
  }

  const topSites = impacts.sort((a, b) => b.kwh - a.kwh).slice(0, 8);

  return { range, totals, topSites, byCategory };
}

export async function buildSiteImpact(domain: string): Promise<SiteImpactResponse> {
  const { gridRegion } = await getSettings();
  const [usage] = (await usageForRange('day')).filter((u) => u.domain === domain);
  const profile = await resolveProfile(domain, { enqueueIfMissing: true });
  const impact = computeImpact(
    profile,
    usage ?? { domain, activeSeconds: 0, bytes: 0, visitCount: 0 },
    gridRegion,
  );
  return {
    domain,
    category: profile.category,
    todayKwh: impact.kwh,
    todayLitersWater: impact.litersWater,
    todayGco2: impact.gco2,
    confidence: profile.confidence,
  };
}
