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
      label: 'رسانه هیرو',
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
      name: 'brand_statement',
      type: 'richText',
      label: 'بیانیه برند',
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
