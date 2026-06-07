'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Container } from '@zhic/ui';
import {
  FOOTER_COLUMNS,
  FOOTER_LEGAL,
  FOOTER_COPYRIGHT_LINE,
  FOOTER_SINCE,
  FOOTER_TAGLINE,
  FOOTER_PITCH,
} from './footerLinks';
import { SOCIAL_LABELS, VALID_SOCIAL_PLATFORMS, type SocialLink } from './socials';
import { Modal } from '@/components/shared/Modal';
import { InquiryForm } from '@/components/inquiry/InquiryForm';
import { NewsletterSignup } from './NewsletterSignup';
import type { PayloadSiteConfig } from '@/lib/payload';
import './site-footer.css';

/** Routes where the footer is hidden — /bedroom-set ends in a full-screen
 *  featured takeover, so the footer is suppressed there. */
const FOOTER_HIDDEN_ROUTES = new Set<string>(['/bedroom-set']);

// Static fallback city list for the consultation form (mirrors /contact).
const CITIES = ['تهران', 'اصفهان', 'همدان', 'مشهد', 'شیراز', 'تبریز', 'سایر شهرها'];

export type SiteFooterProps = {
  siteConfig?: PayloadSiteConfig | null;
};

export function SiteFooter({ siteConfig }: SiteFooterProps = {}) {
  const pathname = usePathname();
  const [consultOpen, setConsultOpen] = useState(false);
  const [newsletterOpen, setNewsletterOpen] = useState(false);

  if (pathname && FOOTER_HIDDEN_ROUTES.has(pathname)) return null;

  const socials = (siteConfig?.socials ?? []).filter((s): s is SocialLink =>
    VALID_SOCIAL_PLATFORMS.includes(s.platform as SocialLink['platform']),
  );
  const phone = siteConfig?.contactPhone ?? undefined;

  return (
    <>
      {/* CTA band — opens the consultation / showroom-visit form. */}
      <section className="zh-foot-cta">
        <Container>
          <div className="zh-foot-cta__row">
            <p className="zh-foot-cta__eyebrow">مشاوره تخصصی برای خرید سرویس خواب مناسب</p>
            <button type="button" className="zh-foot-cta__btn" onClick={() => setConsultOpen(true)}>
              دریافت مشاوره رایگان
            </button>
          </div>
        </Container>
      </section>

      <footer className="zh-foot">
        <Container>
          <div className="zh-foot__brand">
            <img src="/zhic-logo.svg" alt="ژیک" className="zh-foot__logo" />
            <div className="zh-foot__tagline">
              <span aria-hidden className="zh-foot__dash" />
              {FOOTER_TAGLINE}
              <span aria-hidden className="zh-foot__dash" />
            </div>
          </div>

          <div className="zh-foot__cols">
            {/* ارتباط با ما — built from siteConfig (socials + phone + newsletter). */}
            <div className="zh-foot__col">
              <h4 className="zh-foot__h">ارتباط با ما</h4>
              <ul className="zh-foot__list">
                {socials.map((s, i) => (
                  <li key={s.platform + i}>
                    <Link href={s.url} target="_blank" rel="noopener noreferrer" className="zh-foot__link">
                      {SOCIAL_LABELS[s.platform]}
                    </Link>
                  </li>
                ))}
                {phone && (
                  <li>
                    <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} dir="ltr" className="zh-foot__link">
                      تلفن
                    </a>
                  </li>
                )}
                <li>
                  <button type="button" className="zh-foot__link zh-foot__link--btn" onClick={() => setNewsletterOpen(true)}>
                    خبرنامه
                  </button>
                </li>
              </ul>
            </div>

            {FOOTER_COLUMNS.map((col) => (
              <div key={col.heading} className="zh-foot__col">
                <h4 className="zh-foot__h">{col.heading}</h4>
                <ul className="zh-foot__list">
                  {col.links.map((link) => (
                    <li key={`${col.heading}-${link.label}`}>
                      <Link href={link.href} className="zh-foot__link">{link.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="zh-foot__legal">
            <div className="zh-foot__since">
              <span aria-hidden className="zh-foot__dash" />
              {FOOTER_SINCE}
              <span aria-hidden className="zh-foot__dash" />
            </div>
            <p className="zh-foot__pitch">{FOOTER_PITCH}</p>
            <p className="zh-foot__copy">
              {FOOTER_COPYRIGHT_LINE}
              {FOOTER_LEGAL.map((link) => (
                <span key={link.href}>
                  <span aria-hidden className="zh-foot__sep">·</span>
                  <Link href={link.href} className="zh-foot__link">{link.label}</Link>
                </span>
              ))}
            </p>
          </div>
        </Container>
      </footer>

      <Modal open={consultOpen} onClose={() => setConsultOpen(false)} title="دریافت مشاوره رایگان">
        <InquiryForm cities={CITIES} tone="light" />
      </Modal>

      <Modal open={newsletterOpen} onClose={() => setNewsletterOpen(false)} title="عضویت در خبرنامه">
        <p className="mb-4 text-small text-stone">
          شماره‌ی موبایل خود را وارد کنید تا از تازه‌ها و کلکسیون‌های جدید باخبر شوید.
        </p>
        <NewsletterSignup />
      </Modal>
    </>
  );
}
