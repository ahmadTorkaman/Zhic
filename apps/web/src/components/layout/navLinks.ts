export type NavLink = {
  label: string;
  href: string;
};

export const NAV_LINKS: NavLink[] = [
  // محصولات removed — replaced by SetsMegaMenu + PiecesMegaMenu in SiteHeader.
  { label: 'ژورنال', href: '/journal' },
  { label: 'نمایشگاه‌ها', href: '/showrooms' },
  { label: 'درباره‌ی ما', href: '/about' },
  { label: 'تماس', href: '/contact' },
];

/** Whether a given href matches the current pathname for active-nav highlighting. */
export function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
