import type { Metadata } from 'next';
import localFont from 'next/font/local';
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
  title: 'ژیک — مبلمان خواب دست‌ساز',
  description:
    'تخت‌های دست‌ساز برای کسانی که هنر آهسته زیستن را می‌شناسند.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fa"
      dir="rtl"
      className={`${ayandeh.variable} antialiased`}
    >
      <body className="bg-ivory text-charcoal font-sans">{children}</body>
    </html>
  );
}
