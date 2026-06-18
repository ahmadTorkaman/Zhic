import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockFetch = vi.fn();
vi.mock('@/lib/payload', () => ({
  fetchBedroomFurniture: (...a: unknown[]) => mockFetch(...a),
  mediaUrl: (m: { url?: string | null; filename?: string | null } | null | undefined) =>
    m ? (m.url ?? `/media/${m.filename ?? 'x'}`) : null,
  categoryPath: (slug: string) => `/bedroom-furniture/${slug}`,
}));

import { getBedroomFurnitureContent } from '../bedroom-furniture';

beforeEach(() => mockFetch.mockReset());

describe('getBedroomFurnitureContent', () => {
  it('falls back to SEED when the global is null', async () => {
    mockFetch.mockResolvedValueOnce(null);
    const c = await getBedroomFurnitureContent();
    expect(c.showcase[0]!.label).toBe('پا تختی'); // SEED first showcase card
    expect(c.hero).toBeUndefined();
  });

  it('falls back to SEED when the global has no showcase cards', async () => {
    mockFetch.mockResolvedValueOnce({ heroTitle: 'x', showcase: [] });
    const c = await getBedroomFurnitureContent();
    expect(c.showcase[0]!.label).toBe('پا تختی');
  });

  it('maps showcase (label/href from category, img from archImage), rooms, hero, and copy', async () => {
    mockFetch.mockResolvedValueOnce({
      heroTitle: 'مبلمان\nاتاق خواب',
      heroSubtitle: 'زیرعنوان',
      heroTagline: 'شعار',
      heroCtaLabel: 'برو',
      heroMedia: { filename: 'hero.jpg' },
      showcaseHeading: 'دسته‌ها',
      showcaseBody: 'متن',
      showcaseInitial: 0,
      showcase: [
        { category: { name: 'تخت خواب', slug: 'bed' }, archImage: { filename: 'arch-bed.jpg' } },
        { category: { name: 'پاتختی', slug: 'nightstand' }, archImage: { filename: 'arch-ns.jpg' } },
      ],
      rooms: [
        { name: 'بزرگسال', display: 'بزرگــسال', image: { filename: 'adult.jpg' }, href: '/bedroom-set/double' },
      ],
    });
    const c = await getBedroomFurnitureContent();
    expect(c.showcase).toHaveLength(2);
    expect(c.showcase[0]).toMatchObject({ label: 'تخت خواب', href: '/bedroom-furniture/bed', img: '/media/arch-bed.jpg' });
    expect(c.showcaseInitial).toBe(0);
    expect(c.lorem).toBe('متن');
    expect(c.rooms[0]).toMatchObject({ name: 'بزرگسال', display: 'بزرگــسال', img: '/media/adult.jpg', href: '/bedroom-set/double' });
    expect(c.hero).toMatchObject({ title: 'مبلمان\nاتاق خواب', subtitle: 'زیرعنوان', tagline: 'شعار', ctaLabel: 'برو', img: '/media/hero.jpg' });
    expect(c.showcaseHeading).toBe('دسته‌ها');
  });

  it('defaults showcaseInitial to the middle card when unset', async () => {
    mockFetch.mockResolvedValueOnce({
      showcase: [
        { category: { name: 'a', slug: 'a' }, archImage: { filename: 'a.jpg' } },
        { category: { name: 'b', slug: 'b' }, archImage: { filename: 'b.jpg' } },
        { category: { name: 'c', slug: 'c' }, archImage: { filename: 'c.jpg' } },
      ],
    });
    const c = await getBedroomFurnitureContent();
    expect(c.showcaseInitial).toBe(1); // floor(3/2)
  });

  it('clamps an out-of-range showcaseInitial to the last card', async () => {
    mockFetch.mockResolvedValueOnce({
      showcaseInitial: 9,
      showcase: [
        { category: { name: 'a', slug: 'a' }, archImage: { filename: 'a.jpg' } },
        { category: { name: 'b', slug: 'b' }, archImage: { filename: 'b.jpg' } },
      ],
    });
    const c = await getBedroomFurnitureContent();
    expect(c.showcaseInitial).toBe(1); // clamped to showcase.length - 1
  });
});
