import { Button, Container, Section, SkipLink } from '@zhic/ui';

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
        </div>
      </div>
    </main>
  );
}
