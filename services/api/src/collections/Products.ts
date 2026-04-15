import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/slugify'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'محصول', plural: 'محصولات' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'design', 'piece_type', 'basePriceRials'],
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
      label: 'نام محصول',
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
      name: 'design',
      type: 'relationship',
      relationTo: 'designs',
      required: true,
      label: 'طرح',
    },
    {
      name: 'piece_type',
      type: 'select',
      label: 'نوع قطعه',
      options: [
        { label: 'تخت', value: 'bed' },
        { label: 'پاتختی', value: 'nightstand' },
        { label: 'کمد', value: 'closet' },
        { label: 'دراور', value: 'dresser' },
        { label: 'آینه', value: 'mirror' },
        { label: 'میز تحریر', value: 'desk' },
        { label: 'کتابخانه', value: 'bookcase' },
        { label: 'ویترین', value: 'display_cabinet' },
      ],
    },
    {
      // Integer rials. Display conversion to toman lives in @zhic/money.
      // Payload has no bigint field type; `number` is safe up to ~9.007e15,
      // which covers all realistic furniture pricing. See data-schemas.md §12.
      name: 'basePriceRials',
      type: 'number',
      label: 'قیمت پایه (ریال)',
      min: 0,
      admin: {
        description:
          'قیمت به ریال، عدد صحیح (بدون کاما). نمایش تومان توسط رابط کاربری انجام می‌شود.',
        step: 1,
      },
      validate: (val: unknown) => {
        if (val == null) return true;
        if (typeof val !== 'number' || !Number.isInteger(val)) {
          return 'قیمت باید عدد صحیح ریالی باشد';
        }
        if (val < 0) return 'قیمت نمی‌تواند منفی باشد';
        return true;
      },
    },
    {
      name: 'dimensions',
      type: 'group',
      label: 'ابعاد (سانتی‌متر)',
      fields: [
        { name: 'width', type: 'number', label: 'عرض' },
        { name: 'height', type: 'number', label: 'ارتفاع' },
        { name: 'depth', type: 'number', label: 'عمق' },
      ],
    },
    {
      name: 'materials',
      type: 'array',
      label: 'متریال',
      fields: [
        { name: 'material', type: 'text', required: true, label: 'نام متریال' },
      ],
    },
    {
      name: 'specs',
      type: 'richText',
      label: 'مشخصات فنی',
    },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'گالری',
    },
    {
      name: 'inquiry_enabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'فعال بودن فرم استعلام',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
