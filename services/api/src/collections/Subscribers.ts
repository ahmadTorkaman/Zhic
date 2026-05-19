import type { CollectionConfig } from 'payload';
import { isAdmin } from '../lib/access';

export const Subscribers: CollectionConfig = {
  slug: 'subscribers',
  labels: { singular: 'عضو خبرنامه', plural: 'اعضای خبرنامه' },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'source', 'subscribedAt'],
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
      name: 'email',
      type: 'text',
      required: true,
      unique: true,
      label: 'ایمیل',
      validate: (val: unknown) => {
        if (typeof val !== 'string' || !val.length) return 'ایمیل الزامی است';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'فرمت ایمیل نامعتبر است';
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
