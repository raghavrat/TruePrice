export type Category =
  | 'video_streaming'
  | 'llm_ai'
  | 'crypto'
  | 'social'
  | 'search'
  | 'ecommerce'
  | 'news'
  | 'generic';

export const CATEGORY_LABELS: Record<Category, string> = {
  video_streaming: 'Video',
  llm_ai: 'AI',
  crypto: 'Crypto',
  social: 'Social',
  search: 'Search',
  ecommerce: 'Shopping',
  news: 'News',
  generic: 'Other',
};

export type ProfileSource = 'seed' | 'ai' | 'fallback' | 'manual';

/** Resource profile for a domain. Energy is driven by active time and/or bytes. */
export interface DomainProfile {
  domain: string;
  category: Category;
  /** Wh consumed per minute the tab is actively viewed (for time-heavy sites). */
  whPerMinuteActive: number;
  /** Wh consumed per MB transferred (for byte-heavy sites). */
  whPerMbTransferred: number;
  co2Multiplier: number;
  waterMultiplier: number;
  landMultiplier: number;
  /** 0..1 confidence in the estimate. */
  confidence: number;
  source: ProfileSource;
}

/** Raw per-domain usage accumulated over a period. */
export interface DomainUsage {
  domain: string;
  visitCount: number;
  activeSeconds: number;
  bytes: number;
}

export interface ImpactTotals {
  kwh: number;
  gco2: number;
  litersWater: number;
  m2Land: number;
}

/** Computed impact for a single domain over a period. */
export interface DomainImpact extends ImpactTotals {
  domain: string;
  category: Category;
  activeSeconds: number;
  bytes: number;
  visitCount: number;
}

export type TimeRange = 'hour' | 'day' | 'week' | 'month';

/** Persisted ledger row: usage for one domain on one local day. */
export interface UsageRecord {
  day: string; // YYYY-MM-DD (local time)
  domain: string;
  visitCount: number;
  activeSeconds: number;
  bytes: number;
}

export interface Settings {
  syncEnabled: boolean;
  gridRegion: string; // e.g. "global", "us", "eu"
  optOutDomains: string[];
}

/** Messages between popup/content and the background service worker. */
export type RuntimeMessage =
  | { type: 'GET_TOTALS'; range: TimeRange }
  | { type: 'GET_SITE_IMPACT'; domain: string }
  | { type: 'GET_BADGE' }
  | { type: 'PAGE_BYTES'; bytes: number }
  | { type: 'GET_SETTINGS' }
  | { type: 'SET_SETTINGS'; settings: Partial<Settings> };

export interface TotalsResponse {
  range: TimeRange;
  totals: ImpactTotals;
  topSites: DomainImpact[];
  byCategory: Record<Category, ImpactTotals>;
}

export interface SiteImpactResponse {
  domain: string;
  category: Category;
  todayKwh: number;
  todayLitersWater: number;
  todayGco2: number;
  confidence: number;
}
