import type { GlobalConfig } from 'payload'

export const Terms: GlobalConfig = {
  slug: 'terms',
  label: 'شرایط و قوانین',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'عنوان صفحه',
      defaultValue: 'شرایط و قوانین',
    },
    {
      name: 'body',
      type: 'richText',
      label: 'متن صفحه',
    },
  ],
}
