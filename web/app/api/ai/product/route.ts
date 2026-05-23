import {
  estimateProduct,
  fallbackImpact,
  impactToRow,
  rowToImpact,
  titleHash,
  type ProductImpact,
  type ProductRow,
} from '@/lib/product';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export async function OPTIONS(): Promise<Response> {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: Request): Promise<Response> {
  let title: string;
  try {
    const body = (await request.json()) as { title?: unknown };
    if (typeof body.title !== 'string' || !body.title.trim()) {
      return json({ error: 'title required' }, 400);
    }
    title = body.title.trim().slice(0, 500);
  } catch {
    return json({ error: 'invalid JSON' }, 400);
  }

  const hash = titleHash(title);

  // 1. Global cache lookup.
  if (supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from('product_profiles')
      .select('*')
      .eq('title_hash', hash)
      .maybeSingle();
    if (data) return json({ impact: rowToImpact(data as ProductRow) });
  }

  // 2. AI estimate (or fallback if no key).
  let impact: ProductImpact;
  const apiKey = process.env.IONROUTER_API_KEY;
  if (apiKey) {
    try {
      impact = await estimateProduct(title, apiKey);
    } catch (err) {
      console.error('[ai/product] ionrouter failed:', err);
      impact = fallbackImpact(title);
    }
  } else {
    impact = fallbackImpact(title);
  }

  // 3. Persist real estimates to the global cache.
  if (supabaseAdmin && impact.source === 'ai') {
    await supabaseAdmin
      .from('product_profiles')
      .upsert(impactToRow(impact), { onConflict: 'title_hash' });
  }

  return json({ impact });
}
