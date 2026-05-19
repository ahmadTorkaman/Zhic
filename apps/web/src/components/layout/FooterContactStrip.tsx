import Link from 'next/link';
import { Container } from '@zhic/ui';
import { InquiryFormSlim } from '@/components/inquiry/InquiryFormSlim';
import { NewsletterSignup } from './NewsletterSignup';
import { RichText } from '@/lib/richtext';
import type { LexicalRoot } from '@/lib/payload';
import './footer-contact-strip.css';

export type SocialLink = {
  platform: 'instagram' | 'telegram' | 'whatsapp' | 'aparat' | 'youtube' | 'linkedin' | 'pinterest';
  url: string;
};

export type FooterContactStripProps = {
  contactPhone?: string;
  contactEmail?: string;
  address?: LexicalRoot | null;
  hours?: string;
  socials?: SocialLink[];
};

const SOCIAL_LABELS: Record<SocialLink['platform'], string> = {
  instagram: 'اینستاگرام', telegram: 'تلگرام', whatsapp: 'واتس‌اپ',
  aparat: 'آپارات', youtube: 'یوتیوب', linkedin: 'لینکدین', pinterest: 'پینترست',
};

export function FooterContactStrip({ contactPhone, contactEmail, address, hours, socials }: FooterContactStripProps) {
  return (
    <section className="zh-fcs" aria-label="در تماس باشیم">
      <Container>
        <div className="zh-fcs__head">
          <div className="zh-fcs__eyebrow">در تماس باشیم</div>
          <h2 className="zh-fcs__heading">هر سؤال، هر سفارش — یک پیام فاصله</h2>
          <p className="zh-fcs__lead">
            اگر درباره‌ی محصول، تحویل یا سفارش‌سازی پرسشی دارید، فرم را پر کنید یا مستقیم از طریق راه‌های ارتباطی زیر با ما تماس بگیرید.
          </p>
        </div>

        <div className="zh-fcs__grid">
          {/* Card 1 — inline form */}
          <div className="zh-fcs__card">
            <div className="zh-fcs__label">پیام مستقیم</div>
            <InquiryFormSlim tone="dark" />
          </div>

          {/* Card 2 — contact info */}
          <div className="zh-fcs__card zh-fcs__info">
            <div className="zh-fcs__label">راه‌های ارتباطی</div>
            <ul>
              {contactPhone && (
                <li>
                  <svg className="zh-fcs__ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3 3h4l1.5 3.5L6 8a8 8 0 003 3l1.5-2.5L14 10v3a1 1 0 01-1 1A11 11 0 012 3a1 1 0 011-1z" strokeLinejoin="round" />
                  </svg>
                  <div>
                    <a href={`tel:${contactPhone.replace(/[^\d+]/g, '')}`} dir="ltr">{contactPhone}</a>
                    {hours && <div className="zh-fcs__sub">{hours}</div>}
                  </div>
                </li>
              )}
              {contactEmail && (
                <li>
                  <svg className="zh-fcs__ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="1.5" y="3" width="13" height="10" rx="1" />
                    <path d="M2 4l6 5 6-5" strokeLinejoin="round" />
                  </svg>
                  <a href={`mailto:${contactEmail}`} dir="ltr">{contactEmail}</a>
                </li>
              )}
              {address && (
                <li>
                  <svg className="zh-fcs__ico" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M8 14s5-4.5 5-8a5 5 0 10-10 0c0 3.5 5 8 5 8z" strokeLinejoin="round" />
                    <circle cx="8" cy="6" r="2" />
                  </svg>
                  <div className="zh-fcs__addr">
                    <RichText value={address} />
                  </div>
                </li>
              )}
            </ul>
          </div>

          {/* Card 3 — newsletter + socials */}
          <div className="zh-fcs__card">
            <div className="zh-fcs__label">خبرنامه</div>
            <h3 className="zh-fcs__card-h3">تازه‌ها و کلکسیون‌های جدید</h3>
            <NewsletterSignup />

            {socials && socials.length > 0 && (
              <>
                <div className="zh-fcs__label" style={{ marginTop: '1.25rem' }}>شبکه‌های اجتماعی</div>
                <div className="zh-fcs__socials">
                  {socials.map((s, i) => (
                    <Link key={i} href={s.url} className="zh-fcs__social" aria-label={SOCIAL_LABELS[s.platform]}>
                      <SocialIcon platform={s.platform} />
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}

function SocialIcon({ platform }: { platform: SocialLink['platform'] }) {
  switch (platform) {
    case 'instagram':
      return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>);
    case 'telegram':
      return (<svg viewBox="0 0 24 24" fill="currentColor"><path d="M21 4.5L2.5 11.5l5.5 2 2 6 3-3.5 5 4 3-15.5z" stroke="none"/></svg>);
    case 'whatsapp':
      return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21l1.5-5A9 9 0 1112 21H7l-4 .5z" strokeLinejoin="round"/></svg>);
    case 'aparat':
      return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/><path d="M9 9l6 3-6 3z" fill="currentColor"/></svg>);
    default:
      return (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="9"/></svg>);
  }
}
