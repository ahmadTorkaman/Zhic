import type { CollectionConfig } from 'payload'

export const Media: CollectionConfig = {
  slug: 'media',
  labels: { singular: 'رسانه', plural: 'رسانه‌ها' },
  upload: {
    mimeTypes: ['image/*', 'video/*', 'application/pdf'],
  },
  fields: [
    {
      name: 'alt',
      type: 'text',
      label: 'متن جایگزین',
      admin: {
        description: 'Required for accessibility unless decorative',
      },
    },
    {
      name: 'caption',
      type: 'text',
      label: 'توضیحات',
    },
    {
      name: 'decorative',
      type: 'checkbox',
      defaultValue: false,
      label: 'تزئینی',
      admin: {
        description: 'When true, alt text is not required',
      },
    },
    // Deferred to Package 2+: kind, focalPoint, dominantColor, polycount,
    // materialVariants, hasDraco, hasKtx2, validationWarnings
  ],
}
