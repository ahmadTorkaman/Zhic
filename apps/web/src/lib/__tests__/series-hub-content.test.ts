import { describe, expect, it, vi, beforeEach } from 'vitest';

// Mock the Payload fetch layer BEFORE importing the module under test.
const mockFetchDesign = vi.fn();
const mockFetchProducts = vi.fn();
vi.mock('@/lib/payload', () => ({
  fetchDesign: (...a: unknown[]) => mockFetchDesign(...a),
  fetchProducts: (...a: unknown[]) => mockFetchProducts(...a),
  // simple stub: relative media → a /media/<filename> url, null when absent
  mediaUrl: (m: { url?: string | null; filename?: string | null } | null | undefined) =>
    m ? (m.url ?? `/media/${m.filename ?? 'x'}`) : null,
}));

import { getSeriesHubContent } from '../series-hub-content';

const baseDesign = {
  id: 7,
  name: 'کارولین',
  slug: 'caroline',
  occupancies: ['teen', 'double'],
};

beforeEach(() => {
  mockFetchDesign.mockReset();
  mockFetchProducts.mockReset();
  mockFetchProducts.mockResolvedValue({ docs: [] });
});

describe('getSeriesHubContent — non-iron Payload mapping', () => {
  it('maps materialCallouts (rows with an image) into the materials section', async () => {
    mockFetchDesign.mockResolvedValueOnce({
      ...baseDesign,
      materialCallouts: [
        { image: { filename: 'metal.jpg' }, label: 'فلز', sub: 'پوشش مات' },
        { image: { filename: 'mdf.jpg' }, label: 'MDF', sub: 'vispan' },
        { image: null, label: 'بی‌تصویر', sub: 'حذف می‌شود' }, // dropped (no image)
      ],
    });
    const content = await getSeriesHubContent('caroline', 'teen');
    expect(content?.materials).not.toBeNull();
    expect(content?.materials?.heading).toBe('متریال های استفاده شده');
    expect(content?.materials?.items).toHaveLength(2);
    expect(content?.materials?.items[0]).toMatchObject({ name: 'فلز', sub: 'پوشش مات', img: '/media/metal.jpg' });
  });

  it('maps designDetails and defaults span to 100 when absent', async () => {
    mockFetchDesign.mockResolvedValueOnce({
      ...baseDesign,
      designDetails: [
        { image: { filename: 'a.jpg' }, label: 'سر تخت', description: 'کشویی', span: 83 },
        { image: { filename: 'b.jpg' }, label: 'پگبورد' }, // no span, no description
      ],
    });
    const content = await getSeriesHubContent('caroline', 'teen');
    expect(content?.details?.items).toHaveLength(2);
    expect(content?.details?.items[0]).toMatchObject({ label: 'سر تخت', desc: 'کشویی', span: 83, img: '/media/a.jpg' });
    expect(content?.details?.items[1]).toMatchObject({ label: 'پگبورد', desc: '', span: 100 });
  });

  it('builds the intro card (title falls back to occupancy) and the story card', async () => {
    mockFetchDesign.mockResolvedValueOnce({
      ...baseDesign,
      introBody: 'معرفی کوتاه',
      introMedia: { filename: 'intro.jpg' },
      storyBody: 'داستان این طرح',
      storyMedia: { filename: 'story.jpg' },
    });
    const content = await getSeriesHubContent('caroline', 'teen');
    expect(content?.intro).toMatchObject({ title: 'سرویس خواب نوجوان', body: 'معرفی کوتاه', img: '/media/intro.jpg' });
    expect(content?.story).toMatchObject({ title: 'داستان طراحی', body: 'داستان این طرح', img: '/media/story.jpg' });
  });

  it('leaves all four sections null when the design has no detail content', async () => {
    mockFetchDesign.mockResolvedValueOnce({ ...baseDesign });
    const content = await getSeriesHubContent('caroline', 'teen');
    expect(content?.materials).toBeNull();
    expect(content?.details).toBeNull();
    expect(content?.intro).toBeNull();
    expect(content?.story).toBeNull();
  });

  it('omits the story card when storyMedia is set but storyBody is empty', async () => {
    mockFetchDesign.mockResolvedValueOnce({ ...baseDesign, storyMedia: { filename: 'story.jpg' } });
    const content = await getSeriesHubContent('caroline', 'teen');
    expect(content?.story).toBeNull();
  });
});
