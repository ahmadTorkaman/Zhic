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
  ],
}
