'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@zhic/ui';
import { FOOTER_COLUMNS, FOOTER_LEGAL, FOOTER_COPYRIGHT_LINE } from './footerLinks';
import { FooterContactStrip, type SocialLink } from './FooterContactStrip';
import type { PayloadSiteConfig } from '@/lib/payload';

const VALID_SOCIAL_PLATFORMS: ReadonlyArray<SocialLink['platform']> =
  ['instagram', 'telegram', 'whatsapp', 'aparat', 'youtube', 'linkedin', 'pinterest'];

/** Routes where the footer (contact strip + nav columns + legal) is hidden.
 *  /bedroom-set ends in a full-screen featured takeover that auto-raises when you
 *  reach the end of the writing section, so the footer is suppressed there. */
const FOOTER_HIDDEN_ROUTES = new Set<string>(['/bedroom-set']);

export type SiteFooterProps = {
  siteConfig?: PayloadSiteConfig | null;
};

export function SiteFooter({ siteConfig }: SiteFooterProps = {}) {
  const pathname = usePathname();
  if (pathname && FOOTER_HIDDEN_ROUTES.has(pathname)) return null;

  const socials = (siteConfig?.socials ?? []).filter((s): s is SocialLink =>
    VALID_SOCIAL_PLATFORMS.includes(s.platform as SocialLink['platform']),
  );

  return (
    <footer className="bg-forest-dark pb-6 pt-9 text-ivory">
      <Container>
        <FooterContactStrip
          contactPhone={siteConfig?.contactPhone ?? undefined}
          contactEmail={siteConfig?.contactEmail ?? undefined}
          address={siteConfig?.address ?? null}
          hours={siteConfig?.hours ?? undefined}
          socials={socials}
        />

        <div
          className="mb-6 mt-7 grid grid-cols-2 gap-5 md:mb-8 md:mt-10 md:grid-cols-4 md:gap-7 border-t pt-7 md:pt-9"
          style={{ borderTopColor: 'rgba(250, 250, 247, 0.1)' }}
        >
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-4 text-small font-bold text-ivory">{col.heading}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={`${col.heading}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="block text-small font-light text-sand transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:text-ivory"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col items-center gap-3 border-t pt-5 text-center text-eyebrow font-light md:flex-row md:justify-between md:text-start"
          style={{ borderTopColor: 'rgba(250, 250, 247, 0.06)', color: 'rgba(250, 250, 247, 0.35)' }}
        >
          <span>{FOOTER_COPYRIGHT_LINE}</span>
          <span className="space-x-3">
            {FOOTER_LEGAL.map((link, i) => (
              <span key={link.href}>
                {i > 0 ? <span aria-hidden className="mx-2">·</span> : null}
                <Link
                  href={link.href}
                  className="transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:text-ivory"
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </span>
        </div>
      </Container>
    </footer>
  );
}
