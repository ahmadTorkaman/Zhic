import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'ژیک — مبلمان خواب دست‌ساز',
    short_name: 'ژیک',
    description: 'تخت‌های دست‌ساز برای کسانی که هنر آهسته زیستن را می‌شناسند.',
    start_url: '/',
    display: 'standalone',
    background_color: '#FAF8F5',
    theme_color: '#1C1917',
  };
}
