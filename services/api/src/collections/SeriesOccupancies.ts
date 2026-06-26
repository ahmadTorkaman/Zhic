import type { CollectionConfig } from 'payload'
import { statusGatedContentAccess, isEditorField } from '../lib/access'
import { seoFields } from '../fields/seoFields'

const OCCUPANCY_OPTIONS = [
  { label: 'سرویس خواب نوزاد', value: 'baby' },
  { label: 'سرویس خواب نوجوان', value: 'teen' },
  { label: 'سرویس خواب دونفره', value: 'double' },
  { label: 'سرویس خواب دوطبقه', value: 'bunk' },
]

/**
 * One document per (design × occupancy). The document IS the page rendered at
 * /bedroom-set/{occupancy}/{design.slug}. Blank override fields inherit from the
 * parent Design; `products` is a fully-manual curated list (the «قطعات سرویس»
 * row). See docs/superpowers/specs/2026-06-25-bedroom-set-per-occupancy-design.md.
 */
export const SeriesOccupancies: CollectionConfig = {
  slug: 'series-occupancies',
  labels: { singular: 'سرویس خواب (طرح × گروه)', plural: 'سرویس‌های خواب (طرح × گروه)' },
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'design', 'occupancy', 'status'],
    group: 'کاتالوگ',
  },
  access: statusGatedContentAccess,
  hooks: {
    beforeValidate: [
      async ({ data, req, originalDoc }) => {
        if (!data) return data
        const design = data.design ?? originalDoc?.design
        const occupancy = data.occupancy ?? originalDoc?.occupancy
        // One page per (design, occupancy).
        if (design && occupancy && req?.payload) {
          const existing = await req.payload.find({
            collection: 'series-occupancies',
            where: { and: [{ design: { equals: design } }, { occupancy: { equals: occupancy } }] },
            limit: 1,
            depth: 0,
          })
          const clash = existing.docs.find((d) => d.id !== originalDoc?.id)
          if (clash) throw new Error('برای این طرح و این گروه سرویس، یک صفحه از قبل وجود دارد.')
        }
        return data
      },
    ],
    beforeChange: [
      async ({ data, req, originalDoc }) => {
        // Compute the admin list title «{design} — {occupancy}». Fall back to
        // originalDoc so a partial PATCH (e.g. occupancy only) still recomputes.
        const design = data?.design ?? originalDoc?.design
        const occupancy = data?.occupancy ?? originalDoc?.occupancy
        if (design && occupancy && req?.payload) {
          const d = await req.payload
            .findByID({ collection: 'designs', id: design, depth: 0 })
            .catch((err: unknown) => {
              req.payload.logger.warn({ err }, '[series-occupancies] design lookup failed; title not set')
              return null
            })
          const occLabel = OCCUPANCY_OPTIONS.find((o) => o.value === occupancy)?.label ?? occupancy
          if (d?.name) data.title = `${d.name} — ${occLabel}`
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'title', type: 'text', label: 'عنوان', admin: { readOnly: true, description: 'خودکار از «{طرح} — {گروه}» ساخته می‌شود.' } },
    { name: 'design', type: 'relationship', relationTo: 'designs', required: true, label: 'طرح' },
    { name: 'occupancy', type: 'select', required: true, label: 'گروه سرویس', options: OCCUPANCY_OPTIONS },
    {
      name: 'products',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'قطعات سرویس (محصولات)',
      admin: {
        description:
          'محصولات این صفحه را به ترتیب دلخواه انتخاب کنید. این فهرست کاملاً دستی است و خودکار با تگ گروه سنی پر نمی‌شود.',
      },
    },
    {
      name: 'heroMedia',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر اصلی صفحه (override)',
      admin: { description: 'اگر خالی بماند، از تصویر اصلی طرح ارث می‌برد.' },
    },
    { name: 'subtitle', type: 'text', label: 'زیرعنوان (override)', admin: { description: 'اگر خالی بماند، از شعار طرح ارث می‌برد.' } },
    {
      type: 'collapsible',
      label: 'محتوای اختصاصی این گروه (هر فیلد خالی از طرح ارث می‌برد)',
      admin: { initCollapsed: true },
      fields: [
        { name: 'introTitle', type: 'text', label: 'عنوان کارت معرفی' },
        { name: 'introBody', type: 'textarea', label: 'متن کارت معرفی' },
        { name: 'introMedia', type: 'upload', relationTo: 'media', label: 'تصویر کارت معرفی' },
        { name: 'storyBody', type: 'textarea', label: 'متن داستان طراحی' },
        { name: 'storyMedia', type: 'upload', relationTo: 'media', label: 'تصویر داستان طراحی' },
        {
          name: 'materialCallouts',
          type: 'array',
          label: 'متریال‌ها (override)',
          labels: { singular: 'متریال', plural: 'متریال‌ها' },
          admin: { description: 'اگر خالی بماند، متریال‌های طرح نشان داده می‌شود.' },
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'تصویر دایره‌ای' },
            { name: 'label', type: 'text', required: true, label: 'نام' },
            { name: 'sub', type: 'text', label: 'زیرنویس' },
          ],
        },
        {
          name: 'designDetails',
          type: 'array',
          label: 'جزئیات طراحی (override)',
          labels: { singular: 'کاشی جزئیات', plural: 'جزئیات طراحی' },
          admin: { description: 'اگر خالی بماند، جزئیات طراحی طرح نشان داده می‌شود.' },
          fields: [
            { name: 'image', type: 'upload', relationTo: 'media', required: true, label: 'تصویر کاشی' },
            { name: 'label', type: 'text', required: true, label: 'عنوان' },
            { name: 'description', type: 'textarea', label: 'توضیح کوتاه' },
            { name: 'span', type: 'number', defaultValue: 100, min: 1, label: 'وزن عرض کاشی' },
          ],
        },
      ],
    },
    {
      name: 'siblings',
      type: 'array',
      label: 'کارت‌های طرح‌های مرتبط',
      labels: { singular: 'کارت', plural: 'کارت‌ها' },
      admin: { description: 'کارت‌های پایین صفحه. اگر خالی بماند، خودکار از سایر گروه‌های همین طرح ساخته می‌شود.' },
      fields: [
        { name: 'image', type: 'upload', relationTo: 'media', label: 'تصویر' },
        { name: 'kicker', type: 'text', label: 'عنوان بالا (مثلاً سرویس خواب دونفره)' },
        { name: 'name', type: 'text', label: 'نام طرح' },
        { name: 'link', type: 'text', label: 'لینک' },
      ],
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
      admin: { position: 'sidebar', description: 'فقط صفحات منتشرشده روی سایت دیده می‌شوند. فقط ویراستار می‌تواند منتشر کند.' },
      access: { update: isEditorField },
    },
    { name: 'publishedAt', type: 'date', label: 'تاریخ انتشار', admin: { position: 'sidebar', date: { pickerAppearance: 'dayOnly' } } },
    seoFields,
  ],
}
