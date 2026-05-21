import {
  GCO2_PER_KWH,
  GRID_REGIONS,
  LITERS_WATER_PER_KWH,
  M2_LAND_PER_KWH,
} from '../lib/coefficients';
import type { DomainImpact, DomainProfile, DomainUsage } from '../lib/types';

/** Deterministic: apply a domain profile to accumulated usage. No AI here. */
export function computeImpact(
  profile: DomainProfile,
  usage: DomainUsage,
  gridRegion = 'global',
): DomainImpact {
  const energyWh =
    profile.whPerMinuteActive * (usage.activeSeconds / 60) +
    profile.whPerMbTransferred * (usage.bytes / 1_000_000);
  const kwh = energyWh / 1000;
  const gridMultiplier = GRID_REGIONS[gridRegion] ?? 1;

  return {
    domain: usage.domain,
    category: profile.category,
    kwh,
    gco2: kwh * GCO2_PER_KWH * gridMultiplier * profile.co2Multiplier,
    litersWater: kwh * LITERS_WATER_PER_KWH * profile.waterMultiplier,
    m2Land: kwh * M2_LAND_PER_KWH * profile.landMultiplier,
    activeSeconds: usage.activeSeconds,
    bytes: usage.bytes,
    visitCount: usage.visitCount,
  };
}
