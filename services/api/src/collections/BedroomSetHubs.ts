import type { CollectionConfig } from 'payload'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { publishedContentAccess } from '../lib/access'

/**
 * Per-occupancy editor for the /bedroom-set/{baby,teen,double,bunk} hub pages.
 * One document per age group — each is its own panel mapping 1:1 to the page's
 * existing sections (hero / intro band / design-tiles mosaic / cross-links) plus
 * editable SEO content + meta. The storefront reads a doc by `occupancy` and
 * renders it through the existing components; any empty field falls back to the
 * built-in copy so a half-filled doc never breaks the page.
 *
 * Seeded with the 4 docs (scripts/seed-bedroom-set-hubs.py) carrying today's
 * hardcoded copy, so the live pages look identical until the operator edits.
 */
const OCCUPANCY_OPTIONS = [
  { label: 'سرویس خواب نوزاد', value: 'baby' },
  { label: 'سرویس خواب نوجوان', value: 'teen' },
  { label: 'سرویس خواب دونفره', value: 'double' },
  { label: 'سرویس خواب دوطبقه', value: 'bunk' },
]

export const BedroomSetHubs: CollectionConfig = {
  slug: 'bedroom-set-hubs',
  labels: { singular: 'هاب سرویس خواب (گروه سنی)', plural: 'هاب‌های سرویس خواب' },
  access: publishedContentAccess,
  admin: {
    useAsTitle: 'occupancy',
    defaultColumns: ['occupancy', 'heroTitle', 'updatedAt'],
    description:
      'هر سند یک صفحه‌ی گروه سنی است (مثلاً نوزاد → /bedroom-set/baby). برای هر گروه فقط یک سند بسازید.',
  },
  fields: [
    {
      name: 'occupancy',
      type: 'select',
      required: true,
      unique: true,
      label: 'گروه سنی',
      options: OCCUPANCY_OPTIONS,
      admin: { description: 'این هاب کدام صفحه است. هر گروه سنی فقط یک سند می‌گیرد.' },
    },

    // ── سربرگ (BedroomHero) ──────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'سربرگ (هیرو)',
      admin: { initCollapsed: false },
      fields: [
        { name: 'heroImage', type: 'upload', relationTo: 'media', label: 'تصویر تمام‌قاب سربرگ' },
        { name: 'heroTitle', type: 'text', label: 'عنوان' },
        { name: 'heroTagline', type: 'textarea', label: 'توضیح زیر عنوان (تگ‌لاین)' },
        { name: 'heroCtaLabel', type: 'text', label: 'متن دکمه', admin: { description: 'پیش‌فرض: «مشاهده».' } },
        { name: 'heroCtaHref', type: 'text', label: 'لینک دکمه', admin: { description: 'پیش‌فرض: «#hub-designs».' } },
      ],
    },

    // ── بخش معرفی (NEW — intro band under the hero) ──────────────────────────
    {
      type: 'collapsible',
      label: 'بخش معرفی (زیر هیرو)',
      admin: {
        initCollapsed: true,
        description: 'یک بند کوتاه که زیر هیرو و بالای کاشی‌های طرح نمایش داده می‌شود. خالی بماند، نمایش داده نمی‌شود.',
      },
      fields: [
        { name: 'introHeading', type: 'text', label: 'عنوان معرفی' },
        { name: 'introBody', type: 'textarea', label: 'متن معرفی' },
      ],
    },

    // ── بخش طرح‌ها (CategoryMosaic) + کنترل کاشی‌ها ───────────────────────────
    {
      type: 'collapsible',
      label: 'بخش طرح‌ها و کنترل کاشی‌ها',
      admin: { initCollapsed: true },
      fields: [
        { name: 'designsHeading', type: 'text', label: 'عنوان بخش', admin: { description: 'پیش‌فرض: «طرح‌ها».' } },
        {
          name: 'featuredDesign',
          type: 'relationship',
          relationTo: 'designs',
          label: 'طرح شاخص',
          admin: { description: 'این طرح به‌عنوان کاشی بزرگ/نخست نمایش داده می‌شود.' },
        },
        {
          name: 'tileOrder',
          type: 'relationship',
          relationTo: 'designs',
          hasMany: true,
          label: 'ترتیب کاشی‌ها',
          admin: { description: 'ترتیب دلخواه. طرح‌هایی که اینجا نباشند، با ترتیب پیش‌فرض (نام) در ادامه می‌آیند.' },
        },
        {
          name: 'hiddenDesigns',
          type: 'relationship',
          relationTo: 'designs',
          hasMany: true,
          label: 'طرح‌های پنهان',
          admin: { description: 'این طرح‌ها در این هاب نمایش داده نمی‌شوند (حتی اگر گروه سنی‌شان مطابق باشد).' },
        },
      ],
    },

    // ── محتوای سئو (NEW — long-form rich text, lower on the page) ────────────
    {
      name: 'contentBody',
      type: 'richText',
      label: 'محتوای صفحه (سئو)',
      editor: lexicalEditor({}),
      admin: {
        description: 'متن بلند پایین صفحه (پس از کاشی‌ها) برای سئو — عنوان‌ها، پاراگراف‌ها و لینک‌ها. خالی بماند، نمایش داده نمی‌شود.',
      },
    },

    // ── گروه‌های دیگر (MosaicStrip) ──────────────────────────────────────────
    {
      name: 'crossLinksHeading',
      type: 'text',
      label: 'عنوان بخش «گروه‌های دیگر»',
      admin: { description: 'پیش‌فرض: «گروه‌های دیگر». لینک‌ها خودکار از دیگر گروه‌های سنی ساخته می‌شوند.' },
    },

    // ── سئو (NEW — meta) ────────────────────────────────────────────────────
    {
      type: 'collapsible',
      label: 'سئو (متا)',
      admin: { initCollapsed: true },
      fields: [
        { name: 'seoTitle', type: 'text', label: 'عنوان سئو (متا تایتل)' },
        { name: 'seoDescription', type: 'textarea', label: 'توضیحات سئو (متا دیسکریپشن)' },
        { name: 'seoImage', type: 'upload', relationTo: 'media', label: 'تصویر اشتراک‌گذاری (OG)' },
      ],
    },
  ],
}
