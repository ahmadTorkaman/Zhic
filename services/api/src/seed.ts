import { getPayload } from 'payload'
import config from './payload.config'

// --- Lexical helpers (shared from 3.1) ---------------------------------------

type LexicalText = {
  type: 'text'
  version: 1
  text: string
  format: 0
  detail: 0
  mode: 'normal'
  style: ''
}

type LexicalHeading = {
  type: 'heading'
  version: 1
  direction: 'rtl'
  format: ''
  indent: 0
  tag: 'h2' | 'h3'
  children: LexicalText[]
}

type LexicalParagraph = {
  type: 'paragraph'
  version: 1
  direction: 'rtl'
  format: ''
  indent: 0
  children: LexicalText[]
}

type LexicalBlock = (LexicalParagraph | LexicalHeading)

type LexicalDoc = {
  root: {
    type: 'root'
    version: 1
    direction: 'rtl'
    format: ''
    indent: 0
    children: LexicalBlock[]
  }
}

const text = (s: string): LexicalText => ({
  type: 'text',
  version: 1,
  text: s,
  format: 0,
  detail: 0,
  mode: 'normal',
  style: '',
})

const paragraph = (s: string): LexicalParagraph => ({
  type: 'paragraph',
  version: 1,
  direction: 'rtl',
  format: '',
  indent: 0,
  children: [text(s)],
})

const heading = (s: string, tag: 'h2' | 'h3' = 'h2'): LexicalHeading => ({
  type: 'heading',
  version: 1,
  direction: 'rtl',
  format: '',
  indent: 0,
  tag,
  children: [text(s)],
})

const doc = (...paragraphs: string[]): LexicalDoc => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'rtl',
    format: '',
    indent: 0,
    children: paragraphs.map(paragraph),
  },
})

const richDoc = (...blocks: LexicalBlock[]): LexicalDoc => ({
  root: {
    type: 'root',
    version: 1,
    direction: 'rtl',
    format: '',
    indent: 0,
    children: blocks,
  },
})

// --- Seed --------------------------------------------------------------------

