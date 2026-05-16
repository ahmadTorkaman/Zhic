import { SkipLink } from '@zhic/ui';
import { SiteHeader } from '@/components/layout/SiteHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { fetchNavMeta } from '@/lib/payload';

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const navMeta = await fetchNavMeta();
  return (
    <>
      <SkipLink />
      <SiteHeader navMeta={navMeta} />
      <main id="main">{children}</main>
      <SiteFooter />
    </>
  );
}
