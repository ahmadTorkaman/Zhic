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
    {
      name: 'occupancyHubs',
      type: 'array',
      label: 'محتوای هاب‌های سنی (عنوان، متن، سئو)',
      labels: { singular: 'هاب سنی', plural: 'هاب‌های سنی' },
      admin: {
        initCollapsed: true,
        description:
          'برای هر گروه سنی (/bedroom-set/baby|teen|double|bunk): عنوان و توضیح سربرگ، یک بخش متن محتوایی، و فیلدهای سئو. هر گروه سنی یک ردیف. اگر خالی بماند، از متن پیش‌فرض استفاده می‌شود.',
      },
      fields: [
        {
          name: 'occupancy',
          type: 'select',
          required: true,
          label: 'گروه سنی',
          options: [
            { label: 'سرویس خواب نوزاد', value: 'baby' },
            { label: 'سرویس خواب نوجوان', value: 'teen' },
            { label: 'سرویس خواب دونفره', value: 'double' },
            { label: 'سرویس خواب دوطبقه', value: 'bunk' },
          ],
        },
        {
          name: 'title',
          type: 'text',
          label: 'عنوان سربرگ',
          admin: { description: 'عنوان بزرگ هاب (پیش‌فرض: «سرویس خواب نوزاد» و …).' },
        },
        {
          name: 'tagline',
          type: 'textarea',
          label: 'توضیح کوتاه (تگ‌لاین)',
          admin: { description: 'یک جمله زیر عنوان. از نیم‌فاصله (ZWNJ) استفاده کنید.' },
        },
        {
          name: 'body',
          type: 'textarea',
          label: 'متن صفحه (محتوایی)',
          admin: {
            description:
              'متن توضیحی/محتوایی که زیر فهرست طرح‌ها نمایش داده می‌شود — جای متن برای تیم محتوا/سئو. هر پاراگراف را با یک خط خالی جدا کنید.',
          },
        },
        {
          name: 'seoTitle',
          type: 'text',
          label: 'عنوان سئو (متا تایتل)',
          admin: { description: 'عنوان صفحه در نتایج جستجو و تب مرورگر. اگر خالی بماند از عنوان سربرگ استفاده می‌شود.' },
        },
        {
          name: 'seoDescription',
          type: 'textarea',
          label: 'توضیحات سئو (متا دیسکریپشن)',
          admin: { description: 'توضیح کوتاه صفحه برای موتورهای جستجو (حدود ۱۵۰ کاراکتر). اگر خالی بماند از تگ‌لاین استفاده می‌شود.' },
        },
      ],
    },
  ],
}
