export type NavLink = {
  label: string;
  href: string;
};

export const NAV_LINKS: NavLink[] = [
  // محصولات removed — replaced by SetsMegaMenu + PiecesMegaMenu in SiteHeader.
  // Journal kept in primary nav for now; per Map.png it belongs in footer or
  // secondary nav only — moving it requires adding it to SiteFooter first
  // (Phase 4 cleanup of the pre-import refactors).
  { label: 'ژورنال', href: '/journal' },
  { label: 'شعب ژیک', href: '/showrooms' },
  { label: 'درباره ما', href: '/about' },
  { label: 'تماس با ما', href: '/contact' },
];

/** Whether a given href matches the current pathname for active-nav highlighting. */
export function isNavActive(pathname: string | null, href: string): boolean {
  if (!pathname) return false;
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}
