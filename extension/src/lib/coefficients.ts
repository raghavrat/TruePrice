import type { DomainProfile } from './types';

// Base environmental coefficients. Sources documented on the methodology page.
// All energy math uses decimal units (1 GB = 1000 MB, 1 kWh = 1000 Wh).

/** Sustainable Web Design model: ~0.81 kWh per GB of data transferred. */
export const KWH_PER_GB = 0.81;
/** Derived: Wh per MB. 0.81 kWh/GB → 0.81 Wh/MB. */
export const WH_PER_MB = KWH_PER_GB; // since 1 GB = 1000 MB and 1 kWh = 1000 Wh

/** Global average grid carbon intensity (IEA, ~2023): 480 gCO₂/kWh. */
export const GCO2_PER_KWH = 480;

/** Blended water use of generation + datacenter cooling: ~1.8 L/kWh. */
export const LITERS_WATER_PER_KWH = 1.8;

/** Land footprint of energy infrastructure (annualized, solar-equivalent): ~0.0009 m²/kWh. */
export const M2_LAND_PER_KWH = 0.0009;

/** Regional grid intensity multipliers relative to the global average. */
export const GRID_REGIONS: Record<string, number> = {
  global: 1.0,
  us: 0.78, // ~370 gCO₂/kWh
  eu: 0.52, // ~250 gCO₂/kWh
  in: 1.5, // ~720 gCO₂/kWh
  cn: 1.2, // ~580 gCO₂/kWh
};

/** Used when a domain is unknown and AI profiling is unavailable. Bytes-only. */
export const FALLBACK_PROFILE: Omit<DomainProfile, 'domain'> = {
  category: 'generic',
  whPerMinuteActive: 0,
  whPerMbTransferred: WH_PER_MB,
  co2Multiplier: 1,
  waterMultiplier: 1,
  landMultiplier: 1,
  confidence: 0.3,
  source: 'fallback',
};

/** Sanity bounds for validating AI-generated profiles before trusting them. */
export const PROFILE_BOUNDS = {
  whPerMinuteActive: { min: 0, max: 60 },
  whPerMbTransferred: { min: 0, max: 20 },
  multiplier: { min: 0.1, max: 10 },
} as const;
