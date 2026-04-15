import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/slugify'

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'مقاله', plural: 'مقالات' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'published_at'],
  },
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.title && !data?.slug) {
          data.slug = slugify(data.title as string)
        }
        return data
      },
    ],
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'عنوان',
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      label: 'اسلاگ',
      admin: {
        position: 'sidebar',
        description: 'Auto-generated from title if left empty',
      },
    },
    {
      name: 'body',
      type: 'richText',
      label: 'متن مقاله',
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'خلاصه',
      admin: {
        description: 'Short summary for index pages and cards',
      },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر کاور',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'categories',
      label: 'دسته‌بندی',
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: 'تگ‌ها',
    },
    {
      name: 'published_at',
      type: 'date',
      label: 'تاریخ انتشار',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    {
      name: 'author',
      type: 'text',
      label: 'نویسنده',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
