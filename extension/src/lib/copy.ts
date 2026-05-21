import type { ImpactTotals, TimeRange } from './types';

export const RANGE_LABELS: Record<TimeRange, string> = {
  hour: 'Past hour',
  day: 'Today',
  week: 'This week',
  month: 'This month',
};

export const TAGLINE = 'The natural-resource cost of your browsing.';

// --- Number formatting -----------------------------------------------------

export function formatKwh(kwh: number): string {
  if (kwh < 0.001) return `${Math.round(kwh * 1_000_000)} mWh`;
  if (kwh < 1) return `${Math.round(kwh * 1000)} Wh`;
  return `${kwh.toFixed(kwh < 10 ? 2 : 1)} kWh`;
}

export function formatWater(liters: number): string {
  if (liters < 1) return `${Math.round(liters * 1000)} mL`;
  if (liters < 1000) return `${liters.toFixed(liters < 10 ? 1 : 0)} L`;
  return `${(liters / 1000).toFixed(1)} kL`;
}

export function formatCo2(grams: number): string {
  if (grams < 1000) return `${Math.round(grams)} g`;
  return `${(grams / 1000).toFixed(grams < 10_000 ? 2 : 1)} kg`;
}

export function formatLand(m2: number): string {
  if (m2 < 1) return `${(m2 * 10_000).toFixed(0)} cm²`;
  return `${m2.toFixed(2)} m²`;
}

// --- Real-world equivalences (fixed constant mappings) ---------------------

const WH_PER_PHONE_CHARGE = 12; // ~12 Wh for a full smartphone charge
const KWH_PER_KETTLE_BOIL = 0.11; // boiling 1 L
const LITERS_PER_BOTTLE = 0.5;
const LITERS_PER_BATHTUB = 150;
const GCO2_PER_KM_DRIVEN = 170; // average petrol car

/** Friendly, deterministic equivalence string for an energy figure. */
export function energyEquivalence(kwh: number): string {
  const charges = (kwh * 1000) / WH_PER_PHONE_CHARGE;
  if (charges >= 1) return `≈ ${charges.toFixed(charges < 10 ? 1 : 0)} phone charges`;
  const boils = kwh / KWH_PER_KETTLE_BOIL;
  return `≈ ${boils.toFixed(2)} kettle boils`;
}

/** Friendly, deterministic equivalence string for a water figure. */
export function waterEquivalence(liters: number): string {
  if (liters >= LITERS_PER_BATHTUB) {
    return `≈ ${(liters / LITERS_PER_BATHTUB).toFixed(1)} bathtubs`;
  }
  const bottles = liters / LITERS_PER_BOTTLE;
  return `≈ ${bottles.toFixed(bottles < 10 ? 1 : 0)} water bottles`;
}

/** Friendly, deterministic equivalence string for a CO₂ figure. */
export function co2Equivalence(grams: number): string {
  const km = grams / GCO2_PER_KM_DRIVEN;
  if (km < 1) return `≈ ${(km * 1000).toFixed(0)} m driven`;
  return `≈ ${km.toFixed(km < 10 ? 1 : 0)} km driven`;
}

/** One-line summary for the popup header. Constant template, numbers interpolated. */
export function headerSummary(range: TimeRange, t: ImpactTotals): string {
  return `${RANGE_LABELS[range]}: ${formatWater(t.litersWater)} water · ${formatCo2(
    t.gco2,
  )} CO₂ · ${formatKwh(t.kwh)}`;
}

/** Badge label shown on a page. */
export function badgeLabel(litersWater: number, kwh: number): string {
  return `${formatWater(litersWater)} · ${formatKwh(kwh)}`;
}
