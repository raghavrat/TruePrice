import type { Category, DomainProfile } from './types';
import { WH_PER_MB } from './coefficients';

type SeedSpec = {
  category: Category;
  whPerMinuteActive: number;
  whPerMbTransferred?: number;
  co2Multiplier?: number;
  waterMultiplier?: number;
  landMultiplier?: number;
  confidence?: number;
};

// Hardcoded profiles for the high-traffic head of the web, so the common case
// never costs an AI call. Anything not listed falls through to the AI profiler.
// wh/min figures are rough but defensible; refine on the methodology page.
const SEED: Record<string, SeedSpec> = {
  // Video streaming — energy dominated by active watch time (HD).
  'youtube.com': { category: 'video_streaming', whPerMinuteActive: 4.5, confidence: 0.8 },
  'netflix.com': { category: 'video_streaming', whPerMinuteActive: 6.0, confidence: 0.8 },
  'twitch.tv': { category: 'video_streaming', whPerMinuteActive: 5.5, confidence: 0.8 },
  'tiktok.com': { category: 'video_streaming', whPerMinuteActive: 4.0, confidence: 0.75 },
  'hulu.com': { category: 'video_streaming', whPerMinuteActive: 6.0, confidence: 0.75 },
  'disneyplus.com': { category: 'video_streaming', whPerMinuteActive: 6.0, confidence: 0.75 },
  'vimeo.com': { category: 'video_streaming', whPerMinuteActive: 4.0, confidence: 0.7 },

  // LLM / AI — heavy server-side inference per query; time is a proxy for query volume.
  'chat.openai.com': { category: 'llm_ai', whPerMinuteActive: 9.0, confidence: 0.7 },
  'chatgpt.com': { category: 'llm_ai', whPerMinuteActive: 9.0, confidence: 0.7 },
  'claude.ai': { category: 'llm_ai', whPerMinuteActive: 9.0, confidence: 0.7 },
  'gemini.google.com': { category: 'llm_ai', whPerMinuteActive: 8.0, confidence: 0.7 },
  'perplexity.ai': { category: 'llm_ai', whPerMinuteActive: 8.0, confidence: 0.65 },
  'midjourney.com': { category: 'llm_ai', whPerMinuteActive: 12.0, confidence: 0.6 },

  // Crypto / Web3 — flagged high.
  'coinbase.com': { category: 'crypto', whPerMinuteActive: 3.0, co2Multiplier: 1.5, confidence: 0.5 },
  'binance.com': { category: 'crypto', whPerMinuteActive: 3.0, co2Multiplier: 1.5, confidence: 0.5 },

  // Social — autoplay video bumps energy above static browsing.
  'facebook.com': { category: 'social', whPerMinuteActive: 2.5, confidence: 0.7 },
  'instagram.com': { category: 'social', whPerMinuteActive: 3.5, confidence: 0.7 },
  'x.com': { category: 'social', whPerMinuteActive: 2.5, confidence: 0.7 },
  'twitter.com': { category: 'social', whPerMinuteActive: 2.5, confidence: 0.7 },
  'reddit.com': { category: 'social', whPerMinuteActive: 1.8, confidence: 0.7 },
  'linkedin.com': { category: 'social', whPerMinuteActive: 1.8, confidence: 0.7 },
  'pinterest.com': { category: 'social', whPerMinuteActive: 2.0, confidence: 0.65 },
  'snapchat.com': { category: 'social', whPerMinuteActive: 3.0, confidence: 0.6 },

  // Search — light pages, low active energy.
  'google.com': { category: 'search', whPerMinuteActive: 1.0, confidence: 0.8 },
  'bing.com': { category: 'search', whPerMinuteActive: 1.0, confidence: 0.75 },
  'duckduckgo.com': { category: 'search', whPerMinuteActive: 0.8, confidence: 0.75 },

  // E-commerce — image-heavy but mostly static.
  'amazon.com': { category: 'ecommerce', whPerMinuteActive: 1.5, confidence: 0.75 },
  'ebay.com': { category: 'ecommerce', whPerMinuteActive: 1.5, confidence: 0.7 },
  'etsy.com': { category: 'ecommerce', whPerMinuteActive: 1.5, confidence: 0.7 },
  'walmart.com': { category: 'ecommerce', whPerMinuteActive: 1.5, confidence: 0.7 },

  // News — text + ads + some media.
  'nytimes.com': { category: 'news', whPerMinuteActive: 1.5, confidence: 0.7 },
  'cnn.com': { category: 'news', whPerMinuteActive: 2.0, confidence: 0.7 },
  'bbc.com': { category: 'news', whPerMinuteActive: 1.5, confidence: 0.7 },
  'theguardian.com': { category: 'news', whPerMinuteActive: 1.5, confidence: 0.7 },

  // Productivity / generic-but-common — mostly time-driven but light.
  'github.com': { category: 'generic', whPerMinuteActive: 1.2, confidence: 0.7 },
  'stackoverflow.com': { category: 'generic', whPerMinuteActive: 1.0, confidence: 0.7 },
  'wikipedia.org': { category: 'generic', whPerMinuteActive: 0.8, confidence: 0.75 },
  'docs.google.com': { category: 'generic', whPerMinuteActive: 1.5, confidence: 0.7 },
  'notion.so': { category: 'generic', whPerMinuteActive: 1.5, confidence: 0.65 },
};

function expand(domain: string, spec: SeedSpec): DomainProfile {
  return {
    domain,
    category: spec.category,
    whPerMinuteActive: spec.whPerMinuteActive,
    whPerMbTransferred: spec.whPerMbTransferred ?? WH_PER_MB,
    co2Multiplier: spec.co2Multiplier ?? 1,
    waterMultiplier: spec.waterMultiplier ?? 1,
    landMultiplier: spec.landMultiplier ?? 1,
    confidence: spec.confidence ?? 0.7,
    source: 'seed',
  };
}

export const SEED_PROFILES: Record<string, DomainProfile> = Object.fromEntries(
  Object.entries(SEED).map(([domain, spec]) => [domain, expand(domain, spec)]),
);

/** Look up a seed profile by exact domain or its registrable parent (one level up). */
export function getSeedProfile(domain: string): DomainProfile | undefined {
  if (SEED_PROFILES[domain]) return SEED_PROFILES[domain];
  const parts = domain.split('.');
  while (parts.length > 2) {
    parts.shift();
    const parent = parts.join('.');
    if (SEED_PROFILES[parent]) return SEED_PROFILES[parent];
  }
  return undefined;
}
