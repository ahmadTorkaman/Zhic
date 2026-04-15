import type { GlobalConfig } from 'payload'

export const Returns: GlobalConfig = {
  slug: 'returns',
  label: 'شرایط مرجوعی',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: 'عنوان صفحه',
      defaultValue: 'شرایط مرجوعی',
    },
    {
      name: 'body',
      type: 'richText',
      label: 'متن صفحه',
    },
  ],
}
