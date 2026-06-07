import { SkipLink } from '@zhic/ui';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { IntroSplash } from '@/components/layout/IntroSplash';
import { fetchNavMeta, fetchSiteConfig } from '@/lib/payload';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const [navMeta, siteConfig] = await Promise.all([fetchNavMeta(), fetchSiteConfig()]);
  return (
    <>
      <IntroSplash />
      <SkipLink />
      <SiteHeader navMeta={navMeta} socials={siteConfig?.socials ?? undefined} />
      <main id="main">{children}</main>
      <SiteFooter siteConfig={siteConfig} />
    </>
  );
}
