export type FooterLink = { label: string; href: string };

export type FooterColumn = {
  heading: string;
  links: FooterLink[];
};

// Figma "zhic wood .com" footer — برند + فروشگاه columns. The third column
// («ارتباط با ما») is built from siteConfig (socials + phone) in SiteFooter.
export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'برند',
    links: [
      { label: 'درباره ما', href: '/about' },
      { label: 'سوالات متداول', href: '/faq' },
      { label: 'مجله', href: '/journal' },
    ],
  },
  {
    heading: 'فروشگاه',
    links: [
      { label: 'سرویس خواب', href: '/bedroom-set' },
      { label: 'تخت خواب', href: '/bedroom-furniture/bed' },
      { label: 'کمد و دراور', href: '/bedroom-furniture/wardrobe' },
      { label: 'اکسسوری', href: '/bedroom-furniture/complement' },
    ],
  },
];

export const FOOTER_LEGAL: FooterLink[] = [
  { label: 'حریم خصوصی', href: '/privacy' },
  { label: 'شرایط استفاده', href: '/terms' },
];

// Legal bar — verbatim from the Figma footer.
export const FOOTER_SINCE = 'SINCE 2008';
export const FOOTER_TAGLINE = 'ساخته شده برای ماندن';
export const FOOTER_PITCH = 'طراحی‌شده برای آرامش روزهای شما.';
export const FOOTER_COPYRIGHT_LINE = '© شرکت هنر چوب ژیک، تمامی حقوق محفوظ است';
