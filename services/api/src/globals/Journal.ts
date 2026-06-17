import type { GlobalConfig } from 'payload'
import { publishedContentAccess } from '../lib/access'

/** Editorial config for the /journal index. Article cards (featured / numbered
 *  list / 2-up cards) are CURATED here by relationship; each card's
 *  title/excerpt/cover/category/date/reading-time come from the referenced
 *  Article. Only page-level copy (intro / quote / heading / product-CTA) lives
 *  here directly. */
export const Journal: GlobalConfig = {
  slug: 'journal',
  label: 'صفحه ژورنال',
  access: publishedContentAccess,
  fields: [
    {
      name: 'introTitle',
      type: 'textarea',
      label: 'عنوان معرفی (هدلاین)',
      admin: { description: 'سرتیتر بالای صفحه ژورنال. برای شکستن به دو خط از Enter استفاده کنید. اگر خالی باشد، هدلاین پیش‌فرض طراحی نمایش داده می‌شود.' },
    },
    {
      name: 'featuredArticle',
      type: 'relationship',
      relationTo: 'articles',
      label: 'مقاله ویژه (کارت بزرگ)',
      admin: { description: 'کارت بزرگ بالای فهرست. اگر خالی باشد، کل صفحه به محتوای پیش‌فرض برمی‌گردد.' },
    },
    {
      name: 'listArticles',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      label: 'مقاله‌های فهرست شماره‌دار',
      admin: { description: 'به‌ترتیب نمایش (۰۲، ۰۳، …). معمولاً ۴ مقاله.' },
    },
    {
      name: 'fullListHeading',
      type: 'text',
      label: 'عنوان بخش «فهرست کامل»',
      admin: { description: 'پیش‌فرض: «فهرست کامل».' },
    },
    {
      name: 'quoteText',
      type: 'textarea',
      label: 'متن نقل‌قول',
      admin: { description: 'بلوک نقل‌قول. از نیم‌فاصله (ZWNJ) استفاده کنید.' },
    },
    {
      name: 'cardArticles',
      type: 'relationship',
      relationTo: 'articles',
      hasMany: true,
      label: 'کارت‌های مقاله (دوتایی)',
      admin: { description: 'به‌ترتیب نمایش. معمولاً ۲ مقاله.' },
    },
    {
      name: 'categoryTabs',
      type: 'relationship',
      relationTo: 'journal-categories',
      hasMany: true,
      label: 'تب‌های دسته‌بندی',
      admin: { description: 'دسته‌هایی که به‌عنوان تب نمایش داده می‌شوند (به‌علاوه‌ی «همه»). اگر خالی باشد، همه‌ی دسته‌ها نمایش داده می‌شوند.' },
    },
    {
      name: 'ctaTitle',
      type: 'text',
      label: 'عنوان بنر محصولات',
      admin: { description: 'پیش‌فرض: «ساخته شده برای ماندن».' },
    },
    {
      name: 'ctaLabel',
      type: 'text',
      label: 'متن دکمه بنر',
      admin: { description: 'پیش‌فرض: «مشاهده محصولات».' },
    },
    {
      name: 'ctaHref',
      type: 'text',
      label: 'لینک دکمه بنر',
      admin: { description: 'پیش‌فرض: /bedroom-furniture.' },
    },
    {
      name: 'ctaImage',
      type: 'upload',
      relationTo: 'media',
      label: 'تصویر بنر محصولات',
      admin: { description: 'تصویر پس‌زمینه بنر محصولات. اگر خالی باشد، تصویر پیش‌فرض طراحی نمایش داده می‌شود.' },
    },
  ],
}
