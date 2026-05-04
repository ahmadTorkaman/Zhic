import { Breadcrumbs, Container, type BreadcrumbItem } from '@zhic/ui';

export type StickyBreadcrumbProps = {
  items: BreadcrumbItem[];
};

export function StickyBreadcrumb({ items }: StickyBreadcrumbProps) {
  return (
    <div className="sticky top-[var(--header-height)] z-[var(--z-sticky)] border-b border-sand/40 bg-ivory/90 backdrop-blur">
      <Container>
        <div className="py-3">
          <Breadcrumbs items={items} />
        </div>
      </Container>
    </div>
  );
}
