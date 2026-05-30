import type { CollectionConfig } from 'payload';
import { isAdmin } from '../lib/access';

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'عضو خبرنامه', plural: 'اعضای خبرنامه' },
  admin: {
    useAsTitle: 'phone',
    defaultColumns: ['phone', 'source', 'subscribedAt'],
    group: 'مشتری',
  },
  // Subscribers are written by the public /api/newsletter route (server-side).
  // Only admins can read or update.
  access: {
    create: () => true,
    read: isAdmin,
    update: isAdmin,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'phone',
      type: 'text',
      required: true,
      unique: true,
      label: 'شماره موبایل',
      admin: { description: 'فرمت ذخیره: 09xxxxxxxxx (نرمال‌سازی در /api/newsletter)' },
      validate: (val: unknown) => {
        if (typeof val !== 'string' || !val.length) return 'شماره موبایل الزامی است';
        if (!/^09\d{9}$/.test(val)) return 'فرمت شماره موبایل نامعتبر است (مثال: 09121234567)';
        return true;
      },
    },
    {
      name: 'subscribedAt',
      type: 'date',
      required: true,
      defaultValue: () => new Date().toISOString(),
      label: 'تاریخ ثبت',
      admin: { position: 'sidebar', readOnly: true, date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'source',
      type: 'text',
      label: 'منبع',
      admin: { description: 'مثلاً footer یا blog-popup' },
    },
  ],
};
