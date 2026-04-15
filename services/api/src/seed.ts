import { getPayload } from 'payload'
import config from './payload.config'

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Seed script should not run in production.')
    process.exit(1)
  }

  const payload = await getPayload({ config })

  console.log('Seeding database...')

  // --- Categories ---
  const existingCat = await payload.find({ collection: 'categories', where: { slug: { equals: 'bedroom' } }, limit: 1 })
  const category = existingCat.docs[0] ?? await payload.create({
    collection: 'categories',
    data: { name: 'اتاق خواب', slug: 'bedroom' },
  })
  console.log('  Category: اتاق خواب')

  // --- Tags ---
  const tagData = [
    { name: 'چوب گردو', slug: 'walnut' },
    { name: 'مدرن', slug: 'modern' },
  ]
  const tags: string[] = []
  for (const t of tagData) {
    const existing = await payload.find({ collection: 'tags', where: { slug: { equals: t.slug } }, limit: 1 })
    const tag = existing.docs[0] ?? await payload.create({ collection: 'tags', data: t })
    tags.push(tag.id as string)
    console.log(`  Tag: ${t.name}`)
  }

  // --- Designs ---
  const designData = [
    { name: 'طرح آرامش', slug: 'aramesh', age_group: 'adult' as const, featured: true },
    { name: 'طرح بهار', slug: 'bahar', age_group: 'child' as const, featured: true },
  ]
  const designs: string[] = []
  for (const d of designData) {
    const existing = await payload.find({ collection: 'designs', where: { slug: { equals: d.slug } }, limit: 1 })
    const design = existing.docs[0] ?? await payload.create({ collection: 'designs', data: d })
    designs.push(design.id as string)
    console.log(`  Design: ${d.name}`)
  }

  // --- Products ---
  const productData = [
    {
      name: 'تخت دو نفره آرامش',
      slug: 'takht-aramesh',
      design: designs[0],
      piece_type: 'bed' as const,
      basePriceRials: 45_000_000,
      dimensions: { width: 160, height: 120, depth: 200 },
      materials: [{ material: 'چوب گردو' }, { material: 'کتان بلژیکی' }],
      inquiry_enabled: true,
    },
    {
      name: 'کمد بهار',
      slug: 'komod-bahar',
      design: designs[1],
      piece_type: 'closet' as const,
      basePriceRials: 28_000_000,
      dimensions: { width: 180, height: 220, depth: 60 },
      materials: [{ material: 'چوب راش' }],
      inquiry_enabled: true,
    },
  ]
  for (const p of productData) {
    const existing = await payload.find({ collection: 'products', where: { slug: { equals: p.slug } }, limit: 1 })
    if (!existing.docs[0]) {
      await payload.create({ collection: 'products', data: p })
    }
    console.log(`  Product: ${p.name}`)
  }

  // --- Showrooms ---
  const showroomData = {
    name: 'شوروم همدان',
    slug: 'hamedan',
    city: 'همدان',
    address: 'همدان، بلوار ارم، خیابان گلستان',
    phone: '081-38123456',
    manager_name: 'احمد ترکمان',
    manager_phone: '09121234567',
    hours: 'شنبه تا پنجشنبه ۱۰ تا ۲۰',
    coordinates: { lat: 34.7988, lng: 48.5146 },
    is_central: true,
  }
  const existingShowroom = await payload.find({ collection: 'showrooms', where: { slug: { equals: 'hamedan' } }, limit: 1 })
  if (!existingShowroom.docs[0]) {
    await payload.create({ collection: 'showrooms', data: showroomData })
  }
  console.log(`  Showroom: ${showroomData.name}`)

  // --- Articles ---
  const articleData = {
    title: 'راهنمای انتخاب چوب مناسب برای مبلمان',
    slug: 'guide-wood-selection',
    excerpt: 'در این مقاله با انواع چوب‌های مناسب برای ساخت مبلمان آشنا می‌شوید.',
    category: category.id as string,
    tags,
    published_at: new Date().toISOString(),
    author: 'تیم ژیک',
  }
  const existingArticle = await payload.find({ collection: 'articles', where: { slug: { equals: articleData.slug } }, limit: 1 })
  if (!existingArticle.docs[0]) {
    await payload.create({ collection: 'articles', data: articleData })
  }
  console.log(`  Article: ${articleData.title}`)

  console.log('\nSeed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
