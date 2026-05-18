import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/slugify'
import { publishedContentAccess } from '../lib/access'
import { seoFields } from '../fields/seoFields'

export const Rooms: CollectionConfig = {
  slug: 'rooms',
  labels: { singular: 'اتاق', plural: 'اتاق‌ها (دسته‌ی سنی)' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'slug'],
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
    { name: 'name', type: 'text', required: true, label: 'نام اتاق' },
    {
      name: 'slug',
      type: 'text',
      required: true,
      unique: true,
      label: 'اسلاگ',
      admin: { position: 'sidebar', description: 'ASCII فقط: kid, teen, adult' },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      required: true,
      label: 'تصویر کاور',
    },
    {
      name: 'tagline',
      type: 'text',
      maxLength: 200,
      label: 'تک‌خطی توضیحی',
      admin: { description: 'یک جمله که در کارت روی صفحه‌ی اصلی دیده می‌شود.' },
    },
    {
      name: 'longDescription',
      type: 'richText',
      label: 'توضیحات بلند',
    },
    seoFields,
  ],
}
