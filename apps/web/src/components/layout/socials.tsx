// Shared social-link primitives — used by the footer and the mobile menu.

export type SocialLink = {
  platform: 'instagram' | 'telegram' | 'whatsapp' | 'aparat' | 'youtube' | 'linkedin' | 'pinterest';
  url: string;
};

export const SOCIAL_LABELS: Record<SocialLink['platform'], string> = {
  instagram: 'اینستاگرام', telegram: 'تلگرام', whatsapp: 'واتس‌اپ',
  aparat: 'آپارات', youtube: 'یوتیوب', linkedin: 'لینکدین', pinterest: 'پینترست',
};

export const VALID_SOCIAL_PLATFORMS: ReadonlyArray<SocialLink['platform']> =
  ['instagram', 'telegram', 'whatsapp', 'aparat', 'youtube', 'linkedin', 'pinterest'];

export function SocialIcon({ platform }: { platform: SocialLink['platform'] }) {
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
