import { Aspect, Badge, Breadcrumbs, Button, Container, DateDisplay, FormField, Input, MoneyDisplay, Pagination, PhoneLink, Pill, Section, Select, SkipLink, Textarea } from '@zhic/ui';
import { GlassCard } from '@/components/shared/GlassCard';
import { Tile } from '@/components/tile/Tile';
import { PayloadImage } from '@/components/PayloadImage';

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
        </div>
      </div>
    </main>
  );
}
