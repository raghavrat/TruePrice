/** Extract a normalized hostname from a URL, or null for non-web URLs. */
export function domainOf(url: string | undefined | null): string | null {
  if (!url) return null;
  try {
    const u = new URL(url);
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return null;
    return u.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}
