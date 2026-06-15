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
      name: 'occupancies',
      type: 'select',
      hasMany: true,
      label: 'گروه ست خواب',
      options: [
        { label: 'سرویس خواب نوزاد', value: 'baby' },
        { label: 'سرویس خواب نوجوان', value: 'teen' },
        { label: 'سرویس خواب دونفره', value: 'double' },
        { label: 'سرویس خواب دوطبقه', value: 'bunk' },
      ],
      admin: {
        description: 'این طرح در کدام صفحات هاب «سرویس خواب /bedroom-set/{slug}» نمایش داده شود؟ انتخاب چند گزینه ممکن است. خالی یعنی هیچ هاب آرایش‌نشده‌ای نمایش نمی‌دهد.',
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
      name: 'hubIntro',
      type: 'textarea',
      label: 'معرفی در هاب سرویس خواب',
      admin: {
        description: 'یک جمله‌ی کوتاه مخصوص این طرح که زیر تب‌های نوع سرویس در اسلایدر هاب «سرویس خواب /bedroom-set» نمایش داده می‌شود. از نیم‌فاصله (ZWNJ) استفاده کنید.',
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
      name: 'sliderMedia',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر اسلایدر صفحه‌ی طرح‌ها',
      admin: {
        description: 'مدیای کارت این طرح در اسلایدر صفحه‌ی /designs (ترجیحاً GIF یا ویدیوی کوتاه که کل ست را نشان می‌دهد). اگر خالی باشد، از heroMedia یا گالری استفاده می‌شود.',
      },
    },
    {
      name: 'logoMedia',
      type: 'upload',
      relationTo: 'media',
      label: 'نام‌نشان طرح (لوگو)',
      admin: {
        description: 'نام‌نشان دوزبانه‌ی طرح که در نوار شیشه‌ای کارت هاب «سرویس خواب» روی تصویر می‌نشیند. اگر خالی باشد، کارت بدون لوگو نمایش داده می‌شود.',
      },
    },
    {
      name: 'occupancyMedia',
      type: 'array',
      label: 'کارت‌های اختصاصی هر نوع سرویس',
      labels: { singular: 'کارت نوع سرویس', plural: 'کارت‌های نوع سرویس' },
      admin: {
        description: 'برای هر نوع سرویس می‌توانید یک تصویر کارت متفاوت تعیین کنید؛ با انتخاب تب آن نوع در هاب «سرویس خواب»، کارت با محو-و-پیدا به این تصویر تغییر می‌کند. انواعی که اینجا تعریف نشوند، تصویر پایه (sliderMedia) را نشان می‌دهند.',
      },
      fields: [
        {
          name: 'occupancy',
          type: 'select',
          required: true,
          label: 'نوع سرویس',
          options: [
            { label: 'سرویس خواب نوزاد', value: 'baby' },
            { label: 'سرویس خواب نوجوان', value: 'teen' },
            { label: 'سرویس خواب دونفره', value: 'double' },
            { label: 'سرویس خواب دوطبقه', value: 'bunk' },
          ],
        },
        {
          name: 'image',
          type: 'upload',
          relationTo: 'media',
          required: true,
          label: 'تصویر کارت',
        },
      ],
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
