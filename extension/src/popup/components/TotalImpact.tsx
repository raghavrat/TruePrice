import {
  co2Equivalence,
  energyEquivalence,
  formatCo2,
  formatKwh,
  formatLand,
  formatWater,
  waterEquivalence,
} from '../../lib/copy';
import type { ImpactTotals } from '../../lib/types';
import { MetricCard } from './MetricCard';

export function TotalImpact({ totals }: { totals: ImpactTotals }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <MetricCard
        label="Water"
        value={formatWater(totals.litersWater)}
        sub={waterEquivalence(totals.litersWater)}
        accent="text-blue-600"
      />
      <MetricCard
        label="CO₂"
        value={formatCo2(totals.gco2)}
        sub={co2Equivalence(totals.gco2)}
        accent="text-amber-600"
      />
      <MetricCard
        label="Energy"
        value={formatKwh(totals.kwh)}
        sub={energyEquivalence(totals.kwh)}
        accent="text-emerald-600"
      />
      <MetricCard label="Land" value={formatLand(totals.m2Land)} accent="text-stone-600" />
    </div>
  );
}
