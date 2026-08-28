/**
 * Constrain Unsplash (and similar) request width to reduce memory.
 * Non-Unsplash URLs pass through unchanged.
 */
export function constrainUnsplashUrl(url: string, width: number): string {
  if (!url || width <= 0) {
    return url;
  }

  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes('unsplash.com') && !host.includes('images.unsplash.com')) {
      return url;
    }

    parsed.searchParams.set('w', String(Math.round(width)));
    if (!parsed.searchParams.has('auto')) {
      parsed.searchParams.set('auto', 'format');
    }
    if (!parsed.searchParams.has('fit')) {
      parsed.searchParams.set('fit', 'crop');
    }
    return parsed.toString();
  } catch {
    return url;
  }
}
