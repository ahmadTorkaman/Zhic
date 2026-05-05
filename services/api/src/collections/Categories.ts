import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/slugify.js'
import { publishedContentAccess } from '../lib/access.js'
import { seoFields } from '../fields/seoFields.js'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'دسته‌بندی', plural: 'دسته‌بندی‌ها' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'parent', 'slug'],
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
    {
      name: 'description',
      type: 'textarea',
      label: 'توضیحات',
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      label: 'دسته‌بندی والد',
      admin: {
        position: 'sidebar',
        description: 'برای ساخت ساختار درختی (اختیاری)',
      },
    },
    seoFields,
  ],
}
