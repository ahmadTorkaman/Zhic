import { Breadcrumbs, Container, type BreadcrumbItem } from '@zhic/ui';

export type StickyBreadcrumbProps = {
  items: BreadcrumbItem[];
};

/**
 * Sticky breadcrumb bar — on initial paint it sits BELOW the fixed
 * header (pt-[var(--header-height)] on the outer flow wrapper), then
 * sticks at top: var(--header-height) once scrolled past so it never
 * collides with the header.
 *
 * Previously the component placed the sticky element directly in the
 * page flow at y=0. The header (z-200) sits at top:0 with z-100 sticky
 * below it, so on initial load the header visually overlaid the
 * breadcrumb — operator reported it 2026-05-23. The outer pt wrapper
 * fixes that without changing the sticky behaviour during scroll.
 */
export function StickyBreadcrumb({ items }: StickyBreadcrumbProps) {
  return (
    <div className="pt-[var(--header-height)]">
      <div className="sticky top-[var(--header-height)] z-[var(--z-sticky)] border-b border-sand/40 bg-ivory/90 backdrop-blur">
        <Container>
          <div className="py-3">
            <Breadcrumbs items={items} />
          </div>
        </Container>
      </div>
    </div>
  );
}
