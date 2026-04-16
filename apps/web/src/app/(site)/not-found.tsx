import { Container, Grid, Section, Stack } from '@zhic/ui';

const TILES = [
  { href: '/', label: 'بازگشت به خانه' },
  { href: '/showrooms', label: 'شوروم‌ها' },
  { href: '/journal', label: 'ژورنال' },
];

function Tile({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="group block rounded-lg border border-sand bg-ivory p-6 text-center transition-colors hover:border-charcoal hover:bg-cream focus-visible:outline-none"
    >
      <span className="text-body font-bold text-charcoal">{label}</span>
      <span
        aria-hidden
        className="ms-2 inline-block transition-transform group-hover:-translate-x-1 rtl:group-hover:translate-x-1"
      >
        ←
      </span>
    </a>
  );
}

export default function NotFound() {
  return (
    <Section padY="xl">
      <Container>
        <Stack gap="lg" align="center">
          <p className="text-small text-stone uppercase tracking-wide">
            ۴۰۴
          </p>
          <h1 className="text-display font-bold text-charcoal text-balance text-center">
            صفحه‌ای که دنبالش بودید پیدا نشد
          </h1>
          <p className="text-lead text-stone text-center max-w-prose">
            ممکن است نشانی را اشتباه وارد کرده باشید یا این صفحه جابه‌جا شده باشد.
          </p>
          <div className="w-full max-w-2xl">
            <Grid columns={3} gap="md">
              {TILES.map((t) => (
                <Tile key={t.href} href={t.href} label={t.label} />
              ))}
            </Grid>
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
