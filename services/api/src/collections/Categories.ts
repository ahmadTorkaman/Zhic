import type { CollectionConfig } from 'payload'
import { ValidationError } from 'payload'
import { slugify } from '../lib/slugify'
import { publishedContentAccess } from '../lib/access'
import { seoFields } from '../fields/seoFields'

export const Categories: CollectionConfig = {
  slug: 'categories',
  labels: { singular: 'دسته‌بندی', plural: 'دسته‌بندی‌ها' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'parent', 'slug'],
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
      ({ data, operation }) => {
        // beforeValidate fires only on create/update per Payload's type; guard
        // positively so this hook is robust if that ever changes.
        if (operation !== 'create' && operation !== 'update') return data
        if (!data) return data
        // Only enforce on create, OR on update when `parent` is being
        // explicitly set. Partial updates that don't touch `parent`
        // (e.g., patching `allowedAxes` on a leaf) must not be rejected.
        const isParentBeingSet = operation === 'create' || Object.hasOwn(data, 'parent')
        if (isParentBeingSet && data.parent == null && !data.cover) {
          throw new ValidationError({
            collection: 'categories',
            errors: [
              { path: 'cover', message: 'برای دسته‌بندی parent، تصویر hero الزامی است.' },
            ],
          })
        }
        return data
      },
    ],
  },
  fields: [
    { name: 'name', type: 'text', required: true, label: 'نام دسته‌بندی' },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      label: 'اسلاگ',
      admin: { position: 'sidebar', description: 'Auto-generated from name if left empty' },
    },
    {
      name: 'description',
      type: 'textarea',
      label: 'توضیحات کوتاه',
      admin: { description: 'یک خط برای متاتگ / SEO. متن طولانی hub در فیلد «مقدمه» می‌رود.' },
    },
    {
      name: 'tagline',
      type: 'text',
      label: 'تک‌خطی شاعرانه',
      admin: { description: 'یک جمله کوتاه که زیر نام دسته‌بندی در hero نمایش داده می‌شود.' },
    },
    {
      name: 'cover',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر hero',
      admin: {
        description:
          'تصویر تمام‌عرض بالای صفحه. برای parent‌ها الزامی؛ برای leaf‌ها اختیاری — در صورت خالی بودن، اولین تصویر اولین محصول این دسته استفاده می‌شود.',
      },
    },
    {
      name: 'mosaicTileImage',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر کاشی در دسته‌بندی والد',
      admin: {
        description:
          'تصویر این دسته در موزاییکِ صفحه‌ی دسته‌بندی والد. مستقل از «تصویر hero» است و فقط در کاشی‌های موزاییک استفاده می‌شود. اگر خالی بماند، «تصویر hero» و سپس اولین عکس محصولِ زیرمجموعه استفاده می‌شود.',
      },
    },
    {
      name: 'mosaicTilePosition',
      type: 'select',
      label: 'برش تصویر کاشی',
      options: [
        { label: 'بالا', value: 'top' },
        { label: 'وسط', value: 'center' },
        { label: 'پایین', value: 'bottom' },
      ],
      admin: {
        description: 'نقطه‌ی برش تصویر کاشی در موزاییک. پیش‌فرض وسط است.',
      },
    },
    {
      name: 'intro',
      type: 'richText',
      label: 'مقدمه',
      admin: { description: '۲ تا ۳ پاراگراف کوتاه پس از hero. متن اصلی SEO صفحه. حدود ۱۰۰ کلمه.' },
    },
    {
      name: 'allowedAxes',
      type: 'text',
      hasMany: true,
      label: 'محورهای واریانت مجاز',
      admin: {
        description: 'از xlsx برای leaf‌ها: size, footboard, doors, drawers, glass, width, pieces. برای parent‌ها خالی می‌ماند.',
      },
    },
    {
      name: 'rule',
      type: 'textarea',
      label: 'قواعد واریانت',
      admin: { description: 'از xlsx: یادداشت داخلی. روی صفحه‌ی عمومی نمایش داده نمی‌شود.' },
    },
    {
      name: 'axisFilter',
      type: 'json',
      label: 'فیلتر محور خودکار (facet)',
      admin: {
        description: 'فقط برای صفحات SEO-promoted facet (مثل /storage/wardrobe/double-door). شکل: { "axis": "doors", "value": "2" }. صفحه به‌طور خودکار محصولات را با این محور فیلتر می‌کند. برای parent و leaf معمولی خالی می‌ماند.',
      },
    },
    {
      name: 'parent',
      type: 'relationship',
      relationTo: 'categories',
      label: 'دسته‌بندی والد',
      admin: {
        position: 'sidebar',
        description: 'برای ساخت ساختار درختی (اختیاری برای parent‌ها، الزامی برای leaf‌ها)',
      },
    },
    seoFields,
  ],
}
