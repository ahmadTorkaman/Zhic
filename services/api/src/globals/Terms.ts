import type { GlobalConfig } from 'payload'
import { publishedContentAccess } from '../lib/access.js'

export const Terms: GlobalConfig = {
  slug: 'terms',
  label: 'شرایط و قوانین',
  access: publishedContentAccess,
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
