import type { GlobalConfig } from 'payload'
import { publishedContentAccess } from '../lib/access'

export const Care: GlobalConfig = {
  slug: 'care',
  label: 'نگهداری',
  access: publishedContentAccess,
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'عنوان صفحه',
      defaultValue: 'راهنمای نگهداری',
    },
    {
      name: 'body',
      type: 'richText',
      label: 'متن صفحه',
    },
  ],
}
