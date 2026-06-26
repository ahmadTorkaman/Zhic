import type { GlobalConfig } from 'payload'
import { publishedContentAccess } from '../lib/access'

export const Home: GlobalConfig = {
  slug: 'home',
  label: 'صفحه اصلی',
  access: publishedContentAccess,
  fields: [
    {
      name: 'heroMedia',
      type: 'upload',
      relationTo: 'media',
      label: 'رسانه هیرو (deprecated — use heroSlides)',
      admin: { description: 'این فیلد در نسخه‌ی بعدی حذف می‌شود. به‌جای آن heroSlides را پر کنید.' },
    },
    {
      name: 'heroHeading',
      type: 'text',
      label: 'عنوان هیرو',
    },
    {
      name: 'heroSubheading',
      type: 'text',
      label: 'زیرعنوان هیرو',
    },
    {
      name: 'heroSlides',
      type: 'array',
      label: 'اسلایدهای هیرو',
      minRows: 1,
      maxRows: 8,
      fields: [
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'تصویر',
        },
        {
          name: 'alt',
          type: 'text',
          required: true,
          label: 'متن جایگزین (a11y)',
        },
        {
          name: 'link',
          type: 'text',
          label: 'لینک (اختیاری)',
          admin: { description: 'مسیر داخلی یا URL کامل. اگر خالی باشد اسلاید کلیک‌پذیر نیست.' },
        },
      ],
    },
    {
      name: 'brandStatement',
      type: 'richText',
      label: 'بیانیه برند',
    },
    {
      name: 'aboutMedia',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر بخش درباره (از همدان، برای ایران)',
      admin: {
        description: 'اختیاری — اگر خالی باشد، بخش درباره فقط متن نمایش می‌دهد.',
      },
    },
    {
      name: 'aboutBackground',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر پس‌زمینه‌ی بخش درباره',
      admin: {
        description:
          'اختیاری — روی لایه‌ی سبز پشت متن «درباره‌ی ژیک» با شفافیت کم نمایش داده می‌شود. اگر خالی باشد، تصویر پیش‌فرض (منبت سلین) استفاده می‌شود.',
      },
    },
    {
      name: 'featuredDesigns',
      type: 'relationship',
      relationTo: 'designs',
      hasMany: true,
      label: 'طرح‌های ویژه',
    },
    {
      name: 'journalTeaserHeading',
      type: 'text',
      label: 'عنوان تیزر ژورنال',
    },
    {
      name: 'inquiryCtaHeading',
      type: 'text',
      label: 'عنوان دکمه استعلام',
    },
  ],
}
