import {
  fallbackProfile,
  profileToRow,
  profileWithAI,
  rowToProfile,
  type DomainProfile,
  type ProfileRow,
} from '@/lib/profile';
import { supabaseAdmin } from '@/lib/supabaseAdmin';

export const runtime = 'nodejs';

const MAX_BATCH = 50;

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
  let domains: string[];
  try {
    const body = (await request.json()) as { domains?: unknown };
    if (!Array.isArray(body.domains)) return json({ error: 'domains[] required' }, 400);
    domains = Array.from(
      new Set(
        body.domains
          .filter((d): d is string => typeof d === 'string')
          .map((d) => d.trim().toLowerCase())
          .filter(Boolean),
      ),
    ).slice(0, MAX_BATCH);
  } catch {
    return json({ error: 'invalid JSON' }, 400);
  }

  if (domains.length === 0) return json({ profiles: [] });

  // 1. Global cache lookup.
  const cached = new Map<string, DomainProfile>();
  if (supabaseAdmin) {
    const { data } = await supabaseAdmin
      .from('domain_profiles')
      .select('*')
      .in('domain', domains);
    for (const row of (data ?? []) as ProfileRow[]) {
      cached.set(row.domain, rowToProfile(row));
    }
  }

  const missing = domains.filter((d) => !cached.has(d));

  // 2. Profile the misses with AI (or fallback if no key).
  let fresh: DomainProfile[] = [];
  const apiKey = process.env.IONROUTER_API_KEY;
  if (missing.length > 0) {
    if (apiKey) {
      try {
        fresh = await profileWithAI(missing, apiKey);
      } catch (err) {
        console.error('[ai/profile] ionrouter failed:', err);
        fresh = missing.map(fallbackProfile);
      }
    } else {
      fresh = missing.map(fallbackProfile);
    }

    // 3. Persist AI results to the global cache (skip fallbacks).
    if (supabaseAdmin) {
      const rows = fresh.filter((p) => p.source === 'ai').map(profileToRow);
      if (rows.length > 0) {
        await supabaseAdmin.from('domain_profiles').upsert(rows, { onConflict: 'domain' });
      }
    }
  }

  return json({ profiles: [...cached.values(), ...fresh] });
}
