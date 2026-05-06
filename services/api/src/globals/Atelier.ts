import type { GlobalConfig } from 'payload'
import { publishedContentAccess } from '../lib/access'

export const Atelier: GlobalConfig = {
  slug: 'atelier',
  label: 'کارگاه',
  access: publishedContentAccess,
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
