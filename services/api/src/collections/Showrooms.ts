import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/slugify'

const PERSIAN_DAY_OPTIONS = [
  { label: 'شنبه', value: 'sat' },
  { label: 'یکشنبه', value: 'sun' },
  { label: 'دوشنبه', value: 'mon' },
  { label: 'سه‌شنبه', value: 'tue' },
  { label: 'چهارشنبه', value: 'wed' },
  { label: 'پنجشنبه', value: 'thu' },
  { label: 'جمعه', value: 'fri' },
] as const

const TIME_PATTERN = /^([01]?\d|2[0-3]):[0-5]\d$/
const validateTime = (val: unknown): true | string => {
  if (val == null || val === '') return true
  if (typeof val !== 'string') return 'زمان باید رشته باشد'
  if (!TIME_PATTERN.test(val)) return 'الگو: HH:MM (مثال: 10:00)'
  return true
}

export const Showrooms: CollectionConfig = {
  slug: 'showrooms',
  labels: { singular: 'شوروم', plural: 'شوروم‌ها' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'is_central', 'phone'],
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
      label: 'نام شوروم',
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
      name: 'headline',
      type: 'text',
      label: 'تک‌خطی',
      admin: { description: 'یک جمله شاعرانه برای هیرو' },
    },
    {
      name: 'description',
      type: 'richText',
      label: 'توضیحات',
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر شاخص',
    },
    {
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'گالری',
    },
    {
      name: 'address',
      type: 'group',
      label: 'آدرس',
      fields: [
        { name: 'province', type: 'text', label: 'استان' },
        { name: 'city', type: 'text', required: true, label: 'شهر' },
        { name: 'district', type: 'text', label: 'محله' },
        { name: 'street', type: 'text', label: 'خیابان' },
        { name: 'plaque', type: 'text', label: 'پلاک' },
        { name: 'unit', type: 'text', label: 'واحد' },
        { name: 'postalCode', type: 'text', label: 'کد پستی' },
        {
          name: 'notes',
          type: 'textarea',
          label: 'یادداشت تحویل',
          admin: { description: 'مثال: نشانی نزدیک، پارکینگ' },
        },
      ],
    },
    {
      name: 'geo',
      type: 'group',
      label: 'مختصات جغرافیایی',
      fields: [
        { name: 'lat', type: 'number', label: 'عرض جغرافیایی' },
        { name: 'lng', type: 'number', label: 'طول جغرافیایی' },
      ],
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      label: 'تلفن (عمومی)',
      admin: {
        description: 'مثال: 081-38123456 یا +988138123456',
      },
    },
    {
      name: 'email',
      type: 'email',
      label: 'ایمیل',
    },
    {
      name: 'hours',
      type: 'array',
      label: 'ساعات کاری',
      labels: { singular: 'روز', plural: 'روزها' },
      fields: [
        {
          name: 'day',
          type: 'select',
          required: true,
          label: 'روز',
          options: [...PERSIAN_DAY_OPTIONS],
        },
        {
          name: 'opens',
          type: 'text',
          label: 'باز',
          admin: { description: 'الگو: HH:MM (مثال: 10:00)' },
          validate: validateTime,
        },
        {
          name: 'closes',
          type: 'text',
          label: 'بسته',
          admin: { description: 'الگو: HH:MM (مثال: 20:00)' },
          validate: validateTime,
        },
        {
          name: 'closed',
          type: 'checkbox',
          defaultValue: false,
          label: 'تعطیل',
        },
      ],
    },
    {
      name: 'holidayHours',
      type: 'array',
      label: 'ساعات تعطیلات',
      labels: { singular: 'تعطیلی', plural: 'تعطیلات' },
      admin: {
        description: 'مثال: نوروز ۱۴۰۵، شب یلدا',
      },
      fields: [
        { name: 'name', type: 'text', required: true, label: 'نام تعطیلی' },
        { name: 'date', type: 'text', label: 'تاریخ (آزاد)' },
        {
          name: 'opens',
          type: 'text',
          label: 'باز',
          validate: validateTime,
        },
        {
          name: 'closes',
          type: 'text',
          label: 'بسته',
          validate: validateTime,
        },
        {
          name: 'closed',
          type: 'checkbox',
          defaultValue: false,
          label: 'تعطیل',
        },
      ],
    },
    {
      name: 'appointmentOnly',
      type: 'checkbox',
      defaultValue: false,
      label: 'فقط با وقت قبلی',
      admin: { position: 'sidebar' },
    },
    {
      name: 'parkingNotes',
      type: 'textarea',
      label: 'پارکینگ',
    },
    {
      name: 'transitNotes',
      type: 'textarea',
      label: 'دسترسی',
      admin: { description: 'مثال: نزدیکی به مترو / ایستگاه اتوبوس' },
    },
    {
      name: 'featuredProductIds',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'محصولات شاخص این شوروم',
    },
    {
      name: 'googleBusinessProfileUrl',
      type: 'text',
      label: 'پروفایل گوگل بیزینس',
    },
    {
      name: 'neshanProfileUrl',
      type: 'text',
      label: 'پروفایل نشان',
    },
    {
      name: 'mapEmbedUrl',
      type: 'text',
      label: 'iframe نقشه (نشان)',
      admin: {
        description: 'برای امبد نقشه. آدرس کامل iframe نشان یا OSM',
      },
    },
    // --- Internal / SMS routing (kept from 1.3) -----------------------------
    {
      name: 'manager_name',
      type: 'text',
      label: 'نام مدیر (داخلی)',
      admin: {
        position: 'sidebar',
        description: 'Internal — not displayed on storefront',
      },
    },
    {
      name: 'manager_phone',
      type: 'text',
      label: 'تلفن مدیر (داخلی)',
      admin: {
        position: 'sidebar',
        description: 'Internal — SMS routing target for inquiries (Session 5.1)',
      },
    },
    {
      name: 'is_central',
      type: 'checkbox',
      defaultValue: false,
      label: 'شعبه مرکزی',
      admin: {
        position: 'sidebar',
        description: 'Fallback for SMS routing when city has no match',
      },
    },
  ],
}
