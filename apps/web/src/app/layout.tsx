import type { Metadata } from 'next';
import localFont from 'next/font/local';
import { SITE_URL } from '@/lib/env';
import './globals.css';

const ayandeh = localFont({
  src: [
    {
      path: '../assets/fonts/Ayandeh Light.ttf',
      weight: '300',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Ayandeh Regular.ttf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Ayandeh Bold.ttf',
      weight: '700',
      style: 'normal',
    },
    {
      path: '../assets/fonts/Ayandeh Black.ttf',
      weight: '900',
      style: 'normal',
    },
  ],
  variable: '--font-ayandeh',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    template: '%s — ژیک',
    default: 'ژیک — مبلمان خواب دست‌ساز',
  },
  description: 'تخت‌های دست‌ساز برای کسانی که هنر آهسته زیستن را می‌شناسند.',
  openGraph: {
    locale: 'fa_IR',
    siteName: 'ژیک',
  },
  twitter: {
    card: 'summary_large_image',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa-IR"
      dir="rtl"
      className={`${ayandeh.variable} antialiased`}
    >
      <body className="bg-ivory text-charcoal font-sans">{children}</body>
    </html>
  );
}
