import { createOgImage } from '@/lib/og';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'ژیک — مبلمان خواب دست‌ساز';

export default async function OgImage() {
  return createOgImage({
    title: 'مبلمان خواب دست‌ساز',
    subtitle: 'چوب گردو، کتان بلژیکی، و ساختی که می‌ماند.',
  });
}
