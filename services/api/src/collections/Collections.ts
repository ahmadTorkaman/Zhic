import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/slugify'
import { publishedContentAccess } from '../lib/access'
import { seoFields } from '../fields/seoFields'

export const Collections: CollectionConfig = {
  slug: 'collections',
  labels: { singular: 'مجموعه', plural: 'مجموعه‌ها' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'featured', 'slug'],
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
      label: 'نام مجموعه',
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
      type: 'richText',
      label: 'توضیحات',
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر شاخص',
    },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      required: true,
      label: 'محصولات',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'نمایش در منوی ناوبری',
      admin: {
        position: 'sidebar',
      },
    },
    seoFields,
  ],
}
