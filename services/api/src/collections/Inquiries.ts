import type { CollectionConfig } from 'payload'
import { isAdmin, isAuthenticated, isMarketingOrAbove, isPublic } from '../lib/access.js'

export const Inquiries: CollectionConfig = {
  slug: 'inquiries',
  labels: { singular: 'استعلام', plural: 'استعلام‌ها' },
  admin: {
    useAsTitle: 'name',
    defaultColumns: ['name', 'phone', 'city', 'reason', 'status', 'createdAt'],
    group: 'صندوق ورودی',
  },
  // Inquiries are the one collection with anonymous create (public form
  // submits here). Read is staff-only (PII), update is marketing+,
  // delete is admin-only.
  access: {
    create: isPublic,
    read: isAuthenticated,
    update: isMarketingOrAbove,
    delete: isAdmin,
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'نام مشتری',
    },
    {
      name: 'phone',
      type: 'text',
      required: true,
      label: 'شماره تلفن',
    },
    {
      name: 'city',
      type: 'text',
      required: true,
      label: 'شهر',
    },
    {
      name: 'reason',
      type: 'select',
      required: true,
      label: 'موضوع',
      options: [
        { label: 'استعلام قیمت', value: 'price_inquiry' },
        { label: 'رزرو بازدید از شوروم', value: 'showroom_visit' },
      ],
    },
    {
      name: 'preferred_date',
      type: 'text',
      label: 'تاریخ ترجیحی بازدید',
      admin: {
        condition: (_, siblingData) => siblingData?.reason === 'showroom_visit',
      },
    },
    {
      name: 'message',
      type: 'textarea',
      label: 'پیام',
    },
    {
      name: 'routed_to',
      type: 'relationship',
      relationTo: 'showrooms',
      label: 'ارجاع به شوروم',
      admin: {
        position: 'sidebar',
        description: 'Auto-set by SMS routing logic (Session 5.1)',
      },
    },
    {
      name: 'product',
      type: 'relationship',
      relationTo: 'products',
      label: 'محصول مرتبط',
      admin: {
        position: 'sidebar',
        description: 'Set when submitted from a product detail page',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'new',
      label: 'وضعیت',
      options: [
        { label: 'جدید', value: 'new' },
        { label: 'تماس گرفته شده', value: 'contacted' },
        { label: 'بسته شده', value: 'closed' },
      ],
      admin: {
        position: 'sidebar',
      },
    },
  ],
}
