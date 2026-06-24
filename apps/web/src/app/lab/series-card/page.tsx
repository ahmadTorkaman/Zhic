import type { Metadata } from 'next';
import { SeriesCollection } from '@/components/series-hub/SeriesCollection';
import type { SeriesProductCard } from '@/lib/series-hub-content';

export const metadata: Metadata = {
  title: 'Lab — قطعات سرویس card',
  robots: { index: false, follow: false },
};

/**
 * Standalone preview of the redesigned SeriesCollection product card
 * (Figma 398:87). Seeded with local iron images — two on-sale cards (struck
 * original + sale) and two single-price cards — to verify both states. No CMS.
 */
// Transparent (borderless) product cutouts, to verify they float over the cream panel.
const IMG = '/lab-cutouts';
const ITEMS: SeriesProductCard[] = [
  { key: '1', name: 'تخت نوزاد', img: `${IMG}/cutout-1.webp`, price: '۱۲٬۱۹۰ تومان', originalPrice: '۱۵٬۲۵۰ تومان', href: '#' },
  { key: '2', name: 'پاتختی', img: `${IMG}/cutout-2.webp`, price: '۱۴٬۸۰۰ تومان', originalPrice: null, href: '#' },
  { key: '3', name: 'کمد دو درب', img: `${IMG}/cutout-3.webp`, price: '۳٬۹۵۰ تومان', originalPrice: '۴٬۵۰۰ تومان', href: '#' },
  { key: '4', name: 'میز تحریر', img: `${IMG}/cutout-4.webp`, price: '۹٬۲۰۰ تومان', originalPrice: null, href: '#' },
];

export default function LabSeriesCardPage() {
  return (
    <main className="min-h-screen bg-ivory py-8">
      <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
        <SeriesCollection heading="قطعات سرویس" items={ITEMS} />
      </div>
    </main>
  );
}
