import type { Metadata } from 'next';
import { Cormorant_Garamond, Inter } from 'next/font/google';
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider';
import './globals.css';

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-cormorant',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Zhic — Luxury Bedroom Design',
  description:
    'Handcrafted beds designed for those who appreciate the art of slowing down. Luxury bedroom furniture from our New York atelier.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${cormorant.variable} ${inter.variable} antialiased`}
    >
      <body className="bg-ivory text-charcoal font-sans">
        <SmoothScrollProvider>{children}</SmoothScrollProvider>
      </body>
    </html>
  );
}
