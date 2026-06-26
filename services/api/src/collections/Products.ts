import type { CollectionConfig } from 'payload'
import { slugify } from '../lib/slugify'
import { statusGatedContentAccess, isEditorField } from '../lib/access'
import { seoFields } from '../fields/seoFields'
import { OCCUPANCY_OPTIONS } from '../fields/occupancy'

export const Products: CollectionConfig = {
  slug: 'products',
  labels: { singular: 'محصول', plural: 'محصولات' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'status', 'basePriceRials', 'availability', 'pieceType'],
    group: 'کاتالوگ',
    listSearchableFields: ['name', 'sku'],
  },
  access: statusGatedContentAccess,
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
      name: 'tagline',
      type: 'text',
      label: 'تک‌خطی شاعرانه',
      admin: {
        description: 'یک جمله کوتاه که حس محصول را می‌رساند',
      },
    },
    {
      name: 'shortDescription',
      type: 'textarea',
      label: 'توضیح کوتاه',
      maxLength: 200,
      admin: {
        description: 'حداکثر ۲۰۰ کاراکتر — برای کارت‌ها و متاتگ',
      },
    },
    {
      name: 'longDescription',
      type: 'richText',
      label: 'توضیح بلند',
    },
    {
      name: 'design',
      type: 'relationship',
      relationTo: 'designs',
      required: true,
      label: 'طرح',
    },
    {
      name: 'pieceType',
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
        { label: 'میز آرایش', value: 'vanity' },
        { label: 'صندلی', value: 'chair' },
        { label: 'کنسول', value: 'console' },
        { label: 'میز تعویض', value: 'changing_table' },
        { label: 'براکت', value: 'bracket' },
        { label: 'لاوست', value: 'sofa' },
      ],
    },
    {
      name: 'occupancies',
      type: 'select',
      hasMany: true,
      label: 'گروه ست خواب',
      options: OCCUPANCY_OPTIONS,
      admin: {
        description: 'این قطعه به کدام گروه‌(های) سنی ست تعلق دارد؟ انتخاب چند گزینه ممکن است. در PDP طرح با ?age=… فیلتر می‌شود. خالی یعنی فیلتر سنی روی این قطعه اثری ندارد.',
      },
    },
    {
      name: 'categories',
      type: 'relationship',
      relationTo: 'categories',
      hasMany: true,
      label: 'دسته‌بندی‌ها',
    },
    {
      name: 'tags',
      type: 'relationship',
      relationTo: 'tags',
      hasMany: true,
      label: 'تگ‌ها',
    },
    {
      name: 'materials',
      type: 'relationship',
      relationTo: 'materials',
      hasMany: true,
      label: 'متریال‌ها',
    },
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      label: 'SKU',
      admin: {
        description: 'شناسه‌ی یکتای محصول (می‌تواند الگوی AAA-NNN یا عددی باشد).',
      },
      validate: (val: unknown) => {
        if (typeof val !== 'string' || !val.length) return 'SKU الزامی است'
        return true
      },
    },
    {
      // Integer rials. Display conversion to toman lives in @zhic/money.
      name: 'basePriceRials',
      type: 'number',
      required: true,
      label: 'قیمت پایه (ریال)',
      min: 0,
      admin: {
        description:
          'قیمت به ریال، عدد صحیح. نمایش تومان توسط رابط کاربری انجام می‌شود.',
        step: 1,
      },
      validate: (val: unknown) => {
        if (val == null) return 'قیمت پایه الزامی است'
        if (typeof val !== 'number' || !Number.isInteger(val)) {
          return 'قیمت باید عدد صحیح ریالی باشد'
        }
        if (val < 0) return 'قیمت نمی‌تواند منفی باشد'
        return true
      },
    },
    {
      name: 'salePriceRials',
      type: 'number',
      label: 'قیمت تخفیف‌خورده (ریال)',
      min: 0,
      admin: {
        description:
          'اختیاری — جایگزین قیمت پایه. نمایش در پکیج ۲ فعال می‌شود.',
        step: 1,
      },
      validate: (val: unknown) => {
        if (val == null) return true
        if (typeof val !== 'number' || !Number.isInteger(val)) {
          return 'قیمت باید عدد صحیح ریالی باشد'
        }
        if (val < 0) return 'قیمت نمی‌تواند منفی باشد'
        return true
      },
    },
    {
      name: 'availability',
      type: 'select',
      required: true,
      defaultValue: 'made_to_order',
      label: 'وضعیت موجودی',
      options: [
        { label: 'موجود', value: 'in_stock' },
        { label: 'ساخت به‌سفارش', value: 'made_to_order' },
        { label: 'در انتظار', value: 'backorder' },
        { label: 'ناموجود', value: 'discontinued' },
      ],
    },
    {
      name: 'leadTimeDays',
      type: 'number',
      required: true,
      defaultValue: 56,
      label: 'زمان تحویل (روز)',
      min: 0,
    },
    {
      name: 'warrantyYears',
      type: 'number',
      defaultValue: 5,
      label: 'گارانتی (سال)',
      min: 0,
      admin: {
        description: 'سال‌های گارانتی ساختار. نمایش در سایدبار PDP.',
        step: 1,
      },
    },
    {
      name: 'afterSalesYears',
      type: 'number',
      defaultValue: 5,
      label: 'خدمات پس از فروش (سال)',
      min: 0,
      admin: {
        description: 'سال‌های خدمات پس از فروش. نمایش در سایدبار PDP.',
        step: 1,
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
      name: 'gallery',
      type: 'upload',
      relationTo: 'media',
      hasMany: true,
      label: 'گالری',
    },
    {
      name: 'specs',
      type: 'richText',
      label: 'مشخصات فنی',
    },
    {
      name: 'relatedProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'محصولات مرتبط',
      admin: {
        description: 'برای ردیف «محصولات مرتبط» در صفحه‌ی محصول',
      },
    },
    {
      name: 'pairsWithProducts',
      type: 'relationship',
      relationTo: 'products',
      hasMany: true,
      label: 'در کنار آن خوب است',
      admin: {
        description: 'برای ردیف «در کنار آن خوب است» در صفحه‌ی محصول',
      },
    },
    {
      name: 'inquiryEnabled',
      type: 'checkbox',
      defaultValue: true,
      label: 'فعال بودن فرم استعلام',
      admin: { position: 'sidebar' },
    },
    {
      name: 'featured',
      type: 'checkbox',
      defaultValue: false,
      label: 'نمایش ویژه',
      admin: { position: 'sidebar' },
    },
    {
      name: 'featuredOrder',
      type: 'number',
      label: 'ترتیب نمایش ویژه',
      admin: {
        position: 'sidebar',
        description: 'هرچه کمتر، بالاتر',
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
        description: 'محصولات «پیش‌نویس» روی سایت نمایش داده نمی‌شوند. فقط ویراستار یا مدیر می‌تواند منتشر کند.',
      },
      access: {
        update: isEditorField,
      },
    },
    {
      name: 'publishedAt',
      type: 'date',
      label: 'تاریخ انتشار',
      admin: {
        position: 'sidebar',
        date: { pickerAppearance: 'dayOnly' },
      },
    },
    seoFields,
  ],
}
