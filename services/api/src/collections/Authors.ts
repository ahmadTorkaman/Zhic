import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/slugify'
import { publishedContentAccess } from '../lib/access'

export const Authors: CollectionConfig = {
  slug: 'authors',
  labels: { singular: 'نویسنده', plural: 'نویسندگان' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'role'],
    group: 'ژورنال',
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
      label: 'نام نویسنده',
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
      name: 'bio',
      type: 'richText',
      label: 'بیوگرافی',
    },
    {
      name: 'avatar',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر پروفایل',
    },
    {
      name: 'role',
      type: 'text',
      label: 'نقش',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'social',
      type: 'group',
      label: 'شبکه‌های اجتماعی',
      fields: [
        {
          name: 'instagram',
          type: 'text',
          label: 'اینستاگرام',
        },
        {
          name: 'telegram',
          type: 'text',
          label: 'تلگرام',
        },
        {
          name: 'website',
          type: 'text',
          label: 'وب‌سایت',
        },
      ],
    },
  ],
}
