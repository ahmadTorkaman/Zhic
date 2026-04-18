import type { ReactNode } from 'react';
import { toPersianDigits } from '@zhic/locale';
import type { ProductsQuery } from '@/lib/payload';
import { MobileFilterTrigger } from './MobileFilterTrigger';
import { SortForm } from './SortForm';

type Props = {
  totalDocs: number;
  query: ProductsQuery;
  drawerContent: ReactNode;
};

export function ProductIndexToolbar({ totalDocs, query, drawerContent }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4 border-y border-sand py-4">
      <div className="flex items-center gap-4 text-body text-stone">
        <span>
          <strong className="text-charcoal">{toPersianDigits(totalDocs)}</strong>{' '}
          محصول
        </span>
        <MobileFilterTrigger>{drawerContent}</MobileFilterTrigger>
      </div>
      <SortForm query={query} />
    </div>
  );
}
