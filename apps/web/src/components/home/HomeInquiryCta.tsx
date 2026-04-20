import { DarkSplitHero } from '@/components/hero/DarkSplitHero';
import { InquiryFormSlim } from '@/components/inquiry/InquiryFormSlim';

export type HomeInquiryCtaProps = {
  heading?: string;
  lead?: string;
  showroomsHref?: string;
};

export function HomeInquiryCta({
  heading = 'با ما در تماس باشید',
  lead = 'برای استعلام قیمت، رزرو بازدید از شوروم، یا مشاوره‌ی پیش از خرید. تیم ما آماده‌ی پاسخ‌گویی است.',
}: HomeInquiryCtaProps) {
  return (
    <DarkSplitHero variant="section" title={heading} lead={lead}>
      <InquiryFormSlim />
    </DarkSplitHero>
  );
}
