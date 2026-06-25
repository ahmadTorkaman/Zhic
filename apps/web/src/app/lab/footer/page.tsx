import type { Metadata } from 'next';
import { SiteFooter } from '@/components/layout/SiteFooter';
import type { PayloadSiteConfig } from '@/lib/payload';

export const metadata: Metadata = {
  title: 'Lab — footer',
  robots: { index: false, follow: false },
};

/** Standalone preview of the redesigned SiteFooter (Figma 402:139), seeded with
 *  Instagram + Telegram socials and a phone so the «ارتباط با ما» column fills. */
const SEED = {
  contactPhone: '02112345678',
  socials: [
    { platform: 'instagram', url: '#' },
    { platform: 'telegram', url: '#' },
  ],
} as unknown as PayloadSiteConfig;

export default function LabFooterPage() {
  return (
    <main className="min-h-screen bg-ivory">
      <SiteFooter siteConfig={SEED} />
    </main>
  );
}
