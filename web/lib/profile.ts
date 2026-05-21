// Shared profile types + AI/validation logic for the /api/ai/profile route.
// Mirrors the extension's DomainProfile shape (camelCase) so the extension can
// consume responses directly.

export const CATEGORIES = [
  'video_streaming',
  'llm_ai',
  'crypto',
  'social',
  'search',
  'ecommerce',
  'news',
  'generic',
] as const;

export type Category = (typeof CATEGORIES)[number];

export interface DomainProfile {
  domain: string;
  category: Category;
  whPerMinuteActive: number;
  whPerMbTransferred: number;
  co2Multiplier: number;
  waterMultiplier: number;
  landMultiplier: number;
  confidence: number;
  source: 'ai' | 'fallback' | 'seed' | 'manual';
}

// Base coefficient context handed to the model so it returns values in our units.
const WH_PER_MB = 0.81; // Sustainable Web Design ≈ 0.81 kWh/GB

const BOUNDS = {
  whPerMinuteActive: { min: 0, max: 60 },
  whPerMbTransferred: { min: 0, max: 20 },
  multiplier: { min: 0.1, max: 10 },
};

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

export function fallbackProfile(domain: string): DomainProfile {
  return {
    domain,
    category: 'generic',
    whPerMinuteActive: 0,
    whPerMbTransferred: WH_PER_MB,
    co2Multiplier: 1,
    waterMultiplier: 1,
    landMultiplier: 1,
    confidence: 0.3,
    source: 'fallback',
  };
}

/** Coerce one raw model object into a valid, bounded DomainProfile. */
function sanitize(domain: string, raw: unknown): DomainProfile {
  const r = (raw ?? {}) as Record<string, unknown>;
  const category = CATEGORIES.includes(r.category as Category)
    ? (r.category as Category)
    : 'generic';
  return {
    domain,
    category,
    whPerMinuteActive: clamp(
      Number(r.whPerMinuteActive),
      BOUNDS.whPerMinuteActive.min,
      BOUNDS.whPerMinuteActive.max,
    ),
    whPerMbTransferred: clamp(
      Number(r.whPerMbTransferred ?? WH_PER_MB),
      BOUNDS.whPerMbTransferred.min,
      BOUNDS.whPerMbTransferred.max,
    ),
    co2Multiplier: clamp(Number(r.co2Multiplier ?? 1), BOUNDS.multiplier.min, BOUNDS.multiplier.max),
    waterMultiplier: clamp(
      Number(r.waterMultiplier ?? 1),
      BOUNDS.multiplier.min,
      BOUNDS.multiplier.max,
    ),
    landMultiplier: clamp(
      Number(r.landMultiplier ?? 1),
      BOUNDS.multiplier.min,
      BOUNDS.multiplier.max,
    ),
    confidence: clamp(Number(r.confidence ?? 0.5), 0, 1),
    source: 'ai',
  };
}

const SYSTEM_PROMPT = `You estimate the environmental resource intensity of websites for a browsing-impact tracker.
For each domain, return a JSON profile with these exact fields:
- category: one of ${CATEGORIES.join(', ')}
- whPerMinuteActive: watt-hours consumed per minute of ACTIVE viewing (server + network + device). Video ~3-6, AI chat ~8-12, social ~2-3, search/news ~1-2, generic ~0.5-1.5.
- whPerMbTransferred: watt-hours per MB transferred (baseline ${WH_PER_MB}).
- co2Multiplier, waterMultiplier, landMultiplier: 1.0 unless the workload is unusually carbon/water/land intensive (e.g. crypto higher).
- confidence: 0..1, your confidence in the estimate.
Respond ONLY with JSON of the form {"profiles":[{"domain":"...", ...}, ...]} covering every requested domain.`;

const MODEL = 'gpt-oss-120b';
const IONROUTER_URL = 'https://api.ionrouter.io/v1/chat/completions';

/** Call ionrouter (OpenAI-compatible) to profile a batch of domains. */
export async function profileWithAI(
  domains: string[],
  apiKey: string,
): Promise<DomainProfile[]> {
  const res = await fetch(IONROUTER_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: `Domains:\n${domains.join('\n')}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    throw new Error(`ionrouter ${res.status}: ${await res.text().catch(() => '')}`);
  }

  const data = (await res.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const content = data.choices?.[0]?.message?.content ?? '{}';

  let parsed: { profiles?: { domain?: string }[] };
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }

  const byDomain = new Map<string, unknown>();
  for (const p of parsed.profiles ?? []) {
    if (p?.domain) byDomain.set(String(p.domain).toLowerCase(), p);
  }

  // Ensure every requested domain gets a profile (fallback if the model skipped it).
  return domains.map((d) =>
    byDomain.has(d) ? sanitize(d, byDomain.get(d)) : fallbackProfile(d),
  );
}

// --- Supabase row mapping --------------------------------------------------

export interface ProfileRow {
  domain: string;
  category: string;
  wh_per_minute_active: number;
  wh_per_mb_transferred: number;
  co2_multiplier: number;
  water_multiplier: number;
  land_multiplier: number;
  confidence: number;
  source: string;
}

export function rowToProfile(row: ProfileRow): DomainProfile {
  return {
    domain: row.domain,
    category: (CATEGORIES.includes(row.category as Category)
      ? row.category
      : 'generic') as Category,
    whPerMinuteActive: row.wh_per_minute_active,
    whPerMbTransferred: row.wh_per_mb_transferred,
    co2Multiplier: row.co2_multiplier,
    waterMultiplier: row.water_multiplier,
    landMultiplier: row.land_multiplier,
    confidence: row.confidence,
    source: (row.source as DomainProfile['source']) ?? 'ai',
  };
}

export function profileToRow(p: DomainProfile): ProfileRow {
  return {
    domain: p.domain,
    category: p.category,
    wh_per_minute_active: p.whPerMinuteActive,
    wh_per_mb_transferred: p.whPerMbTransferred,
    co2_multiplier: p.co2Multiplier,
    water_multiplier: p.waterMultiplier,
    land_multiplier: p.landMultiplier,
    confidence: p.confidence,
    source: p.source,
  };
}