async function seed() {
  if (process.env.NODE_ENV === 'production') {
    console.error('Seed script should not run in production.')
    process.exit(1)
  }

  const payload = await getPayload({ config })

  console.log('Seeding database...')

  // Helpers ----------------------------------------------------------------

  type WithId = { id: string | number }

  /* eslint-disable @typescript-eslint/no-explicit-any */
  async function upsertBySlug<T extends WithId>(
    collection: 'categories' | 'tags' | 'materials' | 'designs' | 'products' | 'collections' | 'showrooms' | 'articles' | 'authors' | 'journal-categories',
    slug: string,
    // payload's create signature is heavily generic; loose typing is intentional in seed.
    data: Record<string, unknown>,
  ): Promise<T> {
    const existing: any = await payload.find({
      collection: collection as any,
      where: { slug: { equals: slug } },
      limit: 1,
    })
    if (existing.docs[0]) return existing.docs[0] as T
    return (await payload.create({
      collection: collection as any,
      data: data as any,
    })) as T
  }
  /* eslint-enable @typescript-eslint/no-explicit-any */

  // --- Categories ---------------------------------------------------------

  const catBedroom = await upsertBySlug('categories', 'bedroom', {
    name: 'اتاق خواب',
    slug: 'bedroom',
  })
  const catBeds = await upsertBySlug('categories', 'beds', {
    name: 'تخت‌خواب',
    slug: 'beds',
    description: 'تخت‌خواب‌های دست‌ساز برای آرامش‌ترین لحظه‌های روز.',
  })
  const catWardrobes = await upsertBySlug('categories', 'wardrobes', {
    name: 'کمد',
    slug: 'wardrobes',
    description: 'کمدهای ذخیره‌سازی با هنر چوب‌کاری ایرانی.',
  })
  const catDressers = await upsertBySlug('categories', 'dressers', {
    name: 'دراور',
    slug: 'dressers',
    description: 'دراورهایی برای نظم و زیبایی اتاق.',
  })
  const catMirrors = await upsertBySlug('categories', 'mirrors', {
    name: 'آینه',
    slug: 'mirrors',
    description: 'آینه‌های قاب‌چوبی، روایتی از حضور هنر در روزمرگی.',
  })
  console.log(`  Categories: ${[catBedroom, catBeds, catWardrobes, catDressers, catMirrors].length}`)

  // --- Tags ---------------------------------------------------------------

  const tagWalnut = await upsertBySlug('tags', 'walnut', { name: 'چوب گردو', slug: 'walnut' })
  const tagModern = await upsertBySlug('tags', 'modern', { name: 'مدرن', slug: 'modern' })
  const tagStorage = await upsertBySlug('tags', 'storage', { name: 'ذخیره‌سازی', slug: 'storage' })
  const tagLinen = await upsertBySlug('tags', 'linen', { name: 'کتان', slug: 'linen' })
  const articleTags = [tagWalnut.id, tagModern.id]
  console.log(`  Tags: 4`)

  // --- Materials ----------------------------------------------------------

  const matWalnut = await upsertBySlug('materials', 'walnut', {
    name: 'چوب گردو',
    slug: 'walnut',
    origin: 'گرگان',
  })
  const matBeech = await upsertBySlug('materials', 'beech', {
    name: 'چوب راش',
    slug: 'beech',
    origin: 'مازندران',
  })
  const matOak = await upsertBySlug('materials', 'oak', {
    name: 'چوب بلوط',
    slug: 'oak',
    origin: 'کردستان',
  })
  const matLinen = await upsertBySlug('materials', 'belgian-linen', {
    name: 'کتان بلژیکی',
    slug: 'belgian-linen',
    origin: 'بلژیک',
  })
  // matVelvet exists for filter coverage even if no current product references it;
  // gives the materials facet at least one option that returns zero results, useful
  // for verifying the empty-state path in the filter UI without a bespoke fixture.
  await upsertBySlug('materials', 'velvet', {
    name: 'مخمل کتانی',
    slug: 'velvet',
    origin: 'ایران',
  })
  console.log(`  Materials: 5`)

  // --- Designs ------------------------------------------------------------

  const designAramesh = await upsertBySlug('designs', 'aramesh', {
    name: 'طرح آرامش',
    slug: 'aramesh',
    age_group: 'adult',
    featured: true,
  })
  const designBahar = await upsertBySlug('designs', 'bahar', {
    name: 'طرح بهار',
    slug: 'bahar',
    age_group: 'child',
    featured: true,
  })
  console.log(`  Designs: 2`)

  // --- Products -----------------------------------------------------------

  const productSpecs = [
    {
      name: 'تخت دو نفره آرامش',
      slug: 'takht-aramesh',
      sku: 'BED-001',
      tagline: 'آرام مثل صبح‌های پاییز.',
      shortDescription:
        'تخت‌خواب دو نفره با چوب گردو و طراحی مینیمال؛ برای اتاق‌هایی که سکوت را دوست دارند.',
      longDescription: doc(
        'تخت آرامش، اولین قطعه‌ی طرح آرامش است؛ طراحی شده تا بدون شلوغی، حضوری آرام در اتاق خواب داشته باشد.',
        'بدنه‌ی اصلی از چوب گردوی گرگان است که با روغن طبیعی پرداخت شده، و نوار کتان در پشتی تخت بافت آرامی به فضا می‌بخشد.',
        'هر تخت در کارگاه ما به‌صورت دستی ساخته می‌شود و از سفارش تا تحویل، حدود هشت هفته زمان می‌برد.',
      ),
      design: designAramesh.id,
      piece_type: 'bed',
      categoryIds: [catBeds.id],
      materialIds: [matWalnut.id, matLinen.id],
      tagIds: [tagWalnut.id, tagModern.id],
      basePriceRials: 450_000_000,
      availability: 'made_to_order',
      leadTimeDays: 56,
      dimensions: { width: 180, height: 120, depth: 220 },
      featured: true,
      featuredOrder: 1,
    },
    {
      name: 'پاتختی آرامش',
      slug: 'patakhti-aramesh',
      sku: 'NIT-002',
      tagline: 'یک کشو، یک چراغ، یک کتاب.',
      shortDescription: 'پاتختی هم‌خانواده‌ی تخت آرامش با یک کشو و سطح بالایی برای چراغ شب.',
      longDescription: doc(
        'پاتختی آرامش با همان زبان طراحی تخت آرامش ساخته شده؛ ساده، کم‌حجم و کارآمد.',
        'سطح بالایی برای یک چراغ شب و یک لیوان آب، کشوی پنهان برای کتاب و عینک.',
      ),
      design: designAramesh.id,
      piece_type: 'nightstand',
      categoryIds: [catBedroom.id],
      materialIds: [matWalnut.id],
      tagIds: [tagWalnut.id, tagStorage.id],
      basePriceRials: 95_000_000,
      availability: 'in_stock',
      leadTimeDays: 14,
      dimensions: { width: 50, height: 55, depth: 40 },
    },
    {
      name: 'کمد سه‌درب آرامش',
      slug: 'komod-aramesh',
      sku: 'WRD-003',
      tagline: 'فضای زیادی برای آن‌چه دوست دارید.',
      shortDescription: 'کمد سه‌درب با چوب گردو و آینه‌ی یک‌پارچه در درب وسط.',
      longDescription: doc(
        'کمد آرامش با سه درب، یک آینه‌ی یک‌پارچه در درب میانی و فضای داخلی قابل‌سفارش طراحی شده است.',
        'تقسیم‌بندی داخلی شامل میله‌ی لباس، چند کشو و قفسه‌های قابل‌جابه‌جایی است.',
      ),
      design: designAramesh.id,
      piece_type: 'closet',
      categoryIds: [catWardrobes.id],
      materialIds: [matWalnut.id, matBeech.id],
      tagIds: [tagWalnut.id, tagStorage.id],
      basePriceRials: 320_000_000,
      availability: 'made_to_order',
      leadTimeDays: 70,
      dimensions: { width: 200, height: 220, depth: 60 },
    },
    {
      name: 'دراور آرامش',
      slug: 'dravar-aramesh',
      sku: 'DRS-004',
      tagline: 'پنج کشو، خط‌های آرام.',
      shortDescription: 'دراور پنج‌کشو با دستگیره‌های توکار از چوب گردو.',
      longDescription: doc(
        'دراور آرامش، پنج کشو با ریل‌های آرام‌بند دارد و قابلیت قفل اختیاری برای کشوی بالایی.',
      ),
      design: designAramesh.id,
      piece_type: 'dresser',
      categoryIds: [catDressers.id],
      materialIds: [matWalnut.id],
      tagIds: [tagWalnut.id, tagStorage.id],
      basePriceRials: 180_000_000,
      availability: 'in_stock',
      leadTimeDays: 21,
      dimensions: { width: 110, height: 90, depth: 50 },
    },
    {
      name: 'آینه‌ی قاب‌چوبی آرامش',
      slug: 'aiineh-aramesh',
      sku: 'MIR-005',
      tagline: 'یک قاب آرام برای انعکاس روزها.',
      shortDescription: 'آینه‌ی بزرگ با قاب چوب بلوط؛ مناسب نصب روی دیوار یا پشت دراور.',
      longDescription: doc(
        'آینه‌ی آرامش با قاب چوب بلوط ساخته شده و دارای پوشش ضد رطوبت در پشت قاب است.',
      ),
      design: designAramesh.id,
      piece_type: 'mirror',
      categoryIds: [catMirrors.id],
      materialIds: [matOak.id],
      tagIds: [tagModern.id],
      basePriceRials: 65_000_000,
      availability: 'in_stock',
      leadTimeDays: 7,
      dimensions: { width: 80, height: 180, depth: 4 },
    },
    {
      name: 'تخت تک‌نفره بهار',
      slug: 'takht-bahar',
      sku: 'BED-006',
      tagline: 'برای رؤیاهای کوچک و بزرگ.',
      shortDescription: 'تخت تک‌نفره طرح بهار با خطوط نرم و رنگ‌های گرم؛ مناسب اتاق کودک.',
      longDescription: doc(
        'تخت بهار با چوب راش ساخته شده و تمامی لبه‌ها برای ایمنی کودک گرد‌گوشه طراحی شده‌اند.',
        'پارچه‌ی پشتی تخت قابل‌تعویض است و در چند رنگ از کتان بلژیکی موجود است.',
      ),
      design: designBahar.id,
      piece_type: 'bed',
      categoryIds: [catBeds.id],
      materialIds: [matBeech.id, matLinen.id],
      tagIds: [tagLinen.id],
      basePriceRials: 280_000_000,
      availability: 'made_to_order',
      leadTimeDays: 42,
      dimensions: { width: 100, height: 100, depth: 200 },
    },
    {
      name: 'کمد بهار',
      slug: 'komod-bahar',
      sku: 'WRD-007',
      tagline: 'هر چیزی جای خودش.',
      shortDescription: 'کمد دو درب طرح بهار با ارتفاع مناسب اتاق کودک.',
      longDescription: doc(
        'کمد بهار با ارتفاع کمتر از یک کمد بزرگسال طراحی شده تا کودک به‌راحتی به وسایلش دسترسی داشته باشد.',
      ),
      design: designBahar.id,
      piece_type: 'closet',
      categoryIds: [catWardrobes.id],
      materialIds: [matBeech.id],
      tagIds: [tagStorage.id],
      basePriceRials: 165_000_000,
      availability: 'made_to_order',
      leadTimeDays: 56,
      dimensions: { width: 140, height: 180, depth: 55 },
    },
    {
      name: 'میز تحریر بهار',
      slug: 'miz-bahar',
      sku: 'DSK-008',
      tagline: 'برای اولین کلمه‌های نوشتن.',
      shortDescription: 'میز تحریر کوچک با کشوی نگه‌دار مداد و سطح کار وسیع.',
      longDescription: doc(
        'میز بهار با ارتفاع قابل‌تنظیم برای رشد کودک، یک کشو و سطح کار وسیع طراحی شده است.',
      ),
      design: designBahar.id,
      piece_type: 'desk',
      categoryIds: [catBedroom.id],
      materialIds: [matBeech.id],
      tagIds: [tagModern.id],
      basePriceRials: 120_000_000,
      availability: 'in_stock',
      leadTimeDays: 14,
      dimensions: { width: 110, height: 75, depth: 60 },
    },
  ] as const

  // First pass: create products without related/pairs (to know IDs).
  const productIdBySlug = new Map<string, number>()
  for (const p of productSpecs) {
    const created = await upsertBySlug('products', p.slug, {
      ...p,
      inquiry_enabled: true,
    })
    productIdBySlug.set(p.slug, created.id as number)
    console.log(`  Product: ${p.name}`)
  }

  // Second pass: wire related + pairsWith on the two flagship products.
  const idAramesh = productIdBySlug.get('takht-aramesh')!
  const idPatakhti = productIdBySlug.get('patakhti-aramesh')!
  const idKomod = productIdBySlug.get('komod-aramesh')!
  const idDravar = productIdBySlug.get('dravar-aramesh')!
  const idAiineh = productIdBySlug.get('aiineh-aramesh')!
  const idTakhtBahar = productIdBySlug.get('takht-bahar')!
  const idKomodBahar = productIdBySlug.get('komod-bahar')!

  await payload.update({
    collection: 'products',
    id: idAramesh,
    data: {
      relatedProductIds: [idTakhtBahar, idKomod],
      pairsWithProductIds: [idPatakhti, idDravar, idAiineh],
    },
  })

  await payload.update({
    collection: 'products',
    id: idTakhtBahar,
    data: {
      relatedProductIds: [idAramesh],
      pairsWithProductIds: [idKomodBahar],
    },
  })

  console.log('  Product relations: wired (related + pairsWith)')

  // --- Showrooms ----------------------------------------------------------

  const weekdays10to20 = (
    days: ReadonlyArray<'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri'>,
    closed: ReadonlyArray<'sat' | 'sun' | 'mon' | 'tue' | 'wed' | 'thu' | 'fri'>,
    opens = '10:00',
    closes = '20:00',
  ) => [
    ...days.map((day) => ({ day, opens, closes, closed: false })),
    ...closed.map((day) => ({ day, opens: null, closes: null, closed: true })),
  ]

  await upsertBySlug('showrooms', 'hamedan', {
    name: 'شوروم همدان',
    slug: 'hamedan',
    headline: 'جایی که ژیک از آن آغاز شد.',
    description: doc(
      'شوروم همدان، خانه‌ی ژیک است. بزرگ‌ترین مجموعه از طرح‌های ما این‌جا چیده شده تا بتوانید قبل از سفارش، چوب را لمس کنید و کتان را روی نور صبح ببینید.',
      'تیم همدان شامل سه نفر از قدیمی‌ترین استادکاران ژیک است و معمولاً چند قطعه‌ی نمایشگاهی نیز در حال ساخت در محل دیده می‌شود.',
    ),
    address: {
      province: 'همدان',
      city: 'همدان',
      district: 'بلوار ارم',
      street: 'خیابان گلستان',
      plaque: '۱۲',
      unit: '۳',
      postalCode: '6516745879',
      notes: 'نزدیک پارک ارم، کنار کافه گلستان',
    },
    geo: { lat: 34.7988, lng: 48.5146 },
    phone: '081-38123456',
    email: 'hamedan@zhicwood.com',
    hours: weekdays10to20(
      ['sat', 'sun', 'mon', 'tue', 'wed', 'thu'],
      ['fri'],
    ),
    parkingNotes: 'پارکینگ اختصاصی برای مهمانان شوروم در کنار ساختمان.',
    transitNotes: 'دسترسی با خط اتوبوس ارم — ایستگاه گلستان.',
    appointmentOnly: false,
    featuredProductIds: [idAramesh, idKomod, idDravar],
    neshanProfileUrl: 'https://nshn.ir/example-hamedan',
    manager_name: 'احمد ترکمان',
    manager_phone: '09121234567',
    is_central: true,
  })
  console.log('  Showroom: شوروم همدان')

  await upsertBySlug('showrooms', 'tehran', {
    name: 'شوروم تهران',
    slug: 'tehran',
    headline: 'برای دیدن قطعات جدید، از تهران شروع کنید.',
    description: doc(
      'شوروم تهران، نزدیک‌ترین حضور ژیک به مرکز کشور است. در این فضا، مجموعه‌ی محدودی از طرح آرامش به‌همراه قطعات سفارشی ویژه‌ی پایتخت ارائه می‌شود.',
    ),
    address: {
      province: 'تهران',
      city: 'تهران',
      district: 'سعادت‌آباد',
      street: 'خیابان علامه شمالی',
      plaque: '۴۲',
      postalCode: '1998765432',
    },
    geo: { lat: 35.7795, lng: 51.3925 },
    phone: '021-22123456',
    email: 'tehran@zhicwood.com',
    hours: weekdays10to20(
      ['sat', 'sun', 'mon', 'tue', 'wed', 'thu'],
      ['fri'],
      '11:00',
      '21:00',
    ),
    transitNotes: 'نزدیک ایستگاه مترو صنعت.',
    appointmentOnly: false,
    featuredProductIds: [idAramesh, idTakhtBahar, idAiineh],
    manager_name: 'مهسا کیانی',
    manager_phone: '09123456789',
    is_central: false,
  })
  console.log('  Showroom: شوروم تهران')

  await upsertBySlug('showrooms', 'isfahan', {
    name: 'شوروم اصفهان',
    slug: 'isfahan',
    headline: 'هم‌نشینی هنر چوب‌کاری اصفهان با طراحی مدرن ژیک.',
    description: doc(
      'شوروم اصفهان فقط با وقت قبلی پذیرای مهمانان است؛ فضایی کوچک‌تر اما با تمرکز بر قطعات سفارشی برای مشتریان جنوب کشور.',
    ),
    address: {
      province: 'اصفهان',
      city: 'اصفهان',
      district: 'خیابان چهارباغ',
      street: 'کوچه‌ی شفق',
      plaque: '۸',
      unit: '۱',
      postalCode: '8133456789',
    },
    geo: { lat: 32.6539, lng: 51.6660 },
    phone: '031-36789012',
    email: 'isfahan@zhicwood.com',
    hours: weekdays10to20(
      ['sun', 'mon', 'tue', 'wed', 'thu'],
      ['fri', 'sat'],
    ),
    appointmentOnly: true,
    transitNotes: 'پارکینگ عمومی چهارباغ در ۱۰۰ متری.',
    featuredProductIds: [idKomodBahar, idTakhtBahar],
    manager_name: 'علیرضا یزدانی',
    manager_phone: '09135678901',
    is_central: false,
  })
  console.log('  Showroom: شوروم اصفهان')

  // --- Authors ------------------------------------------------------------

  const authorTeam = await upsertBySlug('authors', 'team-zhic', {
    name: 'تیم ژیک',
    slug: 'team-zhic',
    role: 'تحریریه',
  })
  const authorSara = await upsertBySlug('authors', 'sara-ahmadi', {
    name: 'سارا احمدی',
    slug: 'sara-ahmadi',
    role: 'نویسنده',
    bio: doc('سارا احمدی، نویسنده‌ی ژورنال ژیک و علاقه‌مند به طراحی داخلی و سبک زندگی ایرانی.'),
    social: {
      instagram: 'sara.ahmadi.zhic',
      telegram: 'sara_ahmadi',
    },
  })
  console.log('  Authors: ۲')

  // --- Journal categories ------------------------------------------------

  const jcMaterials = await upsertBySlug('journal-categories', 'materials-guide', {
    name: 'متریال‌شناسی',
    slug: 'materials-guide',
    description: 'آشنایی با انواع چوب و متریال‌های به‌کاررفته در ساخت مبلمان.',
  })
  const jcLifestyle = await upsertBySlug('journal-categories', 'lifestyle', {
    name: 'سبک زندگی',
    slug: 'lifestyle',
    description: 'یادداشت‌هایی درباره‌ی خانه، آرامش و زندگی روزمره.',
  })
  const jcCare = await upsertBySlug('journal-categories', 'care-maintenance', {
    name: 'مراقبت و نگهداری',
    slug: 'care-maintenance',
    description: 'راهنمای نگهداری از مبلمان چوبی و کتانی.',
  })
  console.log('  Journal categories: ۳')

  // --- Articles -----------------------------------------------------------

  const article1 = await upsertBySlug('articles', 'guide-wood-selection', {
    title: 'راهنمای انتخاب چوب مناسب برای مبلمان',
    slug: 'guide-wood-selection',
    excerpt: 'در این مقاله با انواع چوب‌های مناسب برای ساخت مبلمان آشنا می‌شوید و تفاوت‌های آن‌ها را می‌آموزید.',
    body: richDoc(
      heading('چرا انتخاب چوب مهم است؟'),
      paragraph('چوب، روح مبلمان است. هر گونه‌ی چوب خاصیت‌های منحصربه‌فردی دارد که بر زیبایی، دوام و حتی حسّ لمس مبلمان تأثیر می‌گذارد.'),
      paragraph('در ژیک، ما از سه گونه‌ی اصلی چوب استفاده می‌کنیم: گردو، راش و بلوط. هر کدام داستان خودشان را دارند.'),
      heading('چوب گردو'),
      paragraph('چوب گردو از بهترین چوب‌های ایرانی برای مبلمان است. رنگ قهوه‌ای گرم و رگه‌های طبیعی آن، حسّ گرما و طبیعت را به هر اتاقی می‌آورد.'),
      paragraph('گردوی گرگان که ما استفاده می‌کنیم، تراکم بالایی دارد و در برابر رطوبت مقاوم‌تر از بسیاری گونه‌های وارداتی است.'),
      heading('چوب راش'),
      paragraph('چوب راش مازندران، سبک‌تر و روشن‌تر از گردو است. ایده‌آل برای اتاق کودک و فضاهایی که نور طبیعی زیادی دارند.'),
      heading('چوب بلوط'),
      paragraph('بلوط کردستان، سخت‌ترین چوبی است که استفاده می‌کنیم. مناسب قطعاتی که نیاز به استحکام بالا دارند، مثل میز ناهارخوری و قاب آینه.'),
      heading('چگونه انتخاب کنیم؟', 'h3'),
      paragraph('انتخاب چوب به فضای شما، سبک زندگی‌تان و بودجه بستگی دارد. تیم ژیک در شوروم‌ها آماده‌ی مشاوره است.'),
    ),
    author: authorTeam.id,
    category: jcMaterials.id,
    tagIds: [tagWalnut.id, tagModern.id],
    relatedProducts: [idAramesh, idDravar],
    publishedAt: new Date().toISOString(),
    status: 'published',
    featured: true,
  })
  console.log('  Article: راهنمای انتخاب چوب')

  const article2 = await upsertBySlug('articles', 'bedroom-calm-design', {
    title: 'طراحی اتاق خواب آرام: اصول و ایده‌ها',
    slug: 'bedroom-calm-design',
    excerpt: 'اتاق خواب آرام فقط یک تخت نیست؛ ترکیبی از نور، رنگ، متریال و چیدمان است که حسّ آرامش خلق می‌کند.',
    body: richDoc(
      heading('آرامش از کجا شروع می‌شود؟'),
      paragraph('اتاق خواب، شخصی‌ترین فضای خانه است. جایی که روز تمام می‌شود و دوباره آغاز می‌شود. طراحی این فضا نباید شلوغ باشد.'),
      paragraph('ما در ژیک معتقدیم که کمتر، بیشتر است. هر قطعه‌ای که در اتاق خواب قرار می‌گیرد باید دلیلی برای حضورش داشته باشد.'),
      heading('رنگ و نور'),
      paragraph('رنگ‌های خنثی و گرم مثل شیری، خاکی و قهوه‌ای روشن، بهترین انتخاب برای اتاق خواب هستند. نور طبیعی را با پرده‌های کتانی فیلتر کنید.'),
      heading('متریال‌های آرام‌بخش', 'h3'),
      paragraph('چوب طبیعی، کتان و پنبه حس آرامش را تقویت می‌کنند. از متریال‌های مصنوعی و براق پرهیز کنید.'),
      heading('چیدمان'),
      paragraph('تخت را مرکز فضا قرار دهید. فاصله‌ی کافی از دیوارها بگذارید تا هوا جریان داشته باشد. پاتختی‌ها باید هم‌ارتفاع با سطح تشک باشند.'),
      heading('قطعات پیشنهادی ژیک', 'h3'),
      paragraph('مجموعه‌ی آرامش با تخت، پاتختی، کمد و دراور هماهنگ طراحی شده تا اتاق خواب شما یک زبان واحد داشته باشد.'),
    ),
    author: authorSara.id,
    category: jcLifestyle.id,
    tagIds: [tagModern.id, tagLinen.id],
    relatedProducts: [idAramesh, idPatakhti, idKomod],
    publishedAt: new Date().toISOString(),
    status: 'published',
  })
  console.log('  Article: طراحی اتاق خواب آرام')

  const article3 = await upsertBySlug('articles', 'wood-care-guide', {
    title: 'نگهداری از مبلمان چوبی: آنچه باید بدانید',
    slug: 'wood-care-guide',
    excerpt: 'مبلمان چوبی با مراقبت درست، نسل به نسل همراه خانواده می‌ماند. در این مقاله اصول نگهداری را می‌آموزید.',
    body: richDoc(
      heading('چرا نگهداری مهم است؟'),
      paragraph('مبلمان چوبی یک سرمایه‌گذاری بلندمدت است. با مراقبت ساده و منظم، می‌توانید عمر آن را چندین برابر کنید.'),
      heading('تمیز کردن روزانه'),
      paragraph('از دستمال نرم و کمی مرطوب استفاده کنید. هرگز شوینده‌های شیمیایی قوی روی چوب نزنید.'),
      heading('محافظت در برابر رطوبت', 'h3'),
      paragraph('از قرار دادن لیوان بدون زیرلیوانی روی سطح چوب خودداری کنید. رطوبت مداوم باعث تغییر رنگ و تاب‌برداشتن چوب می‌شود.'),
      heading('روغن‌زنی دوره‌ای'),
      paragraph('هر شش ماه یک‌بار با روغن طبیعی چوب (مثل روغن تانگ) سطح مبلمان را تغذیه کنید. این کار درخشندگی و مقاومت چوب را حفظ می‌کند.'),
      heading('نکات فصلی', 'h3'),
      paragraph('در زمستان، هوای خشک بخاری می‌تواند به چوب آسیب بزند. از مرطوب‌کننده‌ی هوا استفاده کنید یا ظرف آبی کنار بخاری بگذارید.'),
    ),
    author: authorTeam.id,
    category: jcCare.id,
    tagIds: [tagWalnut.id],
    relatedProducts: [idAiineh, idDravar],
    publishedAt: new Date().toISOString(),
    status: 'published',
  })
  console.log('  Article: نگهداری از مبلمان چوبی')

  // Wire related articles
  await payload.update({
    collection: 'articles',
    id: article1.id,
    data: { relatedArticles: [article2.id, article3.id] },
  })
  await payload.update({
    collection: 'articles',
    id: article2.id,
    data: { relatedArticles: [article1.id, article3.id] },
  })
  await payload.update({
    collection: 'articles',
    id: article3.id,
    data: { relatedArticles: [article1.id, article2.id] },
  })
  console.log('  Article relations: wired')

  // --- Collections --------------------------------------------------------

  await upsertBySlug('collections', 'shab-aram', {
    name: 'مجموعه‌ی شب آرام',
    slug: 'shab-aram',
    description: doc(
      'شب آرام، مجموعه‌ای از قطعات اتاق خواب طرح آرامش است؛ از تخت تا پاتختی و دراور، همه با یک زبان طراحی.',
      'این مجموعه برای کسانی است که می‌خواهند اتاق خواب‌شان حسی هماهنگ و آرام داشته باشد.',
    ),
    products: [idAramesh, idPatakhti, idDravar],
    featured: true,
  })
  console.log('  Collection: مجموعه‌ی شب آرام')

  // --- Home global --------------------------------------------------------

  const brandStatement = doc(
    'ژیک از همدان آغاز شده است؛ از کارگاهی که در آن چوب گردو، کتان بلژیکی و دستانِ صبورِ استادکاران، یک قطعه مبلمان را می‌سازند که می‌ماند.',
    'ما باور داریم اتاق خواب، آرام‌ترین و شخصی‌ترین جای خانه است. هر قطعه‌ای که می‌سازیم، برای همان لحظه‌ی صبح زود است که نور آرام از میان پرده عبور می‌کند.',
    'از طراحی تا تحویل، به جزئیات وفاداریم. نه بیشتر از آنچه لازم است می‌سازیم، نه کمتر از آنچه شایسته است.',
  )

  await payload.updateGlobal({
    slug: 'home',
    data: {
      hero_heading: 'ساخته‌شده برای ماندن',
      hero_subheading: 'مبلمان دست‌ساز برای خانه‌هایی که آرامش را می‌فهمند',
      brand_statement: brandStatement,
      featured_designs: [designAramesh.id, designBahar.id],
      journal_teaser_heading: 'از ژورنال',
      inquiry_cta_heading: 'سفارش و مشاوره',
    },
  })
  console.log('  Home global: populated')

  // --- About global -------------------------------------------------------

  await payload.updateGlobal({
    slug: 'about',
    data: {
      title: 'درباره ژیک',
      body: doc(
        'ژیک از سال ۱۳۹۸ در همدان فعالیت خود را آغاز کرده است. کارگاه ما جایی است که چوب گردوی گرگان، کتان بلژیکی و دست‌های استادکاران ایرانی کنار هم می‌آیند تا مبلمانی بسازند که نسل به نسل همراه خانواده بماند.',
        'ما باور داریم طراحی خوب نباید شلوغ باشد. هر قطعه‌ای که می‌سازیم، ساده، کارآمد و زیباست — نه بیشتر از آنچه لازم است، نه کمتر از آنچه شایسته است.',
        'تیم ژیک شامل طراحان صنعتی، نجّاران باتجربه و متخصصان پارچه است. همه‌ی ما یک هدف مشترک داریم: ساختن مبلمانی که وقتی واردِ خانه‌تان می‌شود، حس آرامش بیاورد.',
      ),
    },
  })
  console.log('  About global: populated')

  // --- FAQ global ---------------------------------------------------------

  await payload.updateGlobal({
    slug: 'faq',
    data: {
      title: 'سوالات متداول',
      items: [
        {
          question: 'زمان تحویل سفارش چقدر است؟',
          answer: doc('زمان تحویل بسته به نوع محصول بین ۲ تا ۱۰ هفته متغیر است. محصولات موجود در انبار ظرف ۱ تا ۲ هفته ارسال می‌شوند و محصولات سفارشی بین ۶ تا ۱۰ هفته زمان نیاز دارند.'),
        },
        {
          question: 'آیا امکان سفارشی‌سازی محصولات وجود دارد؟',
          answer: doc('بله، بیشتر محصولات ژیک قابل سفارشی‌سازی هستند. شما می‌توانید نوع چوب، رنگ پارچه و ابعاد را بر اساس نیاز خود انتخاب کنید. برای مشاوره با تیم ما تماس بگیرید.'),
        },
        {
          question: 'از چه نوع چوبی استفاده می‌کنید؟',
          answer: doc('ما عمدتاً از سه نوع چوب استفاده می‌کنیم: چوب گردوی گرگان، چوب راش مازندران و چوب بلوط کردستان. هر کدام ویژگی‌های منحصربه‌فردی دارند که در صفحه‌ی ژورنال ما توضیح داده شده است.'),
        },
        {
          question: 'شرایط بازگشت کالا چیست؟',
          answer: doc('اگر محصول دریافتی آسیب‌دیده یا با سفارش شما مطابقت نداشته باشد، تا ۷ روز پس از تحویل امکان بازگشت وجود دارد. لطفاً صفحه‌ی شرایط بازگشت را مطالعه کنید.'),
        },
        {
          question: 'آیا امکان بازدید از شوروم وجود دارد؟',
          answer: doc('بله، شوروم‌های ما در همدان، تهران و اصفهان آماده‌ی پذیرایی هستند. شوروم اصفهان فقط با وقت قبلی پذیرای مهمانان است. ساعات کاری و آدرس دقیق را در صفحه‌ی شوروم‌ها ببینید.'),
        },
      ],
    },
  })
  console.log('  FAQ global: populated')

  // --- Atelier global -----------------------------------------------------

  await payload.updateGlobal({
    slug: 'atelier',
    data: {
      title: 'کارگاه ژیک',
      body: doc(
        'کارگاه ژیک در همدان، جایی است که هر قطعه‌ی مبلمان متولد می‌شود. از انتخاب چوب تا پرداخت نهایی، تمام مراحل در این‌جا انجام می‌شود.',
        'استادکاران ما سال‌ها تجربه در نجاری سنتی ایرانی دارند و آن را با تکنیک‌های مدرن طراحی ترکیب می‌کنند. نتیجه مبلمانی است که هم زیبا است و هم ماندگار.',
        'هر قطعه‌ی چوب قبل از ورود به خط تولید، بررسی و انتخاب می‌شود. ما فقط از چوب‌هایی استفاده می‌کنیم که از جنگل‌های مدیریت‌شده تأمین شده‌اند.',
      ),
    },
  })
  console.log('  Atelier global: populated')

  // --- Care global --------------------------------------------------------

  await payload.updateGlobal({
    slug: 'care',
    data: {
      title: 'راهنمای نگهداری',
      body: doc(
        'مبلمان چوبی ژیک با مراقبت ساده، سال‌ها همراه شما می‌ماند. در این صفحه اصول نگهداری از محصولات ما را می‌آموزید.',
        'برای تمیز کردن سطوح چوبی از دستمال نرم و کمی مرطوب استفاده کنید. هرگز از شوینده‌های شیمیایی قوی استفاده نکنید.',
        'هر ۶ ماه یک‌بار سطح چوب را با روغن طبیعی (مثل روغن تانگ) تغذیه کنید. این کار درخشندگی و مقاومت چوب را حفظ می‌کند.',
        'از قرار دادن مبلمان در معرض مستقیم نور آفتاب و حرارت بخاری خودداری کنید. در زمستان از مرطوب‌کننده‌ی هوا استفاده کنید.',
      ),
    },
  })
  console.log('  Care global: populated')

  // --- Events global ------------------------------------------------------

  await payload.updateGlobal({
    slug: 'events',
    data: {
      title: 'رویدادها',
      items: [
        {
          title: 'کارگاه آشنایی با چوب‌های ایرانی',
          description: doc('یک روز با استادکاران ژیک در کارگاه همدان. در این کارگاه با انواع چوب‌های ایرانی آشنا می‌شوید و یک قطعه‌ی کوچک چوبی می‌سازید.'),
          date: '2026-05-15',
          location: 'کارگاه ژیک، همدان',
        },
        {
          title: 'نمایشگاه مجموعه‌ی شب آرام',
          description: doc('رونمایی از مجموعه‌ی کامل شب آرام در شوروم تهران. فرصتی برای دیدن و لمس تمامی قطعات این مجموعه.'),
          date: '2026-06-01',
          location: 'شوروم تهران، سعادت‌آباد',
        },
        {
          title: 'بازدید از کارگاه — ویژه‌ی مشتریان',
          description: doc('بازدید اختصاصی از فرآیند ساخت مبلمان در کارگاه همدان. ظرفیت محدود — ثبت‌نام الزامی است.'),
          date: '2026-06-20',
          location: 'کارگاه ژیک، همدان',
        },
      ],
    },
  })
  console.log('  Events global: populated')

  console.log('\nSeed complete!')
  process.exit(0)
}

seed().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
