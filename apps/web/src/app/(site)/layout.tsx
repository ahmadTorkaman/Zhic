import type { ReactNode } from 'react';
import { SiteFooter, SiteHeader, SkipLink } from '@zhic/ui';
import { toPersianDigits } from '@zhic/locale';
import SmoothScrollProvider from '@/components/providers/SmoothScrollProvider';
import { NAV_LINKS } from '@/lib/constants';

const FOOTER_COLUMNS = [
  {
    title: 'محصولات',
    links: [
      { label: 'همه‌ی محصولات', href: '/products' },
      { label: 'مجموعه‌ها', href: '/collections' },
      { label: 'دسته‌بندی‌ها', href: '/categories' },
    ],
  },
  {
    title: 'درباره‌ی ما',
    links: [
      { label: 'داستان ما', href: '/about' },
      { label: 'کارگاه', href: '/atelier' },
      { label: 'ژورنال', href: '/journal' },
    ],
  },
  {
    title: 'شوروم‌ها',
    links: [
      { label: 'فهرست شوروم‌ها', href: '/showrooms' },
      { label: 'رویدادها', href: '/events' },
    ],
  },
  {
    title: 'خدمات',
    links: [
      { label: 'تماس', href: '/contact' },
      { label: 'پرسش‌های متداول', href: '/faq' },
      { label: 'مراقبت و گارانتی', href: '/care' },
      { label: 'ارسال و تحویل', href: '/shipping-and-delivery' },
      { label: 'بازگشت کالا', href: '/returns' },
      { label: 'دسترسی‌پذیری', href: '/accessibility' },
      { label: 'حریم خصوصی', href: '/privacy' },
      { label: 'شرایط استفاده', href: '/terms' },
    ],
  },
];

function InstagramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.6" fill="currentColor" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        d="M21 3 L2 11 L10 14 L13 21 L21 3 Z M10 14 L16 8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      width="18"
      height="18"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path
        d="M3 7 L12 13 L21 7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

const SOCIALS = [
  {
    label: 'اینستاگرام',
    href: 'https://instagram.com/zhicwood',
    icon: <InstagramIcon />,
  },
  {
    label: 'تلگرام',
    href: 'https://t.me/zhicwood',
    icon: <TelegramIcon />,
  },
  {
    label: 'ایمیل',
    href: 'mailto:hello@zhicwood.com',
    icon: <MailIcon />,
  },
];

export default function SiteLayout({ children }: { children: ReactNode }) {
  const year = toPersianDigits(new Date().getFullYear());
  const navItems = NAV_LINKS.map((link) => ({
    label: link.label,
    href: link.href,
  }));

  return (
    <SmoothScrollProvider>
      <SkipLink href="#main">پرش به محتوا</SkipLink>
      <SiteHeader navItems={navItems} />
      <main id="main">{children}</main>
      <SiteFooter
        columns={FOOTER_COLUMNS}
        newsletter={{
          heading: 'عضویت در خبرنامه',
          helpText:
            'شماره موبایل خود را وارد کنید تا از تازه‌ها مطلع شوید.',
          placeholder: '۰۹۱۲ ۳۴۵ ۶۷۸۹',
          submitLabel: 'عضویت',
        }}
        socials={SOCIALS}
        copyright={<>© {year} شرکت ژیک — تمام حقوق محفوظ است.</>}
      />
    </SmoothScrollProvider>
  );
}
