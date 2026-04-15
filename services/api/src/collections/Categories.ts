import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/slugify'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'دسته‌بندی', plural: 'دسته‌بندی‌ها' },
  admin: {
    useAsTitle: 'name',
  },
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
      label: 'نام دسته‌بندی',
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
