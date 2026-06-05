import type { GlobalConfig } from 'payload'
import { publishedContentAccess } from '../lib/access'

export const Home: GlobalConfig = {
  slug: 'home',
  label: 'صفحه اصلی',
  access: publishedContentAccess,
  fields: [
    {
      name: 'hero_media',
      type: 'upload',
      relationTo: 'media',
      label: 'رسانه هیرو (deprecated — use heroSlides)',
      admin: { description: 'این فیلد در نسخه‌ی بعدی حذف می‌شود. به‌جای آن heroSlides را پر کنید.' },
    },
    {
      name: 'hero_heading',
      type: 'text',
      label: 'عنوان هیرو',
    },
    {
      name: 'hero_subheading',
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
      name: 'brand_statement',
      type: 'richText',
      label: 'بیانیه برند',
    },
    {
      name: 'about_media',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر بخش درباره (از همدان، برای ایران)',
      admin: {
        description: 'اختیاری — اگر خالی باشد، بخش درباره فقط متن نمایش می‌دهد.',
      },
    },
    {
      name: 'featured_designs',
      type: 'relationship',
      relationTo: 'designs',
      hasMany: true,
      label: 'طرح‌های ویژه',
    },
    {
      name: 'journal_teaser_heading',
      type: 'text',
      label: 'عنوان تیزر ژورنال',
    },
    {
      name: 'inquiry_cta_heading',
      type: 'text',
      label: 'عنوان دکمه استعلام',
    },
  ],
}
