import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/slugify'

export const Materials: CollectionConfig = {
  slug: 'materials',
  labels: { singular: 'متریال', plural: 'متریال‌ها' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'origin', 'slug'],
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
      label: 'نام متریال',
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
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر',
    },
    {
      name: 'origin',
      type: 'text',
      label: 'مبدأ',
      admin: {
        description: 'مثال: «بلژیک»، «گرگان»',
      },
    },
    {
      name: 'careNotes',
      type: 'richText',
      label: 'نکات مراقبت',
    },
    {
      name: 'relatedArticles',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      label: 'مقاله‌های مرتبط',
    },
  ],
}
