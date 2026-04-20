export type FooterLink = { label: string; href: string };

export type FooterColumn = {
  heading: string;
  links: FooterLink[];
};

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'محصولات',
    links: [
      { label: 'همه‌ی محصولات', href: '/products' },
      { label: 'مجموعه‌ها', href: '/products' },
      { label: 'دسته‌بندی‌ها', href: '/products' },
    ],
  },
  {
    heading: 'درباره‌ی ما',
    links: [
      { label: 'داستان ما', href: '/about' },
      { label: 'کارگاه', href: '/atelier' },
      { label: 'ژورنال', href: '/journal' },
    ],
  },
  {
    heading: 'شوروم‌ها',
    links: [
      { label: 'فهرست شوروم‌ها', href: '/showrooms' },
      { label: 'رویدادها', href: '/events' },
    ],
  },
  {
    heading: 'خدمات',
    links: [
      { label: 'تماس', href: '/contact' },
      { label: 'پرسش‌های متداول', href: '/faq' },
      { label: 'مراقبت و گارانتی', href: '/care' },
    ],
  },
];

export const FOOTER_LEGAL: FooterLink[] = [
  { label: 'حریم خصوصی', href: '/privacy' },
  { label: 'شرایط استفاده', href: '/terms' },
];

/** Persian-digit Jalali year for the copyright line. Update when the year rolls. */
export const FOOTER_COPYRIGHT_YEAR = '۱۴۰۵';
export const FOOTER_COPYRIGHT_LINE = `© ${FOOTER_COPYRIGHT_YEAR} شرکت ژیک — تمام حقوق محفوظ است.`;
