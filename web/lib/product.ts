// AI product-footprint estimation for the Amazon overlay. Mirrors lib/profile.ts:
// estimate the manufacturing + shipping impact of a physical product from its
// title, validate against bounds, cache globally in Supabase.
import { createHash } from 'node:crypto';

export const PRODUCT_CATEGORIES = [
  'electronics',
  'clothing',
  'book',
  'food',
  'beauty',
  'home',
  'furniture',
  'toy',
  'tool',
  'other',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface ProductImpact {
  title: string;
  category: ProductCategory;
  co2Kg: number; // kg CO2e to manufacture + ship
  waterL: number; // liters of water embodied in production
  energyKwh: number; // kWh embodied energy
  confidence: number;
  source: 'ai' | 'fallback';
}

const BOUNDS = {
  co2Kg: { min: 0, max: 2000 },
  waterL: { min: 0, max: 100_000 },
  energyKwh: { min: 0, max: 5000 },
};

function clamp(n: number, min: number, max: number): number {
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

/** Stable cache key for a product title (normalized + hashed). */
export function titleHash(title: string): string {
  const norm = title.trim().toLowerCase().replace(/\s+/g, ' ').slice(0, 300);
  return createHash('sha256').update(norm).digest('hex');
}

export function fallbackImpact(title: string): ProductImpact {
  return {
    title,
    category: 'other',
    co2Kg: 0,
    waterL: 0,
    energyKwh: 0,
    confidence: 0,
    source: 'fallback',
  };
}

function sanitize(title: string, raw: unknown): ProductImpact {
  const r = (raw ?? {}) as Record<string, unknown>;
  const category = PRODUCT_CATEGORIES.includes(r.category as ProductCategory)
    ? (r.category as ProductCategory)
    : 'other';
  return {
    title,
    category,
    co2Kg: clamp(Number(r.co2Kg), BOUNDS.co2Kg.min, BOUNDS.co2Kg.max),
    waterL: clamp(Number(r.waterL), BOUNDS.waterL.min, BOUNDS.waterL.max),
    energyKwh: clamp(Number(r.energyKwh), BOUNDS.energyKwh.min, BOUNDS.energyKwh.max),
    confidence: clamp(Number(r.confidence ?? 0.5), 0, 1),
    source: 'ai',
  };
}

const SYSTEM_PROMPT = `You estimate the cradle-to-customer environmental footprint of physical retail products for a shopping-impact overlay.
Given a product title, return a JSON object with these exact fields:
- category: one of ${PRODUCT_CATEGORIES.join(', ')}
- co2Kg: estimated kg CO2-equivalent to manufacture AND ship the product to a customer. A paperback book ~1, a t-shirt ~7, sneakers ~14, a laptop ~300, a smartphone ~70, a microwave ~80.
- waterL: liters of freshwater embodied in production. A t-shirt ~2700, a smartphone ~12000, a paperback ~30.
- energyKwh: kWh of embodied energy in manufacturing.
- confidence: 0..1, your confidence given how specific the title is.
Base estimates on the product type; ignore marketing words. Respond ONLY with the JSON object.`;

const MODEL = 'gpt-oss-120b';
const IONROUTER_URL = 'https://api.ionrouter.io/v1/chat/completions';

export async function estimateProduct(title: string, apiKey: string): Promise<ProductImpact> {
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
        { role: 'user', content: `Product: ${title}` },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    throw new Error(`ionrouter ${res.status}: ${await res.text().catch(() => '')}`);
  }

  const data = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const content = data.choices?.[0]?.message?.content ?? '{}';
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch {
    parsed = {};
  }
  return sanitize(title, parsed);
}

// --- Supabase row mapping --------------------------------------------------

export interface ProductRow {
  title_hash: string;
  title: string;
  category: string;
  co2_kg: number;
  water_l: number;
  energy_kwh: number;
  confidence: number;
  source: string;
}

export function rowToImpact(row: ProductRow): ProductImpact {
  return {
    title: row.title,
    category: (PRODUCT_CATEGORIES.includes(row.category as ProductCategory)
      ? row.category
      : 'other') as ProductCategory,
    co2Kg: row.co2_kg,
    waterL: row.water_l,
    energyKwh: row.energy_kwh,
    confidence: row.confidence,
    source: (row.source as ProductImpact['source']) ?? 'ai',
  };
}

export function impactToRow(impact: ProductImpact): ProductRow {
  return {
    title_hash: titleHash(impact.title),
    title: impact.title.slice(0, 500),
    category: impact.category,
    co2_kg: impact.co2Kg,
    water_l: impact.waterL,
    energy_kwh: impact.energyKwh,
    confidence: impact.confidence,
    source: impact.source,
  };
}
