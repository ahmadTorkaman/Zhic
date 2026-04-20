import { Aspect, Badge, Breadcrumbs, Button, Container, DateDisplay, FormField, Input, MoneyDisplay, Pagination, PhoneLink, Pill, Section, Select, SkipLink, Textarea } from '@zhic/ui';
import { GlassCard } from '@/components/shared/GlassCard';
import { Tile } from '@/components/tile/Tile';
import { HorizontalTile } from '@/components/tile/HorizontalTile';
import { PayloadImage } from '@/components/PayloadImage';
import { HeroOverlayText } from '@/components/hero/HeroOverlayText';
import { StickyBreadcrumb } from '@/components/layout/StickyBreadcrumb';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { PageHeader } from '@/components/hero/PageHeader';
import { HomeHero } from '@/components/hero/HomeHero';
import { CinematicHero } from '@/components/hero/CinematicHero';
import { ArticleHero } from '@/components/hero/ArticleHero';
import { CollectionHero } from '@/components/hero/CollectionHero';
import { EditorialHero } from '@/components/hero/EditorialHero';
import { GlassOverlayHero } from '@/components/hero/GlassOverlayHero';
import { DarkSplitHero } from '@/components/hero/DarkSplitHero';
import { InquiryForm } from '@/components/inquiry/InquiryForm';
import { InquiryFormSlim } from '@/components/inquiry/InquiryFormSlim';
import { HomeBrandStatement } from '@/components/home/HomeBrandStatement';
import { HomeFeaturedDesigns } from '@/components/home/HomeFeaturedDesigns';
import { HomeShowroomsStrip } from '@/components/home/HomeShowroomsStrip';
import { HomeJournalTeaser } from '@/components/home/HomeJournalTeaser';
import { HomeInquiryCta } from '@/components/home/HomeInquiryCta';
import { ProductIndexHero } from '@/components/product/ProductIndexHero';
import { ProductFilterPills } from '@/components/product/ProductFilterPills';
import { ProductIndexToolbar } from '@/components/product/ProductIndexToolbar';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductSidebar } from '@/components/product/ProductSidebar';
import { ProductThumbnails } from '@/components/product/ProductThumbnails';
import { SpecsAccordion } from '@/components/product/SpecsAccordion';
import type { PayloadProduct, PayloadArticle, PayloadAuthor, LexicalRoot } from '@/lib/payload';
import { JournalFeaturedArticle } from '@/components/journal/JournalFeaturedArticle';
import { JournalGrid } from '@/components/journal/JournalGrid';
import { AuthorCard } from '@/components/journal/AuthorCard';
import { ArticleProse } from '@/components/journal/ArticleProse';

const FAKE_PRODUCTS: PayloadProduct[] = [
  {
    id: 1,
    slug: 'arta',
    name: 'میز ناهارخوری آرتا',
    basePriceRials: 450_000_000_000,
    availability: 'in_stock',
    sku: 'ART-001',
    featured: true,
    gallery: [],
    materialIds: [{ id: 'm1', name: 'چوب گردو', slug: 'walnut' }],
  } as unknown as PayloadProduct,
  {
    id: 2,
    slug: 'parsa',
    name: 'صندلی راحتی پارسا',
    basePriceRials: 125_000_000_000,
    availability: 'in_stock',
    sku: 'PAR-001',
    gallery: [],
    materialIds: [{ id: 'm2', name: 'چوب بلوط', slug: 'oak' }],
  } as unknown as PayloadProduct,
  {
    id: 3,
    slug: 'diba',
    name: 'تخت خواب دیبا',
    basePriceRials: 680_000_000_000,
    availability: 'in_stock',
    sku: 'DIB-001',
    gallery: [],
    materialIds: [{ id: 'm1', name: 'چوب گردو', slug: 'walnut' }],
  } as unknown as PayloadProduct,
  {
    id: 4,
    slug: 'sara',
    name: 'کمد لباس سارا',
    basePriceRials: 350_000_000_000,
    availability: 'in_stock',
    sku: 'SAR-001',
    gallery: [],
    materialIds: [{ id: 'm1', name: 'چوب گردو', slug: 'walnut' }],
  } as unknown as PayloadProduct,
];

const FAKE_CATEGORIES = [
  { name: 'تخت خواب', slug: 'beds' },
  { name: 'میز', slug: 'tables' },
  { name: 'صندلی', slug: 'chairs' },
  { name: 'کمد', slug: 'cabinets' },
];

const FAKE_MATERIALS = [
  { name: 'چوب گردو', slug: 'walnut' },
  { name: 'چوب بلوط', slug: 'oak' },
];

const FAKE_CAT_MATERIAL = { id: 'c1', name: 'مواد و متریال', slug: 'materials' };
const FAKE_CAT_DESIGN   = { id: 'c2', name: 'طراحی',         slug: 'design'    };
const FAKE_CAT_CARE     = { id: 'c3', name: 'مراقبت',        slug: 'care'      };
const FAKE_CAT_LIFE     = { id: 'c4', name: 'سبک زندگی',     slug: 'lifestyle' };

const FAKE_ARTICLE: PayloadArticle = {
  id: 'a1',
  title: 'چرا گردوی ایرانی؟ سفر یک تخته از جنگل تا کارگاه',
  slug: 'why-iranian-walnut',
  excerpt: 'جنگل‌های هیرکانی شمال ایران میزبان یکی از باارزش‌ترین گونه‌های گردو در جهان هستند. ما این چوب را با احترام به طبیعت تهیه می‌کنیم.',
  cover: null,
  category: FAKE_CAT_MATERIAL,
  readingTimeMinutes: 7,
  publishedAt: '2026-04-15T00:00:00.000Z',
} as PayloadArticle;

