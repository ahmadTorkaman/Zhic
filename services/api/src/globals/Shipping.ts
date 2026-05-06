import type { GlobalConfig } from 'payload'
import { publishedContentAccess } from '../lib/access'

export const Shipping: GlobalConfig = {
  slug: 'shipping',
  label: 'ارسال و تحویل',
  access: publishedContentAccess,
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
