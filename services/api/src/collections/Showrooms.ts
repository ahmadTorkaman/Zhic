import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/slugify'

export const Showrooms: CollectionConfig = {
  slug: 'showrooms',
  labels: { singular: 'شوروم', plural: 'شوروم‌ها' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'city', 'is_central'],
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
      label: 'نام شوروم',
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
      name: 'city',
      type: 'text',
      required: true,
      label: 'شهر',
      admin: {
        description: 'Used for SMS routing in inquiry form',
      },
    },
    {
      name: 'address',
      type: 'textarea',
      label: 'آدرس',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'تلفن (عمومی)',
    },
    {
      name: 'manager_name',
      type: 'text',
      label: 'نام مدیر (داخلی)',
      admin: {
        description: 'Internal — not displayed on storefront',
      },
    },
    {
      name: 'manager_phone',
      type: 'text',
      label: 'تلفن مدیر (داخلی)',
      admin: {
        description: 'Internal — SMS routing target for inquiries',
      },
    },
    {
      name: 'hours',
      type: 'text',
      label: 'ساعات کاری',
    },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'گالری',
    },
    {
      name: 'coordinates',
      type: 'group',
      label: 'مختصات جغرافیایی',
      fields: [
        { name: 'lat', type: 'number', label: 'عرض جغرافیایی' },
        { name: 'lng', type: 'number', label: 'طول جغرافیایی' },
      ],
    },
    {
      name: 'is_central',
      type: 'checkbox',
      defaultValue: false,
      label: 'شعبه مرکزی (همدان)',
      admin: {
        position: 'sidebar',
        description: 'Fallback for SMS routing when city has no match',
      },
    },
  ],
}
