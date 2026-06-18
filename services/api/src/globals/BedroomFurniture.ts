import type { GlobalConfig } from 'payload'
import { publishedContentAccess } from '../lib/access'

/** Editorial config for the /bedroom-furniture catalog root. The showcase cards
 *  reference Categories (label + /bedroom-furniture/<slug> link come from the
 *  category; archImage is the coverflow art). Room cards are self-contained
 *  cross-links to the /bedroom-set occupancy hubs. */
export const BedroomFurniture: GlobalConfig = {
  slug: 'bedroom-furniture',
  label: 'صفحه مبلمان اتاق خواب',
  access: publishedContentAccess,
  fields: [
    { name: 'heroTitle', type: 'textarea', label: 'عنوان هیرو', admin: { description: 'برای شکستن به دو خط از Enter استفاده کنید. اگر خالی باشد، عنوان پیش‌فرض طراحی نمایش داده می‌شود.' } },
    { name: 'heroSubtitle', type: 'text', label: 'زیرعنوان هیرو', admin: { description: 'زیرعنوان زیر تیتر اصلی هیرو.' } },
    { name: 'heroTagline', type: 'text', label: 'شعار هیرو', admin: { description: 'شعار کوتاه زیر زیرعنوان هیرو.' } },
    { name: 'heroCtaLabel', type: 'text', label: 'متن دکمه هیرو', admin: { description: 'پیش‌فرض: «مشاهده».' } },
    { name: 'heroCtaHref', type: 'text', label: 'لینک دکمه هیرو', admin: { description: 'اگر خالی باشد، دکمه به بخش دسته‌بندی‌ها در همین صفحه اسکرول می‌کند.' } },
    { name: 'heroMedia', type: 'upload', relationTo: 'media', label: 'تصویر هیرو', admin: { description: 'تصویر تمام‌عرض هیرو. اگر خالی باشد، تصویر پیش‌فرض طراحی استفاده می‌شود.' } },

    { name: 'showcaseHeading', type: 'text', label: 'عنوان بخش دسته‌بندی', admin: { description: 'پیش‌فرض: «دسته بندی محصولات».' } },
    { name: 'showcaseBody', type: 'textarea', label: 'متن زیر اسلایدر دسته‌بندی', admin: { description: 'پاراگراف توضیحی زیر اسلایدر کاورفلو. از نیم‌فاصله (ZWNJ) استفاده کنید.' } },
    { name: 'showcaseInitial', type: 'number', label: 'اسلاید فعال اولیه', admin: { description: 'شماره‌ی اسلایدی که در ابتدا وسط قرار می‌گیرد (از ۰). خالی = وسط.' } },

    {
      name: 'showcase',
      type: 'array',
      label: 'کارت‌های دسته‌بندی (کاورفلو)',
      labels: { singular: 'کارت دسته‌بندی', plural: 'کارت‌های دسته‌بندی' },
      admin: { description: 'هر کارت به یک دسته‌بندی اشاره می‌کند؛ نام و لینک از همان دسته‌بندی می‌آید. ترتیب نمایش حفظ می‌شود.' },
      fields: [
        { name: 'category', type: 'relationship', relationTo: 'categories', required: true, label: 'دسته‌بندی', admin: { description: 'نام و لینک کارت به‌صورت خودکار از همین دسته‌بندی گرفته می‌شود.' } },
        { name: 'archImage', type: 'upload', relationTo: 'media', required: true, label: 'تصویر قوسی کارت', admin: { description: 'تصویر قوسی کاورفلو برای این کارت (متفاوت از تصویر کاور دسته‌بندی).' } },
      ],
    },
    {
      name: 'rooms',
      type: 'array',
      label: 'کارت‌های اتاق',
      labels: { singular: 'کارت اتاق', plural: 'کارت‌های اتاق' },
      admin: { description: 'کارت‌های شبکه‌ی اتاق‌ها (لینک به هاب‌های /bedroom-set). ترتیب نمایش حفظ می‌شود؛ رنگ پس‌زمینه از طیف طراحی بر اساس ردیف می‌آید.' },
      fields: [
        { name: 'name', type: 'text', required: true, label: 'نام اتاق (مثلاً بزرگسال)', admin: { description: 'نام اتاق که در کارت نمایش داده می‌شود.' } },
        { name: 'display', type: 'text', label: 'نمایش کشیده (اختیاری)', admin: { description: 'شکل کشیده‌ی نام برای نمایش؛ اگر خالی باشد از «نام» استفاده می‌شود.' } },
        { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'تصویر اتاق', admin: { description: 'تصویر اتاق در کارت.' } },
        { name: 'href', type: 'text', required: true, label: 'لینک (مثلاً /bedroom-set/double)', admin: { description: 'مسیر مقصد، با / شروع شود (مثلاً /bedroom-set/double).' } },
      ],
    },
  ],
}
