import type { PayloadCategory, LexicalRoot } from './payload';

type Crumb = { label: string; href?: string };

const MAX_META_DESC = 160;

/**
 * Extract a plaintext description from a Lexical intro. Walks the first
 * paragraph node's text children, concatenates them, trims, and (if longer
 * than 160 chars) truncates at the previous word boundary appending "…".
 *
 * Returns null when intro is null, empty, or has no first paragraph.
 */
export function deriveDescriptionFromIntro(intro: LexicalRoot | null | undefined): string | null {
  if (!intro?.root) return null;
  const children = intro.root.children as Array<{ type?: string; children?: Array<{ text?: string }> }> | undefined;
  if (!children?.length) return null;
  const firstPara = children.find((c) => c.type === 'paragraph');
  if (!firstPara?.children?.length) return null;
  const flat = (firstPara.children ?? [])
    .map((c) => (typeof c.text === 'string' ? c.text : ''))
    .join('')
    .trim();
  if (!flat) return null;
  if (flat.length <= MAX_META_DESC) return flat;
  const slice = flat.slice(0, MAX_META_DESC);
  const cut = slice.lastIndexOf(' ');
  return (cut > 0 ? slice.slice(0, cut) : slice) + '…';
}

/**
 * Build the breadcrumb chain for a category page.
 * - Parent: 3 items — Home / Products / <current>
 * - Leaf:   4 items — Home / Products / <parent> / <current>
 *
 * The current item never has an href (it's the page we're on).
 */
export function buildCrumbs(category: PayloadCategory): Crumb[] {
  const base: Crumb[] = [
    { label: 'خانه', href: '/' },
    { label: 'محصولات', href: '/products' },
  ];
  if (!category.parent || typeof category.parent !== 'object') {
    return [...base, { label: category.name }];
  }
  return [
    ...base,
    { label: category.parent.name, href: `/categories/${category.parent.slug}` },
    { label: category.name },
  ];
}

const FILTER_KEYS = ['design', 'material', 'size'] as const;
const DEFAULT_SORT = 'newest';

/**
 * Count how many *filter* params are active in the searchParams object.
 * `page` and the default sort are NOT counted (paging is navigation;
 * the default sort doesn't change the result set).
 */
export function countActiveFilters(sp: Record<string, string | string[] | undefined>): number {
  let n = 0;
  for (const key of FILTER_KEYS) {
    const v = sp[key];
    if (typeof v === 'string' && v.length > 0) n++;
    if (Array.isArray(v) && v.some((x) => x?.length > 0)) n++;
  }
  const sort = sp.sort;
  if (typeof sort === 'string' && sort.length > 0 && sort !== DEFAULT_SORT) n++;
  return n;
}
