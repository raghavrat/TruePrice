import type { DomainProfile, ProductImpact } from './types';

const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? 'http://localhost:3000';

/** Ask the marketing-site proxy to profile a batch of unknown domains. */
export async function fetchProfiles(domains: string[]): Promise<DomainProfile[]> {
  if (domains.length === 0) return [];
  const res = await fetch(`${API_BASE}/api/ai/profile`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ domains }),
  });
  if (!res.ok) throw new Error(`profile request failed: ${res.status}`);
  const data = (await res.json()) as { profiles?: DomainProfile[] };
  return (data.profiles ?? []).map((p) => ({ ...p, source: 'ai' as const }));
}

/** Ask the proxy to estimate the footprint of a single product by title. */
export async function fetchProductImpact(title: string): Promise<ProductImpact | null> {
  const res = await fetch(`${API_BASE}/api/ai/product`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  });
  if (!res.ok) throw new Error(`product request failed: ${res.status}`);
  const data = (await res.json()) as { impact?: ProductImpact };
  return data.impact ?? null;
}
