import type { GlobalConfig } from 'payload'

export const Contact: GlobalConfig = {
  slug: 'contact',
  label: 'تماس با ما',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'عنوان صفحه',
      defaultValue: 'تماس با ما',
    },
    {
      name: 'phone',
      type: 'text',
      label: 'تلفن',
    },
    {
      name: 'email',
      type: 'text',
      label: 'ایمیل',
    },
    {
      name: 'address',
      type: 'textarea',
      label: 'آدرس',
    },
    {
      name: 'body',
      type: 'richText',
      label: 'متن صفحه',
    },
  ],
}
