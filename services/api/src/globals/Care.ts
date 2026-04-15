import type { GlobalConfig } from 'payload'

export const Care: GlobalConfig = {
  slug: 'care',
  label: 'نگهداری',
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
