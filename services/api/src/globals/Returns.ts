import type { GlobalConfig } from 'payload'
import { publishedContentAccess } from '../lib/access.js'

export const Returns: GlobalConfig = {
  slug: 'returns',
  label: 'شرایط مرجوعی',
  access: publishedContentAccess,
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'عنوان صفحه',
      defaultValue: 'شرایط مرجوعی',
    },
    {
      name: 'body',
      type: 'richText',
      label: 'متن صفحه',
    },
  ],
}