const FAKE_ARTICLES: PayloadArticle[] = [
  { id: 'a2', title: 'مینیمالیسم ایرانی: کم‌تر، اما باشکوه‌تر',             slug: 'iranian-minimalism',   cover: null, category: FAKE_CAT_DESIGN,   readingTimeMinutes: 5, publishedAt: null } as PayloadArticle,
  { id: 'a3', title: 'راهنمای نگهداری از مبلمان چوبی در فصل گرما',         slug: 'wood-care-summer',     cover: null, category: FAKE_CAT_CARE,     readingTimeMinutes: 4, publishedAt: null } as PayloadArticle,
  { id: 'a4', title: 'هنر آهسته زیستن: خانه‌ای که نفس می‌کشد',             slug: 'slow-living',          cover: null, category: FAKE_CAT_LIFE,     readingTimeMinutes: 6, publishedAt: null } as PayloadArticle,
  { id: 'a5', title: 'کتان بلژیکی: از مزرعه تا مبل شما',                   slug: 'belgian-linen',        cover: null, category: FAKE_CAT_MATERIAL, readingTimeMinutes: 8, publishedAt: null } as PayloadArticle,
  { id: 'a6', title: 'تقارن در بی‌قاعدگی: اصول طراحی ژیک',                 slug: 'zhic-design-principles',cover: null, category: FAKE_CAT_DESIGN,  readingTimeMinutes: 5, publishedAt: null } as PayloadArticle,
  { id: 'a7', title: 'بلوط اروپایی در مقابل گردوی ایرانی',                  slug: 'oak-vs-walnut',        cover: null, category: FAKE_CAT_MATERIAL, readingTimeMinutes: 6, publishedAt: null } as PayloadArticle,
];

const FAKE_AUTHOR: PayloadAuthor = {
  id: 'au1',
  name: 'احمد تهرانی',
  slug: 'ahmad-tehrani',
  role: 'بنیان‌گذار و طراح ارشد',
  bio: {
    root: {
      type: 'root',
      children: [
        { type: 'paragraph', children: [{ type: 'text', text: 'از سال ۱۳۸۰ در صنایع چوب فعالیت دارد. ژیک را با هدف ساخت مبلمان ماندگار با روح ایرانی تأسیس کرد.' }] },
      ],
    },
  } as LexicalRoot,
  avatar: null,
};

const FAKE_BODY: LexicalRoot = {
  root: {
    type: 'root',
    children: [
      { type: 'paragraph', children: [{ type: 'text', text: 'متن نمونه مقاله. این بخش برای نمایش تایپوگرافی متن مقاله در ArticleProse استفاده می‌شود.' }] },
      { type: 'paragraph', children: [{ type: 'text', text: 'پاراگراف دوم با متن بلندتر برای نشان دادن فاصله‌گذاری و line-height.' }] },
    ],
  },
} as LexicalRoot;

/**
 * /lab — component gallery. Every component built in v2 lands here
 * with its prop variants, so they can be eyeball-verified against
 * the mockups at http://80.240.31.146:9090/.superpowers/.
 */
