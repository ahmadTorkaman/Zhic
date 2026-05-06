import type { Field } from 'payload'

/**
 * Shared SEO field group. Applied to Products, Articles, Categories,
 * JournalCategories, Collections (and eventually global pages).
 *
 * Every field is optional — the storefront falls back to the main
 * title / excerpt / cover when SEO overrides are blank. This lets the
 * SEO specialist improve pages over time without breaking anything
 * that hasn't been touched yet.
 *
 * Usage in a collection:
 *   import { seoFields } from '../fields/seoFields'
 *   fields: [
 *     // ... primary fields
 *     seoFields,
 *   ]
 */
export const seoFields: Field = {
  name: 'seo',
  type: 'group',
  label: 'سئو (اختیاری)',
  admin: {
    description:
      'این فیلدها برای بهینه‌سازی موتورهای جستجو هستند. اگر خالی بگذارید، از عنوان و توضیح اصلی صفحه استفاده می‌شود.',
    position: 'sidebar',
  },
  fields: [
    {
      name: 'metaTitle',
      type: 'text',
      label: 'عنوان متا (title)',
      maxLength: 70,
      admin: {
        description:
          'عنوانی که در نتایج گوگل نشان داده می‌شود. بین ۵۰ تا ۶۰ کاراکتر توصیه می‌شود. اگر خالی باشد، عنوان اصلی صفحه استفاده می‌شود.',
      },
    },
    {
      name: 'metaDescription',
      type: 'textarea',
      label: 'توضیح متا (description)',
      maxLength: 170,
      admin: {
        description:
          'توضیح یک یا دو جمله‌ای زیر عنوان در نتایج گوگل. ۱۵۰ تا ۱۶۰ کاراکتر ایده‌آل است.',
      },
    },
    {
      name: 'ogImage',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر اشتراک‌گذاری (Open Graph)',
      admin: {
        description:
          'تصویری که در شبکه‌های اجتماعی و اپ‌های پیام‌رسان هنگام اشتراک‌گذاری لینک نمایش داده می‌شود. ابعاد پیشنهادی: ۱۲۰۰×۶۳۰. اگر خالی باشد، تصویر کاور خودکار ساخته می‌شود.',
      },
    },
    {
      name: 'canonicalUrl',
      type: 'text',
      label: 'URL کنونیکال (دلخواه)',
      admin: {
        description:
          'اگر این محتوا در جای دیگری نسخه اصلی دارد (مثلاً یک مجله‌ی دیگر) اینجا را پر کنید. معمولاً خالی بگذارید.',
      },
    },
    {
      name: 'noindex',
      type: 'checkbox',
      label: 'از نمایش در گوگل مستثنی کن',
      defaultValue: false,
      admin: {
        description:
          'اگر روشن باشد، این صفحه در نتایج گوگل نمایش داده نمی‌شود. برای صفحات تست یا در حال ساخت مفید است.',
      },
    },
  ],
}
