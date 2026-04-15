import type { GlobalConfig } from 'payload'

export const Privacy: GlobalConfig = {
  slug: 'privacy',
  label: 'حریم خصوصی',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'عنوان صفحه',
      defaultValue: 'سیاست حریم خصوصی',
    },
    {
      name: 'body',
      type: 'richText',
      label: 'متن صفحه',
    },
  ],
}
