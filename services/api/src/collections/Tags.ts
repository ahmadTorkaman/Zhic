import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/slugify.js'
import { publishedContentAccess } from '../lib/access.js'

export const Tags: CollectionConfig = {
  slug: 'tags',
  labels: { singular: 'تگ', plural: 'تگ‌ها' },
  admin: {
    useAsTitle: 'name',
    group: 'کاتالوگ',
  },
  access: publishedContentAccess,
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.name && !data?.slug) {
          data.slug = slugify(data.name as string)
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'نام تگ',
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      label: 'اسلاگ',
      admin: {
        position: 'sidebar',
        description: 'Auto-generated from name if left empty',
      },
    },
  ],
}
