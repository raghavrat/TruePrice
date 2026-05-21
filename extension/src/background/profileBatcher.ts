import { fetchProfiles } from '../lib/aiClient';
import { clearPendingDomains, getPendingDomains, setProfiles } from '../lib/storage';

const MAX_BATCH = 50;

/** Hourly: send queued unknown domains to the AI proxy and cache the results. */
export async function runProfileBatch(): Promise<void> {
  const pending = await getPendingDomains();
  if (pending.length === 0) return;

  const batch = pending.slice(0, MAX_BATCH);
  try {
    const profiles = await fetchProfiles(batch);
    if (profiles.length > 0) await setProfiles(profiles);
    // Clear the domains we successfully asked about (even those the AI
    // couldn't classify get a fallback server-side, so don't retry forever).
    await clearPendingDomains(batch);
  } catch (err) {
    console.warn('[trueprice] profile batch failed, will retry next alarm', err);
  }
}
