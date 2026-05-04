import type { Block, CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { BlocksFeature } from '@payloadcms/richtext-lexical'
import { slugify } from '../lib/slugify'
import { publishedContentAccess, isEditorField } from '../lib/access'
import { seoFields } from '../fields/seoFields'

// --- Custom Lexical blocks for article body --------------------------------

const PullQuoteBlock: Block = {
  slug: 'pull-quote',
  labels: { singular: 'نقل قول', plural: 'نقل قول‌ها' },
  fields: [
    { name: 'quote', type: 'textarea', required: true, label: 'متن نقل قول' },
    { name: 'attribution', type: 'text', label: 'منبع' },
  ],
}

const ImageGridBlock: Block = {
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

const VideoEmbedBlock: Block = {
  slug: 'video-embed',
  labels: { singular: 'ویدیو', plural: 'ویدیوها' },
  fields: [
    { name: 'url', type: 'text', required: true, label: 'آدرس ویدیو' },
    { name: 'caption', type: 'text', label: 'توضیح' },
  ],
}

const ProductEmbedBlock: Block = {
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

const MaterialRefBlock: Block = {
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

// --- Reading time auto-compute ---------------------------------------------

type LexicalNodeLike = {
  type?: string
  text?: string
  children?: LexicalNodeLike[]
  [key: string]: unknown
}

function collectText(nodes: LexicalNodeLike[]): string {
  const parts: string[] = []
  for (const n of nodes) {
    if (n.type === 'text' && typeof n.text === 'string') {
      parts.push(n.text)
    }
    if (n.children) {
      parts.push(collectText(n.children))
    }
  }
  return parts.join(' ')
}

function computeReadingTime(body: unknown): number {
  if (!body || typeof body !== 'object') return 0
  const root = (body as { root?: LexicalNodeLike }).root
  if (!root?.children) return 0
  const text = collectText(root.children).replace(/\s+/g, ' ').trim()
  if (!text) return 0
  const wordCount = text.split(/\s+/).length
  return Math.max(1, Math.ceil(wordCount / 200))
}

// --- Collection config -----------------------------------------------------

export const Articles: CollectionConfig = {
  slug: 'articles',
  labels: { singular: 'مقاله', plural: 'مقالات' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'category', 'status', 'publishedAt'],
    group: 'ژورنال',
  },
  access: publishedContentAccess,
  hooks: {
    beforeValidate: [
      ({ data }) => {
        if (data?.title && !data?.slug) {
          data.slug = slugify(data.title as string)
        }
        return data
      },
    ],
    beforeChange: [
      ({ data }) => {
        if (data?.body) {
          data.readingTimeMinutes = computeReadingTime(data.body)
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
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          BlocksFeature({
            blocks: [
              PullQuoteBlock,
              ImageGridBlock,
              VideoEmbedBlock,
              ProductEmbedBlock,
              MaterialRefBlock,
            ],
          }),
        ],
      }),
    },
    {
      name: 'excerpt',
      type: 'textarea',
      required: true,
      maxLength: 280,
      label: 'خلاصه',
      admin: {
        description: 'خلاصه‌ی کوتاه برای صفحات فهرست و کارت‌ها (حداکثر ۲۸۰ حرف)',
      },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر کاور',
      admin: {
        description: 'اختیاری در حال حاضر — اگر خالی باشد، صفحه از تصویر پیش‌فرض استفاده می‌کند.',
      },
    },
    {
      name: 'author',
      type: 'relationship',
      relationTo: 'authors',
      required: true,
      label: 'نویسنده',
    },
    {
      name: 'category',
      type: 'relationship',
      relationTo: 'journal-categories',
      required: true,
      label: 'دسته‌بندی',
    },
    {
      name: 'tagIds',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: 'تگ‌ها',
    },
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'محصولات مرتبط',
    },
    {
      name: 'relatedArticles',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      label: 'مقالات مرتبط',
    },
    {
      name: 'readingTimeMinutes',
      type: 'number',
      label: 'زمان مطالعه (دقیقه)',
      admin: {
        position: 'sidebar',
        readOnly: true,
        description: 'Auto-computed from body word count',
      },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'مقاله‌ی ویژه',
      admin: {
        position: 'sidebar',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      required: true,
      label: 'وضعیت',
      options: [
        { label: 'پیش‌نویس', value: 'draft' },
        { label: 'منتشرشده', value: 'published' },
      ],
      admin: {
        position: 'sidebar',
        description: 'فقط ویراستار یا مدیر می‌تواند وضعیت را به «منتشرشده» تغییر دهد.',
      },
      access: {
        // Only editor+ can publish or unpublish. Marketing can't flip this.
        update: isEditorField,
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'تاریخ انتشار',
      admin: {
        position: 'sidebar',
        date: {
          pickerAppearance: 'dayOnly',
        },
      },
    },
    seoFields,
  ],
}
