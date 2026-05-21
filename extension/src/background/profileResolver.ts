import { FALLBACK_PROFILE } from '../lib/coefficients';
import { getSeedProfile } from '../lib/seedProfiles';
import { addPendingDomain, getCachedProfile, setProfiles } from '../lib/storage';
import type { DomainProfile } from '../lib/types';

/**
 * Resolve a domain to a profile without ever blocking on the network:
 *   local cache → seed catalog → fallback (and enqueue for AI batching).
 * The hourly batcher fills the cache from Supabase/AI out of band.
 */
export async function resolveProfile(
  domain: string,
  { enqueueIfMissing = true }: { enqueueIfMissing?: boolean } = {},
): Promise<DomainProfile> {
  const cached = await getCachedProfile(domain);
  if (cached) return cached;

  const seed = getSeedProfile(domain);
  if (seed) {
    await setProfiles([{ ...seed, domain }]);
    return { ...seed, domain };
  }

  if (enqueueIfMissing) await addPendingDomain(domain);
  return { ...FALLBACK_PROFILE, domain };
}
