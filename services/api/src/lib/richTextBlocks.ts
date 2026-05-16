import type { Block } from 'payload'

export const PullQuoteBlock: Block = {
  slug: 'pull-quote',
  labels: { singular: 'نقل قول', plural: 'نقل قول‌ها' },
  fields: [
    { name: 'quote', type: 'textarea', required: true, label: 'متن نقل قول' },
    { name: 'attribution', type: 'text', label: 'منبع' },
  ],
}

export const ImageGridBlock: Block = {
  slug: 'image-grid',
  labels: { singular: 'گالری تصاویر', plural: 'گالری‌ها' },
  fields: [
    {
      name: 'images',
      type: 'array',
      label: 'تصاویر',
      minRows: 2,
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'تصویر' },
        { name: 'caption', type: 'text', label: 'توضیح' },
      ],
    },
    {
      name: 'columns',
      type: 'select',
      defaultValue: '2',
      label: 'تعداد ستون',
      options: [
        { label: '۲ ستون', value: '2' },
        { label: '۳ ستون', value: '3' },
      ],
    },
  ],
}

export const VideoEmbedBlock: Block = {
  slug: 'video-embed',
  labels: { singular: 'ویدیو', plural: 'ویدیوها' },
  fields: [
    { name: 'url', type: 'text', required: true, label: 'آدرس ویدیو' },
    { name: 'caption', type: 'text', label: 'توضیح' },
  ],
}

export const ProductEmbedBlock: Block = {
  slug: 'product-embed',
  labels: { singular: 'محصول', plural: 'محصولات' },
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      label: 'محصول',
    },
  ],
}

export const MaterialRefBlock: Block = {
  slug: 'material-ref',
  labels: { singular: 'متریال', plural: 'متریال‌ها' },
  fields: [
    {
      name: 'material',
      type: 'relationship',
      relationTo: 'materials',
      required: true,
      label: 'متریال',
    },
  ],
}
