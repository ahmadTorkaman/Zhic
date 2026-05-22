import type { CollectionConfig } from 'payload'
import { publishedContentAccess } from '../lib/access'

export const ProductVariants: CollectionConfig = {
  slug: 'productVariants',
  labels: { singular: 'واریانت محصول', plural: 'واریانت‌های محصول' },
  admin: {
    useAsTitle: 'label',
    defaultColumns: ['label', 'product', 'sku', 'availability'],
    group: 'کاتالوگ',
  },
  access: publishedContentAccess,
  // No label auto-generation. The `label` field is operator-set; if left
  // blank, the FRONTEND derives display text at render time as
  // "<product.name> · <axisKey1>=<valueLabel1> · ..." using the AXIS_LABEL
  // / VALUE_LABEL maps in PickerBar.
  fields: [
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      required: true,
      label: 'محصول',
      admin: { position: 'sidebar' },
    },
    {
      name: 'sku',
      type: 'text',
      required: true,
      unique: true,
      label: 'SKU',
      admin: {
        description: 'مثلاً GAN-BED-120-H. الزامی و یکتا.',
      },
    },
    {
      name: 'label',
      type: 'text',
      required: false,
      label: 'برچسب',
      admin: {
        description: 'متن نمایشی در سبد و فاکتورها. اگر خالی باشد، از نام محصول و محورهای واریانت خودکار ساخته می‌شود.',
      },
    },
    {
      name: 'axes',
      type: 'array',
      label: 'محورهای واریانت',
      admin: {
        description: 'هر سطر یک محور (مثلاً سایز=۱۲۰). کلیدها باید با allowed_axes دسته‌بندی محصول هم‌خوان باشند.',
      },
      fields: [
        {
          name: 'key',
          type: 'text',
          required: true,
          label: 'محور',
          admin: { description: 'مثل size, footboard, doors, drawers, glass, width, pieces' },
        },
        {
          name: 'value',
          type: 'text',
          required: true,
          label: 'مقدار',
          admin: { description: 'مثل 120, high, 3, true' },
        },
      ],
    },
    {
      name: 'priceDeltaRials',
      type: 'number',
      required: false,
      defaultValue: 0,
      label: 'تغییر قیمت (ریال)',
      admin: {
        description: 'به قیمت پایه‌ی محصول اضافه می‌شود. می‌تواند صفر، مثبت، یا منفی باشد.',
      },
    },
    {
      name: 'availability',
      type: 'select',
      required: false,
      label: 'وضعیت موجودی (override)',
      options: [
        { label: 'موجود', value: 'in_stock' },
        { label: 'ساخت به‌سفارش', value: 'made_to_order' },
        { label: 'در انتظار', value: 'backorder' },
        { label: 'ناموجود', value: 'discontinued' },
      ],
      admin: {
        description: 'در صورت تنظیم، جایگزین وضعیت محصول می‌شود. خالی = وضعیت محصول.',
      },
    },
    {
      name: 'image',
      type: 'upload',
      relationTo: 'media',
      required: false,
      label: 'تصویر واریانت',
      admin: {
        description: 'اختیاری. در صورت تنظیم، با انتخاب این واریانت روی صفحه‌ی محصول cross-fade می‌شود.',
      },
    },
    {
      name: 'displayOrder',
      type: 'number',
      required: false,
      defaultValue: 0,
      label: 'ترتیب نمایش',
      admin: {
        position: 'sidebar',
        description: 'هرچه کمتر، اول. پیش‌فرض ۰. هنگام تساوی، مرتب‌سازی ثانویه بر اساس createdAt صعودی.',
      },
    },
  ],
}
