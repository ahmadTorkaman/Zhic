import type { GlobalConfig } from 'payload'
import { publishedContentAccess } from '../lib/access'

export const Events: GlobalConfig = {
  slug: 'events',
  label: 'رویدادها',
  access: publishedContentAccess,
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'عنوان صفحه',
      defaultValue: 'رویدادها',
    },
    {
      name: 'items',
      type: 'array',
      label: 'رویدادها',
      fields: [
        {
          name: 'title',
          type: 'text',
          required: true,
          label: 'عنوان رویداد',
        },
        {
          name: 'description',
          type: 'richText',
          label: 'توضیحات',
        },
        {
          name: 'date',
          type: 'date',
          label: 'تاریخ',
          admin: {
            date: { pickerAppearance: 'dayOnly' },
          },
        },
        {
          name: 'location',
          type: 'text',
          label: 'مکان',
        },
      ],
    },
  ],
}
