import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockFetchDesign = vi.fn();
const mockFetchSeriesOccupancy = vi.fn();
vi.mock('@/lib/payload', () => ({
  fetchDesign: (...a: unknown[]) => mockFetchDesign(...a),
  fetchSeriesOccupancy: (...a: unknown[]) => mockFetchSeriesOccupancy(...a),
  mediaUrl: (m: { url?: string | null; filename?: string | null } | null | undefined) =>
    m ? (m.url ?? `/media/${m.filename ?? 'x'}`) : null,
}));

import { getSeriesOccupancyContent } from '../series-hub-content';

const baseDesign = {
  id: 7,
  name: 'کارولین',
  slug: 'caroline',
  occupancies: ['teen', 'double'],
  materialCallouts: [{ image: { filename: 'wood.jpg' }, label: 'چوب', sub: 'بلوط' }],
};

beforeEach(() => {
  mockFetchDesign.mockReset();
  mockFetchSeriesOccupancy.mockReset();
  mockFetchDesign.mockResolvedValue({ ...baseDesign });
  mockFetchSeriesOccupancy.mockResolvedValue(null);
});

describe('getSeriesOccupancyContent — inheritance + curation', () => {
  it('returns null when the design does not exist', async () => {
    mockFetchDesign.mockResolvedValueOnce(null);
    expect(await getSeriesOccupancyContent('teen', 'missing')).toBeNull();
  });

  it('un-authored combo: inherits design materials, empty products, not differentiated', async () => {
    const res = await getSeriesOccupancyContent('teen', 'caroline');
    expect(res).not.toBeNull();
    expect(res!.differentiated).toBe(false);
    expect(res!.content.collection.items).toHaveLength(0);
    // materials inherit from the design
    expect(res!.content.materials?.items[0]).toMatchObject({ name: 'چوب', img: '/media/wood.jpg' });
    // siblings auto-generate from the OTHER occupancy (double)
    expect(res!.content.featuredSibling).toMatchObject({ href: '/bedroom-set/double/caroline' });
  });

  it('authored combo: curated products map into the collection and mark it differentiated', async () => {
    mockFetchSeriesOccupancy.mockResolvedValueOnce({
      id: 1,
      occupancy: 'teen',
      products: [
        { id: 11, name: 'تخت ۱۰۰', slug: 'bed-100', gallery: [{ filename: 'b.jpg' }], basePriceRials: 120000000 },
      ],
    });
    const res = await getSeriesOccupancyContent('teen', 'caroline');
    expect(res!.differentiated).toBe(true);
    expect(res!.content.collection.items).toHaveLength(1);
    expect(res!.content.collection.items[0]).toMatchObject({ name: 'تخت ۱۰۰', href: '/products/bed-100', img: '/media/b.jpg' });
  });

  it('strips the design name from each piece caption in the collection', async () => {
    mockFetchSeriesOccupancy.mockResolvedValueOnce({
      id: 1,
      occupancy: 'teen',
      products: [
        // suffix case: «تخت کارولین» → «تخت»
        { id: 11, name: 'تخت کارولین', slug: 'caroline-bed', basePriceRials: 120000000 },
        // mid-name case: design name before a parenthetical qualifier
        { id: 12, name: 'تخت نوزاد دومنظوره کارولین (نوجوان)', slug: 'caroline-convertible-teen', basePriceRials: 120000000 },
        // no design name in the piece → left untouched
        { id: 13, name: 'تخت ۱۰۰', slug: 'bed-100', basePriceRials: 120000000 },
      ],
    });
    const res = await getSeriesOccupancyContent('teen', 'caroline');
    expect(res!.content.collection.items.map((i) => i.name)).toEqual([
      'تخت',
      'تخت نوزاد دومنظوره (نوجوان)',
      'تخت ۱۰۰',
    ]);
  });

  it('combo override wins over the design (subtitle + materials)', async () => {
    mockFetchSeriesOccupancy.mockResolvedValueOnce({
      id: 1,
      occupancy: 'teen',
      subtitle: 'نسخه‌ی نوجوان',
      materialCallouts: [{ image: { filename: 'metal.jpg' }, label: 'فلز', sub: 'مات' }],
    });
    const res = await getSeriesOccupancyContent('teen', 'caroline');
    expect(res!.content.title.subtitle).toBe('نسخه‌ی نوجوان');
    expect(res!.content.materials?.items[0]).toMatchObject({ name: 'فلز', img: '/media/metal.jpg' });
  });

  it('a blank («») combo string field inherits the design value (empty ⇒ inherit)', async () => {
    mockFetchDesign.mockResolvedValueOnce({ ...baseDesign, tagline: 'شعار طرح' });
    mockFetchSeriesOccupancy.mockResolvedValueOnce({ id: 1, occupancy: 'teen', subtitle: '' });
    const res = await getSeriesOccupancyContent('teen', 'caroline');
    expect(res!.content.title.subtitle).toBe('شعار طرح');
  });

  it('authored siblings (with media + link) replace the auto-generated ones', async () => {
    mockFetchSeriesOccupancy.mockResolvedValueOnce({
      id: 1,
      occupancy: 'teen',
      siblings: [{ image: { filename: 's.jpg' }, kicker: 'سرویس دونفره', name: 'آیرون', link: '/bedroom-set/double/iron' }],
    });
    const res = await getSeriesOccupancyContent('teen', 'caroline');
    expect(res!.content.featuredSibling).toMatchObject({ kicker: 'سرویس دونفره', img: '/media/s.jpg', href: '/bedroom-set/double/iron' });
  });
});
