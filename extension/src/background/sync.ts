import { getSettings, getUsage, setLastSyncHour } from '../lib/storage';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { dayKeyFromEpochHour, epochHour } from '../lib/timeBuckets';
import type { Category, ImpactTotals } from '../lib/types';
import { computeImpact } from './calculator';
import { resolveProfile } from './profileResolver';

type DayCategoryMap = Record<string, Record<string, ImpactTotals>>;

function bump(map: DayCategoryMap, day: string, category: Category, impact: ImpactTotals): void {
  const dayMap = (map[day] ??= {});
  const totals = (dayMap[category] ??= { kwh: 0, gco2: 0, litersWater: 0, m2Land: 0 });
  totals.kwh += impact.kwh;
  totals.gco2 += impact.gco2;
  totals.litersWater += impact.litersWater;
  totals.m2Land += impact.m2Land;
}

/** Push per-day per-category aggregates to Supabase when signed in + opted in. */
export async function runSync(): Promise<void> {
  if (!isSupabaseConfigured || !supabase) return;

  const settings = await getSettings();
  if (!settings.syncEnabled) return;

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const usage = await getUsage();
  const agg: DayCategoryMap = {};

  for (const [domain, byHour] of Object.entries(usage)) {
    const profile = await resolveProfile(domain, { enqueueIfMissing: false });
    for (const [hourKey, bucket] of Object.entries(byHour)) {
      const impact = computeImpact(
        profile,
        { domain, activeSeconds: bucket.a, bytes: bucket.b, visitCount: bucket.v },
        settings.gridRegion,
      );
      bump(agg, dayKeyFromEpochHour(Number(hourKey)), profile.category, impact);
    }
  }

  const rows = Object.entries(agg).flatMap(([day, cats]) =>
    Object.entries(cats).map(([category, totals]) => ({
      user_id: user.id,
      day,
      category,
      kwh: totals.kwh,
      gco2: totals.gco2,
      liters_water: totals.litersWater,
      m2_land: totals.m2Land,
    })),
  );

  if (rows.length > 0) {
    const { error } = await supabase
      .from('daily_aggregates')
      .upsert(rows, { onConflict: 'user_id,day,category' });
    if (error) {
      console.warn('[trueprice] sync failed', error.message);
      return;
    }
  }
  await setLastSyncHour(epochHour());
}
