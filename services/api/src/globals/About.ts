import type { GlobalConfig } from 'payload'
import { publishedContentAccess } from '../lib/access'

export const About: GlobalConfig = {
  slug: 'about',
  label: 'درباره ما',
  access: publishedContentAccess,
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'عنوان صفحه',
      defaultValue: 'درباره ژیک',
    },
    {
      name: 'body',
      type: 'richText',
      label: 'متن صفحه',
    },
  ],
}
