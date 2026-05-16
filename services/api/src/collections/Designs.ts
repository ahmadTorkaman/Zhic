import type { CollectionConfig } from 'payload'
import { lexicalEditor, BlocksFeature } from '@payloadcms/richtext-lexical'
import { slugify } from '../lib/slugify'
import { publishedContentAccess } from '../lib/access'
import {
  PullQuoteBlock,
  ImageGridBlock,
  VideoEmbedBlock,
  MaterialRefBlock,
} from '../lib/richTextBlocks'

export const Designs: CollectionConfig = {
  slug: 'designs',
  labels: { singular: 'طرح', plural: 'طرح‌ها' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'age_group', 'featured'],
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
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'نام طرح',
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
      name: 'age_group',
      type: 'select',
      label: 'گروه سنی',
      options: [
        { label: 'نوزاد', value: 'infant' },
        { label: 'کودک', value: 'child' },
        { label: 'نوجوان', value: 'teen' },
        { label: 'بزرگسال', value: 'adult' },
      ],
      admin: {
        description: 'Exact age group names pending brand decision (OD-3)',
      },
    },
    {
      name: 'description',
      type: 'richText',
      label: 'توضیحات',
    },
    {
      name: 'tagline',
      type: 'text',
      label: 'شعار طرح',
      admin: {
        description: 'یک جمله‌ی کوتاه و گویا که زیر نام طرح در صفحه‌ی اختصاصی نمایش داده می‌شود.',
      },
    },
    {
      name: 'heroMedia',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر اصلی صفحه',
      admin: {
        description: 'تصویر ابتدای صفحه‌ی طرح (متفاوت از گالری). در صورت خالی بودن، اولین تصویر گالری استفاده می‌شود.',
      },
    },
    {
      name: 'storyBlocks',
      type: 'richText',
      label: 'داستان طرح',
      editor: lexicalEditor({
        features: ({ rootFeatures }) => [
          ...rootFeatures,
          BlocksFeature({
            blocks: [
              PullQuoteBlock,
              ImageGridBlock,
              VideoEmbedBlock,
              MaterialRefBlock,
            ],
          }),
        ],
      }),
      admin: {
        description: 'متن بلند با امکان درج تصویر، ویدیو/گیف، نقل قول و ارجاع به متریال.',
      },
    },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'گالری',
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'نمایش در صفحه اصلی',
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
