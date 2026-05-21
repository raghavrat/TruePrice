import { addUsage } from '../lib/storage';
import { epochHour } from '../lib/timeBuckets';

/**
 * Record bytes transferred for a domain, as reported by the content script's
 * PerformanceObserver. Bucketed into the current hour.
 */
export async function recordBytes(domain: string, bytes: number): Promise<void> {
  if (bytes <= 0) return;
  await addUsage(domain, epochHour(), { b: bytes });
}
