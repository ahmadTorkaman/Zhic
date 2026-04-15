import type { GlobalConfig } from 'payload'

export const Faq: GlobalConfig = {
  slug: 'faq',
  label: 'سوالات متداول',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'عنوان صفحه',
      defaultValue: 'سوالات متداول',
    },
    {
      name: 'items',
      type: 'array',
      label: 'سوالات',
      fields: [
        {
          name: 'question',
          type: 'text',
          required: true,
          label: 'سوال',
        },
        {
          name: 'answer',
          type: 'richText',
          required: true,
          label: 'پاسخ',
        },
      ],
    },
  ],
}
