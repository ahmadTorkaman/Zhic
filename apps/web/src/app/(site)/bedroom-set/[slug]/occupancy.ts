/** The 4 reserved occupancy slugs that branch to the occupancy-hub view
 *  instead of the series-hub view. Per the canonical IA in
 *  docs/superpowers/handoff-2026-05-23.md. */
export const OCCUPANCY_SLUGS = ['baby', 'teen', 'double', 'bunk'] as const;
export type OccupancySlug = (typeof OCCUPANCY_SLUGS)[number];

export function isOccupancySlug(slug: string): slug is OccupancySlug {
  return (OCCUPANCY_SLUGS as readonly string[]).includes(slug);
}

export const OCCUPANCY_PERSIAN: Record<OccupancySlug, { title: string; tagline: string; eyebrow: string }> = {
  baby: {
    title: 'سرویس خواب نوزاد',
    tagline: 'طرح‌هایی برای نخستین اتاق — جایی برای رشد، نه برای بزرگ‌نمایی.',
    eyebrow: 'گروه سنی',
  },
  teen: {
    title: 'سرویس خواب نوجوان',
    tagline: 'طرح‌هایی برای ۹ تا ۱۸ سال — تختی که با اتاق بزرگ می‌شود.',
    eyebrow: 'گروه سنی',
  },
  double: {
    title: 'سرویس خواب دونفره',
    tagline: 'برای اتاق مشترک — دو‌نفره‌ی استاندارد در ابعاد ۱۴۰، ۱۶۰، و ۱۸۰ سانتی‌متر.',
    eyebrow: 'پیکربندی',
  },
  bunk: {
    title: 'سرویس خواب دوطبقه',
    tagline: 'دو کودک، یک اتاق — تخت‌های دوطبقه با حفاظ و نردبان ثابت.',
    eyebrow: 'پیکربندی',
  },
};
