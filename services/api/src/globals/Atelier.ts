import type { GlobalConfig } from 'payload'

export const Atelier: GlobalConfig = {
  slug: 'atelier',
  label: 'کارگاه',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'عنوان صفحه',
      defaultValue: 'کارگاه ژیک',
    },
    {
      name: 'body',
      type: 'richText',
      label: 'متن صفحه',
    },
  ],
}
