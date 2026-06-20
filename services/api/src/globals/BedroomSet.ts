import type { GlobalConfig } from 'payload'
import { publishedContentAccess } from '../lib/access'

/** Editorial copy for the /bedroom-set hub (the «درباره‌ی این سرویس‌ها» writing
 *  section under the carousel). Designs, logos, and the featured overlay come
 *  from the Designs/Products collections; only this prose lives here. */
export const BedroomSet: GlobalConfig = {
  slug: 'bedroom-set',
  label: 'هاب سرویس خواب',
  access: publishedContentAccess,
  fields: [
    {
      name: 'writingHeading',
      type: 'text',
      label: 'عنوان بخش نوشتار',
      admin: { description: 'عنوان بخش پایانی هاب (پیش‌فرض مکاپ: «درباره‌ی این سرویس‌ها»).' },
    },
    {
      name: 'writingBody',
      type: 'textarea',
      label: 'متن بخش نوشتار',
      admin: { description: 'یک پاراگراف توضیحی زیر عنوان. از نیم‌فاصله (ZWNJ) استفاده کنید.' },
    },
    {
      name: 'featuredBestsellersIntro',
      type: 'textarea',
      label: 'معرفی صفحه‌ی پرفروش‌ترین‌ها',
      admin: { description: 'متن کوتاه زیر شبکه‌ی تصاویر در صفحه‌ی «پرفروش‌ترین محصولات» اورلی ویژه. از نیم‌فاصله (ZWNJ) استفاده کنید.' },
    },
    {
      name: 'featuredNewestIntro',
      type: 'textarea',
      label: 'معرفی صفحه‌ی جدیدترین‌ها',
      admin: { description: 'متن کوتاه زیر شبکه‌ی تصاویر در صفحه‌ی «جدیدترین محصولات» اورلی ویژه. از نیم‌فاصله (ZWNJ) استفاده کنید.' },
    },
    {
      type: 'collapsible',
      label: 'تصاویر سربرگ هاب‌های سنی',
      admin: {
        initCollapsed: true,
        description:
          'تصویر تمام‌قاب سربرگ برای هر هاب گروه سنی (مثلاً /bedroom-set/teen). اگر خالی بماند، از تصویر طرح شاخص همان گروه استفاده می‌شود.',
      },
      fields: [
        { name: 'heroTeenMedia', type: 'upload', relationTo: 'media', label: 'سربرگ نوجوان' },
        { name: 'heroDoubleMedia', type: 'upload', relationTo: 'media', label: 'سربرگ دونفره' },
        { name: 'heroBabyMedia', type: 'upload', relationTo: 'media', label: 'سربرگ نوزاد' },
        { name: 'heroBunkMedia', type: 'upload', relationTo: 'media', label: 'سربرگ دوطبقه' },
      ],
    },
  ],
}
