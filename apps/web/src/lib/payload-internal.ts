// Extracted from payload.ts during the category-fetchers refactor.
// Keeping it in a sibling module lets the new fetchers be tested in isolation
// via Vitest mocks without dragging in the whole payload.ts surface area.
import { API_URL } from './env';

export async function payloadFetch<T>(path: string, tag: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      next: { revalidate: 300, tags: [tag] },
    });
    if (!res.ok) return null;
    // Normalize media URLs to same-origin relative paths. The API bakes an
    // absolute host into media `url` (serverURL = NEXT_PUBLIC_SERVER_URL); strip
    // it so every consumer (mediaUrl() and the many direct `.url` reads) loads
    // images over the *page's* own origin via the /api/media rewrite — no
    // mixed-content on the https Vercel frontend, no hard-coded backend host.
    const text = (await res.text()).replace(/https?:\/\/[^/"\\]+\/api\/media\//g, '/api/media/');
    return JSON.parse(text) as T;
  } catch (err) {
    console.error(`[payloadFetch] ${path} failed:`, err);
    return null;
  }
}
