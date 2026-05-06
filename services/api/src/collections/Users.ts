import type { CollectionConfig } from 'payload'
import { isAdmin } from '../lib/access'

/**
 * Users collection — the auth source for the Payload admin.
 *
 * Role ladder (Package 1 only; sales / showroom_manager / accountant
 * ladder lands in Package 2+ per docs/spec/admin-panels.md §2):
 *
 *   admin     — founder; everything
 *   editor    — content lead + SEO specialist; full CRUD on content,
 *               including publishing articles + setting SEO fields
 *   marketing — marketing assistant; can draft articles + edit SEO,
 *               cannot publish
 *   viewer    — stakeholder; read-only
 *
 * First admin is created via the first-time-visit admin form. After
 * that, only `admin` can create/update/delete users.
 */
export const Users: CollectionConfig = {
  slug: 'users',
  auth: {
    tokenExpiration: 60 * 60 * 24 * 7, // 7 days
    cookies: {
      sameSite: 'Lax',
    },
    // Token-only auth. useSessions:true was failing on this stack because
    // findByID at JWT-verify time didn't populate the user.sessions array,
    // so every authed request hit the "no matching session" branch and
    // returned user:null — which is why login appeared to succeed but the
    // very next request bounced back to /admin/login. Multi-device session
    // revocation isn't a Package 1 requirement; revisit when CRM lands.
    useSessions: false,
  },
  admin: {
    useAsTitle: 'email',
    defaultColumns: ['email', 'name', 'role'],
    group: 'تنظیمات',
  },
  access: {
    // Admins manage users; users can always read/update their own record
    read: ({ req }) => {
      if (!req.user) return false
      if ((req.user as { role?: string }).role === 'admin') return true
      return { id: { equals: req.user.id } }
    },
    create: isAdmin,
    update: ({ req }) => {
      if (!req.user) return false
      if ((req.user as { role?: string }).role === 'admin') return true
      return { id: { equals: req.user.id } }
    },
    delete: isAdmin,
    admin: ({ req }) => Boolean(req.user), // anyone authenticated can see the admin
  },
  fields: [
    {
      name: 'name',
      type: 'text',
      label: 'نام',
      required: true,
    },
    {
      name: 'role',
      type: 'select',
      label: 'نقش',
      required: true,
      defaultValue: 'viewer',
      options: [
        { label: 'مدیر کل', value: 'admin' },
        { label: 'ویراستار (می‌تواند منتشر کند)', value: 'editor' },
        { label: 'بازاریاب (فقط پیش‌نویس + SEO)', value: 'marketing' },
        { label: 'مشاهده‌گر', value: 'viewer' },
      ],
      access: {
        // Only admins can change roles. Users can't promote themselves.
        update: ({ req }) => (req.user as { role?: string })?.role === 'admin',
      },
      admin: {
        description: 'نقش تعیین می‌کند کاربر به کدام بخش‌ها دسترسی دارد.',
      },
    },
  ],
}
