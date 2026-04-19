import { Badge, Button, Container, FormField, Input, Pill, Section, Select, SkipLink, Textarea } from '@zhic/ui';

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
        </div>
      </div>
    </main>
  );
}
