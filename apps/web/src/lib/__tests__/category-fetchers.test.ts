import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock payloadFetch BEFORE importing the module under test.
const mockPayloadFetch = vi.fn();
vi.mock('../payload-internal', () => ({
  payloadFetch: (...args: unknown[]) => mockPayloadFetch(...args),
}));

import {
  fetchChildCategories,
  fetchSiblingCategories,
  fetchSiblingParents,
  fetchDesignsForCategory,
  fetchAvailableDesigns,
  fetchAvailableMaterials,
} from '../category-fetchers';

beforeEach(() => mockPayloadFetch.mockReset());

describe('fetchChildCategories', () => {
  it('queries by parent id and returns docs', async () => {
    mockPayloadFetch.mockResolvedValueOnce({
      docs: [{ id: 2, slug: 'wall-mirror', name: 'آینه دیواری' }],
      totalDocs: 1, page: 1, totalPages: 1, limit: 50,
    });
    const out = await fetchChildCategories(1);
    expect(out).toHaveLength(1);
    expect(out[0]!.slug).toBe('wall-mirror');
    const [url] = mockPayloadFetch.mock.calls[0]!;
    expect(url).toContain('where[parent][equals]=1');
  });
  it('returns [] on null response', async () => {
    mockPayloadFetch.mockResolvedValueOnce(null);
    expect(await fetchChildCategories(1)).toEqual([]);
  });
});

describe('fetchSiblingCategories', () => {
  it('queries other leaves under same parent, excluding current', async () => {
    mockPayloadFetch.mockResolvedValueOnce({
      docs: [{ id: 3, slug: 'round-mirror', name: 'آینه گرد' }],
      totalDocs: 1, page: 1, totalPages: 1, limit: 4,
    });
    const out = await fetchSiblingCategories(1, 2);
    expect(out).toHaveLength(1);
    const [url] = mockPayloadFetch.mock.calls[0]!;
    expect(url).toContain('where[parent][equals]=1');
    expect(url).toContain('where[id][not_equals]=2');
    expect(url).toContain('limit=4');
  });
});

describe('fetchSiblingParents', () => {
  it('queries top-level categories excluding current', async () => {
    mockPayloadFetch.mockResolvedValueOnce({
      docs: [{ id: 4, slug: 'beds', name: 'تخت‌ها' }],
      totalDocs: 1, page: 1, totalPages: 1, limit: 4,
    });
    await fetchSiblingParents(1);
    const [url] = mockPayloadFetch.mock.calls[0]!;
    expect(url).toContain('where[parent][exists]=false');
    expect(url).toContain('where[id][not_equals]=1');
  });
});

describe('fetchDesignsForCategory (two-step join)', () => {
  it('first fetches products in category, then designs by those design ids', async () => {
    mockPayloadFetch
      .mockResolvedValueOnce({
        docs: [
          { id: 'p1', design: { id: 'd1' } },
          { id: 'p2', design: { id: 'd2' } },
          { id: 'p3', design: { id: 'd1' } }, // duplicate design
        ],
        totalDocs: 3, page: 1, totalPages: 1, limit: 200,
      })
      .mockResolvedValueOnce({
        docs: [
          { id: 'd1', slug: 'gandom', name: 'گندم' },
          { id: 'd2', slug: 'baloot', name: 'باروت' },
        ],
        totalDocs: 2, page: 1, totalPages: 1, limit: 10,
      });
    const out = await fetchDesignsForCategory('wall-mirror');
    expect(out).toHaveLength(2);
    expect(out.map((d) => d.slug).sort()).toEqual(['baloot', 'gandom']);
    const [step1Url] = mockPayloadFetch.mock.calls[0]!;
    expect(step1Url).toContain('where[categories.slug][equals]=wall-mirror');
    const [step2Url] = mockPayloadFetch.mock.calls[1]!;
    expect(step2Url).toContain('where[id][in]=d1%2Cd2');
  });
  it('returns [] when no products', async () => {
    mockPayloadFetch.mockResolvedValueOnce({ docs: [], totalDocs: 0, page: 1, totalPages: 0, limit: 200 });
    expect(await fetchDesignsForCategory('wall-mirror')).toEqual([]);
    expect(mockPayloadFetch).toHaveBeenCalledTimes(1); // skips step 2
  });
});
