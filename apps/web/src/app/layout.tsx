import type { Metadata } from 'next';
import localFont from 'next/font/local';
import './globals.css';

const ayandeh = localFont({
  src: [
    { path: '../assets/fonts/Ayandeh Light.ttf',   weight: '300', style: 'normal' },
    { path: '../assets/fonts/Ayandeh Regular.ttf', weight: '400', style: 'normal' },
    { path: '../assets/fonts/Ayandeh Bold.ttf',    weight: '700', style: 'normal' },
    { path: '../assets/fonts/Ayandeh Black.ttf',   weight: '900', style: 'normal' },
  ],
  variable: '--font-ayandeh',
  display: 'swap',
});

export const metadata: Metadata = {
  title: { template: '%s — ژیک', default: 'ژیک' },
  description: 'مبلمان دست‌ساز ژیک — از همدان، برای ایران.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa-IR" dir="rtl" className={`${ayandeh.variable} ${ayandeh.className} antialiased`}>
      <body className={ayandeh.className}>{children}</body>
    </html>
  );
}
