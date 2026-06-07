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
  robots:
    process.env.NOINDEX === 'true'
      ? { index: false, follow: false, nocache: true }
      : undefined,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa-IR" dir="rtl" className={`${ayandeh.variable} ${ayandeh.className} antialiased`}>
      <head>
        {/* Flag <html> before first paint so the intro splash never flashes for
            returning-in-session visitors or reduced-motion users. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "try{if(sessionStorage.getItem('zhic-intro')||matchMedia('(prefers-reduced-motion: reduce)').matches){document.documentElement.classList.add('intro-seen')}}catch(e){}",
          }}
        />
      </head>
      <body className={ayandeh.className}>{children}</body>
    </html>
  );
}