export default function LabPage() {
  return (
    <main className="min-h-screen bg-ivory text-charcoal">
      <header className="sticky top-0 z-[var(--z-sticky)] border-b border-sand bg-ivory/85 backdrop-blur">
        <div className="mx-auto max-w-[var(--container-storefront)] px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-h4 font-black text-ink">ژیک — Lab</h1>
            <p className="text-small text-stone">v2 component gallery</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[var(--container-storefront)] px-6 py-12">
        <p className="mb-12 max-w-prose text-body text-stone">
          Components are added here as they ship. Compare each with its mockup at
          {' '}<a href="http://80.240.31.146:9090/.superpowers/" className="underline underline-offset-4 hover:decoration-2" target="_blank" rel="noreferrer">superpowers</a>.
        </p>
        <div className="space-y-16">
          <section id="layout-primitives">
            <h2 className="mb-4 text-h2 font-black text-ink">Layout primitives</h2>
            <p className="mb-6 text-small text-stone">Container, Section, SkipLink</p>

            <h3 className="mb-3 text-h4 font-bold">Section variants — backgrounds</h3>
            <div className="space-y-2 mb-8">
              <Section bg="ivory" padY="sm"><p>bg=ivory padY=sm</p></Section>
              <Section bg="cream" padY="sm"><p>bg=cream padY=sm</p></Section>
              <Section bg="sand" padY="sm"><p>bg=sand padY=sm</p></Section>
              <Section bg="charcoal" padY="sm"><p>bg=charcoal padY=sm</p></Section>
              <Section bg="ink" padY="sm"><p>bg=ink padY=sm</p></Section>
            </div>

            <h3 className="mb-3 text-h4 font-bold">Section padY scale</h3>
            <div className="space-y-2 mb-8">
              <Section bg="cream" padY="sm"><p>padY=sm (py-7 = 3rem)</p></Section>
              <Section bg="cream" padY="md"><p>padY=md (py-8 = 4rem)</p></Section>
              <Section bg="cream" padY="lg"><p>padY=lg (py-9 = 6rem)</p></Section>
              <Section bg="cream" padY="xl"><p>padY=xl (py-10 = 8rem)</p></Section>
            </div>

            <h3 className="mb-3 text-h4 font-bold">Container</h3>
            <Container className="border border-dashed border-sand p-4 mb-8">
              <p>Container max-w-[1440px] with px-4 lg:px-6</p>
            </Container>

            <h3 className="mb-3 text-h4 font-bold">SkipLink</h3>
            <p className="text-small text-stone mb-2">Press Tab to focus the SkipLink (rendered just below — invisible until focused).</p>
            <SkipLink />
          </section>

          <section id="button">
            <h2 className="mb-4 text-h2 font-black text-ink">Button</h2>
            <p className="mb-6 text-small text-stone">5 variants × 3 sizes (link variant ignores size).</p>

            <h3 className="mb-3 text-h4 font-bold">Variants — md size</h3>
            <div className="mb-8 flex flex-wrap gap-3">
              <Button variant="primary">primary</Button>
              <Button variant="accent">accent</Button>
              <Button variant="ghost">ghost</Button>
              <Button variant="link">link</Button>
            </div>

            <h3 className="mb-3 text-h4 font-bold">on-dark variant</h3>
            <div className="mb-8 bg-ink p-7 -mx-12">
              <Button variant="on-dark">on-dark</Button>
            </div>

            <h3 className="mb-3 text-h4 font-bold">Sizes</h3>
            <div className="mb-8 flex flex-wrap items-center gap-3">
              <Button variant="primary" size="sm">primary sm</Button>
              <Button variant="primary" size="md">primary md</Button>
              <Button variant="primary" size="lg">primary lg</Button>
            </div>

            <h3 className="mb-3 text-h4 font-bold">As anchor</h3>
            <div className="flex gap-3">
              <Button as="a" href="#" variant="primary">link as button</Button>
              <Button as="a" href="#" variant="ghost">ghost link</Button>
            </div>
          </section>

          <section id="pill">
            <h2 className="mb-4 text-h2 font-black text-ink">Pill</h2>
            <p className="mb-6 text-small text-stone">Filter pills (product index) and category nav (journal). Active state uses bg-charcoal text-ivory + aria-current.</p>

            <h3 className="mb-3 text-h4 font-bold">Filter pill row (mockup A1 Option C)</h3>
            <div className="mb-8 flex flex-wrap items-center gap-2">
              <Pill active>همه</Pill>
              <Pill>تخت خواب</Pill>
              <Pill>میز</Pill>
              <Pill>صندلی</Pill>
              <Pill>کمد</Pill>
              <span aria-hidden className="mx-2 h-6 w-px bg-sand" />
              <Pill>چوب گردو</Pill>
              <Pill>چوب بلوط</Pill>
            </div>

            <h3 className="mb-3 text-h4 font-bold">As anchor (category nav)</h3>
            <div className="flex flex-wrap gap-2">
              <Pill as="a" href="#" active>همه</Pill>
              <Pill as="a" href="#">مواد و متریال</Pill>
              <Pill as="a" href="#">طراحی</Pill>
              <Pill as="a" href="#">مراقبت</Pill>
            </div>
          </section>

          <section id="badge">
            <h2 className="mb-4 text-h2 font-black text-ink">Badge</h2>
            <p className="mb-6 text-small text-stone">Status (glass on image) and meta (cream chip) variants.</p>

            <div className="flex gap-3">
              <Badge variant="status">جدید</Badge>
              <Badge variant="meta">موجود</Badge>
            </div>
          </section>

          <section id="form-atoms">
            <h2 className="mb-4 text-h2 font-black text-ink">Form atoms</h2>
            <p className="mb-6 text-small text-stone">Input, Textarea, Select, FormField. Each input has tone='light' (default) and tone='dark'.</p>

            <h3 className="mb-3 text-h4 font-bold">Light tone (on ivory)</h3>
            <div className="mb-8 max-w-md space-y-3">
              <FormField id="lab-name" label="نام و نام خانوادگی" required>
                <Input id="lab-name" placeholder="مثال: علی محمدی" />
              </FormField>
              <FormField id="lab-phone" label="شماره تلفن" help="مثال: ۰۹۱۲۳۴۵۶۷۸۹">
                <Input id="lab-phone" type="tel" dir="ltr" placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹" />
              </FormField>
              <FormField id="lab-city" label="شهر">
                <Select id="lab-city" defaultValue="">
                  <option value="" disabled>انتخاب کنید</option>
                  <option>تهران</option>
                  <option>اصفهان</option>
                  <option>همدان</option>
                </Select>
              </FormField>
              <FormField id="lab-msg" label="پیام">
                <Textarea id="lab-msg" rows={3} placeholder="درباره‌ی چه محصولی سؤال دارید؟" />
              </FormField>
              <FormField id="lab-err" label="با خطا" error="لطفاً نام خود را وارد کنید.">
                <Input id="lab-err" aria-invalid aria-describedby="lab-err-error" />
              </FormField>
            </div>

            <h3 className="mb-3 text-h4 font-bold">Dark tone (on ink)</h3>
            <div className="mb-8 -mx-12 bg-ink p-12">
              <div className="max-w-md space-y-3">
                <FormField id="lab-d-name" label="نام و نام خانوادگی" tone="dark">
                  <Input id="lab-d-name" tone="dark" placeholder="مثال: علی محمدی" />
                </FormField>
                <FormField id="lab-d-phone" label="شماره تلفن" tone="dark">
                  <Input id="lab-d-phone" tone="dark" type="tel" dir="ltr" placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹" />
                </FormField>
                <FormField id="lab-d-city" label="شهر" tone="dark">
                  <Select id="lab-d-city" tone="dark" defaultValue="">
                    <option value="" disabled>انتخاب کنید</option>
                    <option>تهران</option>
                  </Select>
                </FormField>
                <FormField id="lab-d-msg" label="پیام" tone="dark">
                  <Textarea id="lab-d-msg" tone="dark" rows={3} />
                </FormField>
              </div>
            </div>
          </section>

          <section id="breadcrumbs">
            <h2 className="mb-4 text-h2 font-black text-ink">Breadcrumbs</h2>
            <Breadcrumbs items={[
              { label: 'خانه', href: '/' },
              { label: 'محصولات', href: '/products' },
              { label: 'میز ناهارخوری آرتا' },
            ]} />
          </section>

          <section id="pagination">
            <h2 className="mb-4 text-h2 font-black text-ink">Pagination</h2>

            <h3 className="mb-3 text-h4 font-bold">Page 1 of 3</h3>
            <Pagination currentPage={1} totalPages={3} hrefFor={(p) => `?page=${p}`} />

            <h3 className="mb-3 mt-8 text-h4 font-bold">Page 5 of 12 (gaps)</h3>
            <Pagination currentPage={5} totalPages={12} hrefFor={(p) => `?page=${p}`} />
          </section>

          <section id="utility-primitives">
            <h2 className="mb-4 text-h2 font-black text-ink">Utility primitives</h2>

            <h3 className="mb-3 text-h4 font-bold">Aspect</h3>
            <div className="mb-8 grid grid-cols-3 gap-4">
              {(['1/1','3/2','4/5','3/4','16/9','21/9'] as const).map((r) => (
                <div key={r}>
                  <Aspect ratio={r} className="bg-cream">
                    <div className="flex h-full w-full items-center justify-center text-small text-stone">{r}</div>
                  </Aspect>
                </div>
              ))}
            </div>

            <h3 className="mb-3 text-h4 font-bold">PhoneLink</h3>
            <div className="mb-8 space-y-2">
              <div>Mobile: <PhoneLink raw="09123456789" /></div>
              <div>Landline: <PhoneLink raw="02188671234" /></div>
              <div>Inline (no link): <PhoneLink raw="09123456789" inline /></div>
            </div>

            <h3 className="mb-3 text-h4 font-bold">MoneyDisplay</h3>
            <div className="mb-8 space-y-2">
              <div>۴۵ میلیون: <MoneyDisplay rials={450_000_000} /></div>
              <div>بدون پسوند: <MoneyDisplay rials={12_500_000} withSuffix={false} /></div>
            </div>

            <h3 className="mb-3 text-h4 font-bold">DateDisplay</h3>
            <div className="mb-8 space-y-2">
              <div>Today: <DateDisplay value={new Date()} /></div>
              <div>With weekday: <DateDisplay value={new Date()} withWeekday /></div>
            </div>
          </section>

          <section id="glasscard">
            <h2 className="mb-4 text-h2 font-black text-ink">GlassCard</h2>
            <p className="mb-6 text-small text-stone">Frosted glass surface. tone=&apos;light&apos; (.glass-card) for light bgs, tone=&apos;dark&apos; (.glass-card-dark) for ink bgs.</p>

            <h3 className="mb-3 text-h4 font-bold">Light tone</h3>
            <div className="mb-8 grid grid-cols-3 gap-5">
              <GlassCard href="#">
                <div className="text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow)] text-forest mb-2">تهران</div>
                <h4 className="text-h4 font-bold mb-2">شوروم ونک</h4>
                <p className="text-small text-stone">خیابان ونک، خیابان شهید خدامی</p>
              </GlassCard>
              <GlassCard href="#">
                <div className="text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow)] text-forest mb-2">اصفهان</div>
                <h4 className="text-h4 font-bold mb-2">شوروم چهارباغ</h4>
                <p className="text-small text-stone">خیابان چهارباغ بالا</p>
              </GlassCard>
              <GlassCard>
                <div className="text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow)] text-forest mb-2">non-link</div>
                <h4 className="text-h4 font-bold mb-2">No href</h4>
                <p className="text-small text-stone">Renders as a div, no hover.</p>
              </GlassCard>
            </div>

            <h3 className="mb-3 text-h4 font-bold">Dark tone (on ink)</h3>
            <div className="mb-8 -mx-12 bg-ink p-12">
              <GlassCard tone="dark" className="max-w-md">
                <h4 className="text-h4 font-bold text-ivory mb-3">Dark glass card</h4>
                <p className="text-small text-sand">Used for the contact form card and homepage CTA form. Hover only brightens border, no lift.</p>
              </GlassCard>
            </div>
          </section>

          <section id="tile">
            <h2 className="mb-4 text-h2 font-black text-ink">Tile</h2>
            <p className="mb-6 text-small text-stone">Vertical image+body tile. Covers all 8 vertical tile variants from the mockups.</p>

            <h3 className="mb-3 text-h4 font-bold">Featured product (3/4, h4 title, hover=full, badge)</h3>
            <div className="mb-8 max-w-sm">
              <Tile
                href="#"
                image={<PayloadImage media={null} alt="" fallbackText="تصویر" />}
                aspect="3/4"
                title="میز ناهارخوری آرتا"
                titleSize="h4"
                meta="چوب گردو · دست‌ساز"
                price={450_000_000}
                badge="جدید"
                hover="full"
              />
            </div>

            <h3 className="mb-3 text-h4 font-bold">Standard product (4/5, body title, hover=full)</h3>
            <div className="mb-8 grid grid-cols-3 gap-5">
              <Tile href="#" image={<PayloadImage media={null} alt="" fallbackText="تصویر" />} aspect="4/5" title="صندلی راحتی پارسا" meta="چوب بلوط · مدرن" price={125_000_000} hover="full" />
              <Tile href="#" image={<PayloadImage media={null} alt="" fallbackText="تصویر" />} aspect="4/5" title="تخت خواب دیبا" meta="چوب گردو · کلاسیک" price={680_000_000} hover="full" />
              <Tile href="#" image={<PayloadImage media={null} alt="" fallbackText="تصویر" />} aspect="4/5" title="کمد لباس سارا" meta="چوب گردو · مینیمال" price={350_000_000} hover="full" />
            </div>

            <h3 className="mb-3 text-h4 font-bold">Article tile (3/2, eyebrow, hover=soft)</h3>
            <div className="mb-8 grid grid-cols-3 gap-5">
              <Tile href="#" image={<PayloadImage media={null} alt="" fallbackText="تصویر" />} aspect="3/2" eyebrow="مواد و متریال" title="چرا گردوی ایرانی؟" meta="۷ دقیقه مطالعه" hover="soft" />
              <Tile href="#" image={<PayloadImage media={null} alt="" fallbackText="تصویر" />} aspect="3/2" eyebrow="طراحی" title="مینیمالیسم ایرانی" meta="۵ دقیقه مطالعه" hover="soft" />
              <Tile href="#" image={<PayloadImage media={null} alt="" fallbackText="تصویر" />} aspect="3/2" eyebrow="مراقبت" title="نگهداری مبلمان چوبی" meta="۴ دقیقه مطالعه" hover="soft" />
            </div>

            <h3 className="mb-3 text-h4 font-bold">Featured article (3/4, h3 title, eyebrow)</h3>
            <div className="mb-8 max-w-sm">
              <Tile
                href="#"
                image={<PayloadImage media={null} alt="" fallbackText="تصویر مقاله" />}
                aspect="3/4"
                eyebrow="مواد و متریال"
                title="چرا گردوی ایرانی؟ سفر یک تخته از جنگل تا کارگاه"
                titleSize="h3"
                hover="soft"
              />
            </div>

            <h3 className="mb-3 text-h4 font-bold">Related (1/1, body title, no meta)</h3>
            <div className="mb-8 grid grid-cols-4 gap-5">
              <Tile href="#" image={<PayloadImage media={null} alt="" fallbackText="" />} aspect="1/1" title="صندلی آرتا" price={125_000_000} hover="soft" />
              <Tile href="#" image={<PayloadImage media={null} alt="" fallbackText="" />} aspect="1/1" title="پاتختی نیکا" price={85_000_000} hover="soft" />
              <Tile href="#" image={<PayloadImage media={null} alt="" fallbackText="" />} aspect="1/1" title="میز عسلی آوا" price={110_000_000} hover="soft" />
              <Tile href="#" image={<PayloadImage media={null} alt="" fallbackText="" />} aspect="1/1" title="کمد لباس سارا" price={350_000_000} hover="soft" />
            </div>
          </section>

          <section id="horizontal-tile">
            <h2 className="mb-4 text-h2 font-black text-ink">HorizontalTile</h2>
            <p className="mb-6 text-small text-stone">Horizontal image+body. Covers home journal small-articles (160px) and product index mini-cards (120px).</p>

            <h3 className="mb-3 text-h4 font-bold">120px — product mini-card</h3>
            <div className="mb-8 max-w-md space-y-5">
              <HorizontalTile href="#" image={<PayloadImage media={null} alt="" fallbackText="تصویر" />} imageWidth={120} title="صندلی راحتی پارسا" meta="چوب بلوط · مدرن" price={125_000_000} />
              <HorizontalTile href="#" image={<PayloadImage media={null} alt="" fallbackText="تصویر" />} imageWidth={120} title="تخت خواب دیبا" meta="چوب گردو · کلاسیک" price={680_000_000} />
            </div>

            <h3 className="mb-3 text-h4 font-bold">160px — home journal small article</h3>
            <div className="mb-8 max-w-md space-y-5">
              <HorizontalTile href="#" image={<PayloadImage media={null} alt="" fallbackText="تصویر" />} imageWidth={160} eyebrow="طراحی" title="مینیمالیسم ایرانی: کم‌تر، اما باشکوه‌تر" meta="۷ دقیقه مطالعه" />
              <HorizontalTile href="#" image={<PayloadImage media={null} alt="" fallbackText="تصویر" />} imageWidth={160} eyebrow="مراقبت" title="راهنمای نگهداری از مبلمان چوبی در فصل گرما" meta="۵ دقیقه مطالعه" />
            </div>
          </section>

          <section id="hero-helpers">
            <h2 className="mb-4 text-h2 font-black text-ink">Hero helpers</h2>

            <h3 className="mb-3 text-h4 font-bold">PageHeader</h3>
            <div className="mb-8 -mx-12 border border-dashed border-sand">
              <PageHeader title="محصولات" subtitle="مبلمان دست‌ساز از چوب طبیعی ایرانی" />
            </div>

            <h3 className="mb-3 text-h4 font-bold">StickyBreadcrumb</h3>
            <p className="mb-2 text-small text-stone">(Sticks to top of viewport — scroll the page to see the effect.)</p>
            <div className="mb-8 -mx-12 border border-dashed border-sand">
              <StickyBreadcrumb items={[
                { label: 'خانه', href: '/' },
                { label: 'محصولات', href: '/products' },
                { label: 'میز ناهارخوری آرتا' },
              ]} />
            </div>

            <h3 className="mb-3 text-h4 font-bold">HeroOverlayText (inside a relative container)</h3>
            <div className="mb-8 -mx-12 relative h-[280px] bg-cream">
              <HeroOverlayText>
                <div className="mb-3 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow-wide)] text-forest">مواد و متریال</div>
                <h1 className="text-h1 font-black text-ink">چرا گردوی ایرانی؟</h1>
              </HeroOverlayText>
            </div>
          </section>

          <section id="home-hero">
            <h2 className="mb-4 text-h2 font-black text-ink">HomeHero</h2>
            <p className="mb-6 text-small text-stone">Split-screen hero used on /. Mockup: <a href="http://80.240.31.146:9090/.superpowers/homepage-c-full.html" className="underline" target="_blank" rel="noreferrer">homepage-c-full.html</a> HERO section.</p>

            <h3 className="mb-3 text-h4 font-bold">Default (no image — shows gradient + ژ watermark)</h3>
            <div className="mb-12 -mx-12 border-y border-dashed border-sand">
              <HomeHero />
            </div>

            <h3 className="mb-3 text-h4 font-bold">With image override</h3>
            <div className="mb-12 -mx-12 border-y border-dashed border-sand">
              <HomeHero image={
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone to-charcoal">
                  <span className="text-ivory/80">(imagine: hero product photo)</span>
                </div>
              } />
            </div>
          </section>

          <section id="cinematic-hero">
            <h2 className="mb-4 text-h2 font-black text-ink">CinematicHero</h2>
            <p className="mb-6 text-small text-stone">PDP cover image at 21:9 (4:5 mobile) with a bottom gradient fade to ivory. Mockup: <a href="http://80.240.31.146:9090/.superpowers/a2-pdp.html" className="underline" target="_blank" rel="noreferrer">a2-pdp.html</a> Option C <code>.c-hero-img</code>.</p>

            <h3 className="mb-3 text-h4 font-bold">Default (no image — cream placeholder)</h3>
            <div className="mb-8 -mx-12 border-y border-dashed border-sand">
              <CinematicHero />
            </div>

            <h3 className="mb-3 text-h4 font-bold">With image override</h3>
            <div className="mb-8 -mx-12 border-y border-dashed border-sand">
              <CinematicHero image={
                <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone to-charcoal">
                  <span className="text-ivory/80">(imagine: cinematic product photo)</span>
                </div>
              } />
            </div>
          </section>

          <section id="article-hero">
            <h2 className="mb-4 text-h2 font-black text-ink">ArticleHero</h2>
            <p className="mb-6 text-small text-stone">Article full-bleed cover with overlay text. Mockup: <a href="http://80.240.31.146:9090/.superpowers/a4-article.html" className="underline" target="_blank" rel="noreferrer">a4-article.html</a> Option B <code>.b-hero</code>.</p>

            <div className="mb-8 -mx-12 border-y border-dashed border-sand">
              <ArticleHero
                category="مواد و متریال"
                title="چرا گردوی ایرانی؟"
                authorName="احمد تهرانی"
                publishedAt="2026-04-15"
                readingTimeMinutes={7}
              />
            </div>
          </section>

          <section id="collection-hero">
            <h2 className="mb-4 text-h2 font-black text-ink">CollectionHero</h2>
            <p className="mb-6 text-small text-stone">Full-bleed collection cover with forest eyebrow + h1 overlaid at bottom. Mockup: <a href="http://80.240.31.146:9090/.superpowers/b-template-pages.html" className="underline" target="_blank" rel="noreferrer">b-template-pages.html</a> B2 <code>.hero-bleed</code>.</p>

            <h3 className="mb-3 text-h4 font-bold">Default eyebrow &quot;مجموعه&quot;</h3>
            <div className="mb-8 -mx-12 border-y border-dashed border-sand">
              <CollectionHero title="مجموعه‌ی آرامش" />
            </div>

            <h3 className="mb-3 text-h4 font-bold">Custom eyebrow</h3>
            <div className="mb-8 -mx-12 border-y border-dashed border-sand">
              <CollectionHero title="مجموعه‌ی بهار ۱۴۰۵" eyebrow="کلکسیون فصلی" />
            </div>
          </section>

          <section id="editorial-hero">
            <h2 className="mb-4 text-h2 font-black text-ink">EditorialHero</h2>
            <p className="mb-6 text-small text-stone">About / Atelier / Care. Mockup: <a href="http://80.240.31.146:9090/.superpowers/b-template-pages.html" className="underline" target="_blank" rel="noreferrer">b-template-pages.html</a> B4 / B5 / B8 <code>.hero-bleed</code>.</p>

            <h3 className="mb-3 text-h4 font-bold">About (height=lg — 45vh)</h3>
            <div className="mb-8 -mx-12 border-y border-dashed border-sand">
              <EditorialHero eyebrow="درباره‌ی ژیک" title="از همدان، برای ایران" height="lg" placeholder="تصویر تیم ژیک در کارگاه" />
            </div>

            <h3 className="mb-3 text-h4 font-bold">Atelier (height=xl — 50vh)</h3>
            <div className="mb-8 -mx-12 border-y border-dashed border-sand">
              <EditorialHero eyebrow="کارگاه ژیک" title="جایی که چوب نفس می‌کشد" height="xl" placeholder="تصویر داخل کارگاه — ماشین‌آلات و چوب" />
            </div>

            <h3 className="mb-3 text-h4 font-bold">Care (height=sm — 35vh)</h3>
            <div className="mb-8 -mx-12 border-y border-dashed border-sand">
              <EditorialHero eyebrow="راهنما" title="مراقبت و گارانتی" height="sm" placeholder="تصویر نزدیک از بافت چوب گردو" />
            </div>
          </section>

          <section id="glass-overlay-hero">
            <h2 className="mb-4 text-h2 font-black text-ink">GlassOverlayHero</h2>
            <p className="mb-6 text-small text-stone">Showroom detail hero: full-bleed photo + dark scrim + centered frosted glass card. Mockup: <a href="http://80.240.31.146:9090/.superpowers/a5-showroom.html" className="underline" target="_blank" rel="noreferrer">a5-showroom.html</a> Option B <code>.b-hero</code>.</p>

            <h3 className="mb-3 text-h4 font-bold">Default (cream placeholder — no photo)</h3>
            <div className="mb-8 -mx-12 border-y border-dashed border-sand">
              <GlassOverlayHero
                city="تهران"
                title="شوروم ونک"
                headline="فضایی آرام برای دیدن و لمس مبلمان ژیک از نزدیک."
              />
            </div>

            <h3 className="mb-3 text-h4 font-bold">With photo override</h3>
            <div className="mb-8 -mx-12 border-y border-dashed border-sand">
              <GlassOverlayHero
                city="همدان"
                title="کارگاه و شوروم مرکزی"
                headline="جایی که هر قطعه ساخته می‌شود."
                image={
                  <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-stone to-charcoal">
                    <span className="text-ivory/80">(imagine: photo of workshop)</span>
                  </div>
                }
              />
            </div>
          </section>

          <section id="inquiry-form">
            <h2 className="mb-4 text-h2 font-black text-ink">InquiryForm (full 5-field)</h2>
            <p className="mb-6 text-small text-stone">
              Dark glass card + useActionState wrapping <code>submitInquiry</code>. Includes conditional
              <code>preferred_date</code> field when reason = &quot;رزرو بازدید از شوروم&quot;. Mockup:{' '}
              <a href="http://80.240.31.146:9090/.superpowers/a6-contact.html" className="underline" target="_blank" rel="noreferrer">
                a6-contact.html
              </a>{' '}Option B (<code>.b-form-card</code>).
            </p>
            <div className="mx-auto max-w-xl rounded-lg bg-charcoal p-8">
              <InquiryForm
                cities={['تهران', 'اصفهان', 'همدان', 'مشهد', 'شیراز', 'تبریز', 'سایر شهرها']}
              />
            </div>
          </section>

          <section id="inquiry-form-slim">
            <h2 className="mb-4 text-h2 font-black text-ink">InquiryFormSlim (3-field)</h2>
            <p className="mb-6 text-small text-stone">
              Name + phone + short message. City defaults to &quot;سایر شهرها&quot; and reason defaults to <code>price_inquiry</code>
              via hidden inputs, so the same <code>submitInquiry</code> action works unchanged. Used on the homepage CTA
              (DarkSplitHero variant=&quot;section&quot;). Mockup:{' '}
              <a href="http://80.240.31.146:9090/.superpowers/homepage-c-full.html" className="underline" target="_blank" rel="noreferrer">
                homepage-c-full.html
              </a>{' '}CTA section.
            </p>
            <div className="mx-auto max-w-xl rounded-lg bg-charcoal p-8">
              <InquiryFormSlim />
            </div>
          </section>

          <section id="home-sections">
            <h2 className="mb-4 text-h2 font-black text-ink">Home page sections</h2>
            <p className="mb-6 text-small text-stone">
              Each home-page section, rendered with empty data (fallback placeholders). Mockup:{' '}
              <a href="http://80.240.31.146:9090/.superpowers/homepage-c-full.html" className="underline" target="_blank" rel="noreferrer">
                homepage-c-full.html
              </a>.
            </p>

            <h3 className="mb-3 mt-8 text-h4 font-bold">HomeBrandStatement</h3>
            <div className="mb-12 -mx-12 border-y border-dashed border-sand">
              <HomeBrandStatement />
            </div>

            <h3 className="mb-3 mt-8 text-h4 font-bold">HomeFeaturedDesigns</h3>
            <div className="mb-12 -mx-12 border-y border-dashed border-sand">
              <HomeFeaturedDesigns designs={[]} />
            </div>

            <h3 className="mb-3 mt-8 text-h4 font-bold">HomeShowroomsStrip</h3>
            <div className="mb-12 -mx-12 border-y border-dashed border-sand">
              <HomeShowroomsStrip showrooms={[]} />
            </div>

            <h3 className="mb-3 mt-8 text-h4 font-bold">HomeJournalTeaser</h3>
            <div className="mb-12 -mx-12 border-y border-dashed border-sand">
              <HomeJournalTeaser articles={[]} />
            </div>

            <h3 className="mb-3 mt-8 text-h4 font-bold">HomeInquiryCta</h3>
            <div className="mb-12 -mx-12 border-y border-dashed border-sand">
              <HomeInquiryCta />
            </div>
          </section>

          <section id="product-components">
            <h2 className="mb-4 text-h2 font-black text-ink">Product components</h2>
            <p className="mb-6 text-small text-stone">
              Seven product-page components for the /products index and PDP. Mockups:{' '}
              <a href="http://80.240.31.146:9090/.superpowers/a1-product-index.html" className="underline" target="_blank" rel="noreferrer">a1-product-index.html</a>
              {' '}and{' '}
              <a href="http://80.240.31.146:9090/.superpowers/a2-pdp.html" className="underline" target="_blank" rel="noreferrer">a2-pdp.html</a>
              {' '}(Option C in both).
            </p>

            <h3 className="mb-3 mt-8 text-h4 font-bold">ProductIndexHero</h3>
            <div className="mb-12 -mx-12 border-y border-dashed border-sand px-12 py-8">
              <ProductIndexHero products={FAKE_PRODUCTS} />
            </div>

            <h3 className="mb-3 mt-8 text-h4 font-bold">ProductFilterPills</h3>
            <div className="mb-8">
              <ProductFilterPills
                activeCategory={null}
                activeMaterial={null}
                categories={FAKE_CATEGORIES}
                materials={FAKE_MATERIALS}
                categoryHref={(s) => s ? `/products?cat=${s}` : '/products'}
                materialHref={(s) => s ? `/products?mat=${s}` : '/products'}
              />
              <p className="mt-2 text-eyebrow text-stone">↑ No active filter (همه selected)</p>
            </div>
            <div className="mb-8">
              <ProductFilterPills
                activeCategory="tables"
                activeMaterial={null}
                categories={FAKE_CATEGORIES}
                materials={FAKE_MATERIALS}
                categoryHref={(s) => s ? `/products?cat=${s}` : '/products'}
                materialHref={(s) => s ? `/products?mat=${s}` : '/products'}
              />
              <p className="mt-2 text-eyebrow text-stone">↑ cat=tables active</p>
            </div>

            <h3 className="mb-3 mt-8 text-h4 font-bold">ProductIndexToolbar</h3>
            <div className="mb-8">
              <ProductIndexToolbar
                totalCount={8}
                currentSort="newest"
                sortHrefs={{
                  newest: '/products?sort=newest',
                  name: '/products?sort=name',
                  price_asc: '/products?sort=price_asc',
                  price_desc: '/products?sort=price_desc',
                }}
              />
            </div>

            <h3 className="mb-3 mt-8 text-h4 font-bold">ProductGrid</h3>
            <div className="mb-12">
              <ProductGrid products={FAKE_PRODUCTS} />
            </div>
            <div className="mb-8">
              <p className="mb-3 text-small text-stone">Empty state:</p>
              <ProductGrid products={[]} />
            </div>

            <h3 className="mb-3 mt-8 text-h4 font-bold">ProductSidebar</h3>
            <div className="mb-12 flex justify-end">
              <ProductSidebar product={FAKE_PRODUCTS[0]!} />
            </div>

            <h3 className="mb-3 mt-8 text-h4 font-bold">ProductThumbnails</h3>
            <div className="mb-8">
              <p className="mb-3 text-small text-stone">Empty images (renders nothing):</p>
              <ProductThumbnails images={[]} />
              <p className="text-eyebrow text-stone">(nothing rendered — correct)</p>
            </div>

            <h3 className="mb-3 mt-8 text-h4 font-bold">SpecsAccordion</h3>
            <div className="mb-12 max-w-xl">
              <h2 className="mb-5 text-h4 font-bold text-charcoal">مشخصات</h2>
              <SpecsAccordion
                specs={[
                  { label: 'ابعاد', content: 'طول: ۱۸۰ سانتی‌متر · عرض: ۹۰ سانتی‌متر · ارتفاع: ۷۵ سانتی‌متر' },
                  { label: 'متریال', content: 'چوب گردوی جنگل‌های شمال · روغن طبیعی دانمارکی' },
                  { label: 'مشخصات فنی', content: 'اتصالات فاق و زبانه بدون پیچ. پرداخت نهایی با روغن طبیعی.' },
                ]}
                initialOpenIndex={0}
              />
            </div>
          </section>

          <section id="journal-components">
            <h2 className="mb-4 text-h2 font-black text-ink">Journal components</h2>
            <p className="mb-6 text-small text-stone">
              Four journal/article components. Mockups:{' '}
              <a href="http://80.240.31.146:9090/.superpowers/a3-journal-index.html" className="underline" target="_blank" rel="noreferrer">a3-journal-index.html</a>
              {' '}and{' '}
              <a href="http://80.240.31.146:9090/.superpowers/a4-article.html" className="underline" target="_blank" rel="noreferrer">a4-article.html</a>
              {' '}(Option B in both).
            </p>

            <h3 className="mb-3 mt-8 text-h4 font-bold">JournalFeaturedArticle</h3>
            <div className="mb-12 border border-dashed border-sand p-4">
              <JournalFeaturedArticle article={FAKE_ARTICLE} />
            </div>

            <h3 className="mb-3 mt-8 text-h4 font-bold">JournalGrid (6 articles)</h3>
            <div className="mb-12">
              <JournalGrid articles={FAKE_ARTICLES} />
            </div>

            <h3 className="mb-3 mt-8 text-h4 font-bold">JournalGrid — empty state</h3>
            <div className="mb-12 border border-dashed border-sand">
              <JournalGrid articles={[]} />
            </div>

            <h3 className="mb-3 mt-8 text-h4 font-bold">AuthorCard</h3>
            <div className="mb-12 max-w-xl">
              <AuthorCard author={FAKE_AUTHOR} />
            </div>

            <h3 className="mb-3 mt-8 text-h4 font-bold">ArticleProse</h3>
            <div className="mb-12 border border-dashed border-sand p-6">
              <ArticleProse value={FAKE_BODY} />
            </div>
          </section>

          <section id="site-chrome">
            <h2 className="mb-4 text-h2 font-black text-ink">Site chrome</h2>
            <p className="mb-6 text-small text-stone">SiteHeader + MobileMenu. Because SiteHeader is fixed-positioned, it can&apos;t be demoed inside this lab page (which already has its own sticky header). See the dedicated demo route:</p>
            <p className="text-small"><a href="/lab/site-header" className="underline underline-offset-4 hover:decoration-2">→ /lab/site-header (scroll to trigger blur)</a></p>
          </section>

          <section id="site-footer">
            <h2 className="mb-4 text-h2 font-black text-ink">SiteFooter</h2>
            <p className="mb-6 text-small text-stone">4-col link grid on charcoal, collapses to 2-col then 1-col responsive. Bottom row with copyright + privacy/terms. Mockup: <a href="http://80.240.31.146:9090/.superpowers/homepage-c-full.html" className="underline" target="_blank" rel="noreferrer">homepage-c-full.html</a> footer.</p>

            <div className="-mx-12 border-t border-dashed border-sand">
              <SiteFooter />
            </div>
          </section>

          <section id="dark-split-hero">
            <h2 className="mb-4 text-h2 font-black text-ink">DarkSplitHero</h2>
            <p className="mb-6 text-small text-stone">Contact page + Home CTA. Mockups: <a href="http://80.240.31.146:9090/.superpowers/a6-contact.html" className="underline" target="_blank" rel="noreferrer">a6-contact.html</a> Option B <code>.b-hero</code> (page variant) and <a href="http://80.240.31.146:9090/.superpowers/homepage-c-full.html" className="underline" target="_blank" rel="noreferrer">homepage-c-full.html</a> CTA section (section variant).</p>

            <h3 className="mb-3 text-h4 font-bold">variant=&quot;page&quot; (Contact /contact — padY=xl)</h3>
            <div className="mb-12 -mx-12 border-y border-dashed border-sand">
              <DarkSplitHero
                variant="page"
                title="با ما در تماس باشید"
                lead="برای استعلام قیمت، رزرو بازدید از شوروم، یا مشاوره‌ی پیش از خرید. تیم ما آماده‌ی پاسخ‌گویی است."
                contact={{ phone: '۰۸۱-۳۴۲۵ ۶۷۸۹', email: 'info@zhicwood.com' }}
                hours={{ text: 'شنبه تا پنجشنبه · ۰۹:۰۰ – ۱۷:۰۰' }}
              >
                <InquiryForm
                  cities={['تهران', 'اصفهان', 'همدان', 'مشهد', 'شیراز', 'تبریز', 'سایر شهرها']}
                />
              </DarkSplitHero>
            </div>

            <h3 className="mb-3 text-h4 font-bold">variant=&quot;section&quot; (HomeInquiryCta — padY=lg)</h3>
            <div className="mb-12 -mx-12 border-y border-dashed border-sand">
              <DarkSplitHero
                variant="section"
                title="با ما صحبت کنید"
                lead="تیم ما در ساعات کاری پاسخ‌گوی شماست."
                contact={{ phone: '۰۸۱-۳۴۲۵ ۶۷۸۹' }}
              >
                <InquiryFormSlim />
              </DarkSplitHero>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
