import type { GlobalConfig } from 'payload'
import { publishedContentAccess } from '../lib/access.js'

export const Privacy: GlobalConfig = {
  slug: 'privacy',
  label: 'حریم خصوصی',
  access: publishedContentAccess,
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
