import type { Metadata } from 'next';
import { OccupancyIntro } from '@/components/bedroom-set/OccupancyIntro';
import { OccupancyContent } from '@/components/bedroom-set/OccupancyContent';
import type { LexicalRoot } from '@/lib/payload';

export const metadata: Metadata = { title: 'Lab — occupancy hub sections', robots: { index: false } };

// Mock lexical value for the SEO content block (heading + paragraphs + list + link).
const CONTENT = {
  root: {
    children: [
      { type: 'paragraph', children: [{ type: 'text', text: 'برای نخستین اتاق کودک، ایمنی و کیفیت چوب مهم‌ترین معیارهاست. سرویس‌های ژیک از گردوی ایرانی ساخته می‌شوند و با استانداردهای ایمنی کودک مطابقت دارند.' }] },
      { type: 'heading', tag: 'h3', children: [{ type: 'text', text: 'چه نکاتی مهم است؟' }] },
      { type: 'list', listType: 'bullet', children: [
        { type: 'listitem', children: [{ type: 'text', text: 'تخت قابل‌تبدیل که با سال‌های رشد کودک همراه می‌شود.' }] },
        { type: 'listitem', children: [{ type: 'text', text: 'رنگ‌های بدون سرب و قابل‌شست‌وشو.' }] },
        { type: 'listitem', children: [{ type: 'text', text: 'لبه‌های گرد و اتصالات ایمن.' }] },
      ] },
      { type: 'paragraph', children: [
        { type: 'text', text: 'برای مشاوره‌ی رایگان ' },
        { type: 'link', fields: { url: '/contact' }, children: [{ type: 'text', text: 'با ما تماس بگیرید' }] },
        { type: 'text', text: '.' },
      ] },
    ],
  },
} as unknown as LexicalRoot;

export default function LabOccupancyHub() {
  return (
    <main className="min-h-screen bg-ivory py-10">
      <div className="mx-auto w-full max-w-[430px]" style={{ containerType: 'inline-size' }}>
        <OccupancyIntro
          heading="اتاقی که با کودک بزرگ می‌شود"
          body={'سرویس‌های نوزاد ژیک با تخت‌های قابل‌تبدیل و قطعات ایمن طراحی شده‌اند\nتا سال‌های اول رشد را همراهی کنند.'}
        />
        <div className="mt-[40px]">
          <OccupancyContent value={CONTENT} heading="درباره‌ی سرویس خواب نوزاد" />
        </div>
      </div>
    </main>
  );
}
