'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  FOOTER_COLUMNS,
  FOOTER_COPYRIGHT_LINE,
  FOOTER_SINCE,
  FOOTER_TAGLINE,
  FOOTER_TAGLINE_KASHIDA,
  FOOTER_PITCH,
} from './footerLinks';
import { SOCIAL_LABELS, VALID_SOCIAL_PLATFORMS, type SocialLink } from './socials';
import { Modal } from '@/components/shared/Modal';
import { InquiryForm } from '@/components/inquiry/InquiryForm';
import type { PayloadSiteConfig } from '@/lib/payload';
import './site-footer.css';

/** Routes where the footer is hidden — /bedroom-set ends in a full-screen
 *  featured takeover, so the footer is suppressed there. */
const FOOTER_HIDDEN_ROUTES = new Set<string>(['/bedroom-set']);

// Static fallback city list for the consultation form (mirrors /contact).
const CITIES = ['تهران', 'اصفهان', 'همدان', 'مشهد', 'شیراز', 'تبریز', 'سایر شهرها'];

/** Gold left-chevron bullet before each footer link (Figma 402:139 vectors). */
function FootChevron() {
  return (
    <svg className="zh-foot__bullet" viewBox="0 0 4 6" fill="none" aria-hidden>
      <path d="M3.2 0.6 0.8 3l2.4 2.4" stroke="currentColor" strokeWidth="0.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export type SiteFooterProps = {
  siteConfig?: PayloadSiteConfig | null;
};

/**
 * Site footer, rebuilt exactly from Figma 402:139 (Group 13): cream top strip +
 * ZHIC wordmark, a vase-photo consultation card straddling the cream→forest
 * seam, then the forest body — ژیک mark, «ساخته شده برای ماندن», three
 * chevron-bulleted columns (فروشگاه / برند / ارتباط با ما) with vertical
 * dividers, and a SINCE 2008 / © bottom bar. Data unchanged (siteConfig socials
 * + phone, FOOTER_COLUMNS, the consultation modal).
 */
export function SiteFooter({ siteConfig }: SiteFooterProps = {}) {
  const pathname = usePathname();
  const [consultOpen, setConsultOpen] = useState(false);

  if (pathname && FOOTER_HIDDEN_ROUTES.has(pathname)) return null;

  const socials = (siteConfig?.socials ?? []).filter((s): s is SocialLink =>
    VALID_SOCIAL_PLATFORMS.includes(s.platform as SocialLink['platform']),
  );
  const phone = siteConfig?.contactPhone ?? undefined;

  // Comp column order (RTL grid → first child lands right): فروشگاه, برند,
  // then ارتباط با ما last (renders left).
  const linkColumns = [...FOOTER_COLUMNS].reverse();

  return (
    <>
      {/* Top wordmark strip */}
      <div className="zh-foot-top">
        <div className="zh-foot-inner">
          <div className="zh-foot-top__row">
            <span aria-hidden className="zh-foot-top__rule" />
            <img src="/footer/zhic-wordmark.webp" alt="ژیک" className="zh-foot-top__mark" />
            <span aria-hidden className="zh-foot-top__rule" />
          </div>
        </div>
      </div>

      {/* Consultation card — opens the consultation / showroom-visit form. */}
      <section className="zh-foot-cta">
        <div className="zh-foot-inner">
          <div className="zh-foot-cta__card">
            <div className="zh-foot-cta__body">
              <p className="zh-foot-cta__h">زیبایی</p>
              <p className="zh-foot-cta__sub">از یک انتخاب ساده آغاز می‌شود</p>
              <p className="zh-foot-cta__eyebrow">مشاوره تخصصی برای خرید سرویس خواب مناسب</p>
              <button type="button" className="zh-foot-cta__btn" onClick={() => setConsultOpen(true)}>
                دریافت مشاوره رایگان
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Forest body */}
      <footer className="zh-foot">
        <div className="zh-foot-inner">
          <div className="zh-foot__brand">
            <img src="/footer/zhic-mark.webp" alt="ژیک" className="zh-foot__mark" />
            <div className="zh-foot__tagline">
              <span aria-hidden className="zh-foot__dash" />
              <span aria-label={FOOTER_TAGLINE}>{FOOTER_TAGLINE_KASHIDA}</span>
              <span aria-hidden className="zh-foot__dash" />
            </div>
          </div>

          <div className="zh-foot__cols">
            {linkColumns.map((col) => (
              <div key={col.heading} className="zh-foot__col">
                <h4 className="zh-foot__h">{col.heading}</h4>
                <ul className="zh-foot__list">
                  {col.links.map((link) => (
                    <li key={`${col.heading}-${link.label}`}>
                      <Link href={link.href} className="zh-foot__link">
                        <FootChevron />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}

            {/* ارتباط با ما — socials + phone (comp has no newsletter row). */}
            <div className="zh-foot__col">
              <h4 className="zh-foot__h">ارتباط با ما</h4>
              <ul className="zh-foot__list">
                {socials.map((s, i) => (
                  <li key={s.platform + i}>
                    <Link href={s.url} target="_blank" rel="noopener noreferrer" className="zh-foot__link">
                      <FootChevron />
                      {SOCIAL_LABELS[s.platform]}
                    </Link>
                  </li>
                ))}
                {phone && (
                  <li>
                    <a href={`tel:${phone.replace(/[^\d+]/g, '')}`} className="zh-foot__link">
                      <FootChevron />
                      تلفن
                    </a>
                  </li>
                )}
              </ul>
            </div>
          </div>

          <div className="zh-foot__legal">
            <div className="zh-foot__since">
              <span aria-hidden className="zh-foot__dash" />
              {FOOTER_SINCE}
              <span aria-hidden className="zh-foot__dash" />
            </div>
            <p className="zh-foot__pitch">{FOOTER_PITCH}</p>
            <p className="zh-foot__copy">{FOOTER_COPYRIGHT_LINE}</p>
          </div>
        </div>
      </footer>

      <Modal open={consultOpen} onClose={() => setConsultOpen(false)} title="دریافت مشاوره رایگان">
        <InquiryForm cities={CITIES} tone="light" />
      </Modal>
    </>
  );
}
