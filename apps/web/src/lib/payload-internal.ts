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
    return (await res.json()) as T;
  } catch (err) {
    console.error(`[payloadFetch] ${path} failed:`, err);
    return null;
  }
}
