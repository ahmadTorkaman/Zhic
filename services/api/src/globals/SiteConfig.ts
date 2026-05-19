import type { GlobalConfig } from 'payload'
import { publishedContentAccess } from '../lib/access'

export const SiteConfig: GlobalConfig = {
  slug: 'site-config',
  label: 'تنظیمات سایت',
  access: publishedContentAccess,
  fields: [
    {
      name: 'contactPhone',
      type: 'text',
      label: 'تلفن تماس',
      admin: { description: 'فرمت بین‌المللی نمایش داده می‌شود (مثلاً ۰۸۱-۳۴۲۵ ۶۷۸۹).' },
    },
    {
      name: 'contactEmail',
      type: 'text',
      label: 'ایمیل تماس',
    },
    {
      name: 'address',
      type: 'richText',
      label: 'نشانی (نمایش در فوتر)',
    },
    {
      name: 'hours',
      type: 'text',
      label: 'ساعات کاری',
      admin: { description: 'مثلاً: شنبه تا چهارشنبه، ۹ تا ۱۸' },
    },
    {
      name: 'socials',
      type: 'array',
      label: 'شبکه‌های اجتماعی',
      maxRows: 8,
      fields: [
        {
          name: 'platform',
          type: 'select',
          required: true,
          options: [
            { label: 'اینستاگرام', value: 'instagram' },
            { label: 'تلگرام',     value: 'telegram' },
            { label: 'واتس‌اپ',     value: 'whatsapp' },
            { label: 'آپارات',     value: 'aparat' },
            { label: 'یوتیوب',     value: 'youtube' },
            { label: 'لینکدین',    value: 'linkedin' },
            { label: 'پینترست',   value: 'pinterest' },
          ],
          label: 'پلتفرم',
        },
        {
          name: 'url',
          type: 'text',
          required: true,
          label: 'آدرس کامل',
        },
      ],
    },
  ],
}
