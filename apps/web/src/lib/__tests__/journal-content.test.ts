import { describe, expect, it, vi, beforeEach } from 'vitest';

const mockFetchJournal = vi.fn();
const mockFetchCats = vi.fn();
vi.mock('@/lib/payload', () => ({
  fetchJournal: (...a: unknown[]) => mockFetchJournal(...a),
  fetchJournalCategories: (...a: unknown[]) => mockFetchCats(...a),
  mediaUrl: (m: { url?: string | null; filename?: string | null } | null | undefined) =>
    m ? (m.url ?? `/media/${m.filename ?? 'x'}`) : null,
}));

import { getJournalContent } from '../journal-content';

const article = (over: Record<string, unknown> = {}) => ({
  id: 1,
  title: 'مقاله نمونه',
  slug: 'sample',
  excerpt: 'خلاصه',
  cover: { filename: 'c.jpg' },
  category: { name: 'سبک زندگی', slug: 'lifestyle' },
  readingTimeMinutes: 5,
  publishedAt: '2026-03-21',
  ...over,
});

beforeEach(() => {
  mockFetchJournal.mockReset();
  mockFetchCats.mockReset();
  mockFetchCats.mockResolvedValue([]);
});

describe('getJournalContent', () => {
  it('falls back to SEED when the global is null', async () => {
    mockFetchJournal.mockResolvedValueOnce(null);
    const c = await getJournalContent();
    expect(c.featured?.title).toBe('چگونه یک اتاق خواب آرامش‌بخش طراحی کنیم؟');
  });

  it('falls back to SEED when no featuredArticle is set', async () => {
    mockFetchJournal.mockResolvedValueOnce({ introTitle: 'x' });
    const c = await getJournalContent();
    expect(c.featured?.title).toBe('چگونه یک اتاق خواب آرامش‌بخش طراحی کنیم؟');
  });

  it('maps the featured article (date via formatJalaliNumeric) and copy from the global', async () => {
    mockFetchJournal.mockResolvedValueOnce({
      introTitle: 'هدلاین سفارشی',
      quoteText: 'نقل قول سفارشی',
      fullListHeading: 'عنوان فهرست',
      ctaTitle: 'تیتر بنر',
      ctaLabel: 'برچسب',
      ctaHref: '/x',
      ctaImage: { filename: 'cta.jpg' },
      featuredArticle: article({ title: 'مقاله ویژه', slug: 'feat' }),
      listArticles: [article({ id: 2, slug: 'a2' }), article({ id: 3, slug: 'a3' })],
      cardArticles: [article({ id: 4, slug: 'a4' })],
      categoryTabs: [{ name: 'سبک زندگی', slug: 'lifestyle' }],
    });
    const c = await getJournalContent();
    expect(c.intro).toBe('هدلاین سفارشی');
    expect(c.quote).toBe('نقل قول سفارشی');
    expect(c.fullListHeading).toBe('عنوان فهرست');
    expect(c.featured).toMatchObject({ title: 'مقاله ویژه', category: 'سبک زندگی', img: '/media/c.jpg', readingMinutes: 5, date: '۱۴۰۵/۰۱/۰۱', href: '/journal/feat' });
    expect(c.topList).toHaveLength(2);
    expect(c.cards).toHaveLength(1);
    expect(c.productCta).toMatchObject({ title: 'تیتر بنر', cta: 'برچسب', href: '/x', img: '/media/cta.jpg' });
    expect(c.tabs[0]).toMatchObject({ key: 'all', label: 'همه', href: '/journal' });
    expect(c.tabs[1]).toMatchObject({ label: 'سبک زندگی', href: '/journal/category/lifestyle' });
  });

  it('falls back to all journal categories for tabs when categoryTabs is empty', async () => {
    mockFetchCats.mockResolvedValueOnce([{ name: 'ترند', slug: 'trends' }]);
    mockFetchJournal.mockResolvedValueOnce({ featuredArticle: article(), listArticles: [], cardArticles: [] });
    const c = await getJournalContent();
    expect(mockFetchCats).toHaveBeenCalled();
    expect(c.tabs.map((t) => t.label)).toEqual(['همه', 'ترند']);
  });
});
