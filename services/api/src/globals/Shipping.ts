import type { GlobalConfig } from 'payload'

export const Shipping: GlobalConfig = {
  slug: 'shipping',
  label: 'ارسال و تحویل',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'عنوان صفحه',
      defaultValue: 'شرایط ارسال و تحویل',
    },
    {
      name: 'body',
      type: 'richText',
      label: 'متن صفحه',
    },
  ],
}
