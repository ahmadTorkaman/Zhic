import { Container } from '@zhic/ui';
import { GlassCard } from '@/components/shared/GlassCard';
import type { PayloadShowroom } from '@/lib/payload';
import { showroomPath } from '@/lib/payload';

type ShowroomItem = {
  city: string;
  name: string;
  address: string;
  hours: string;
  href: string | null;
};

const PLACEHOLDER_SHOWROOMS: ShowroomItem[] = [
  {
    city: 'تهران',
    name: 'شوروم ونک',
    address: 'خیابان ونک، خیابان شهید خدامی\nپلاک ۴۲، طبقه‌ی همکف',
    hours: 'شنبه تا پنجشنبه · ۱۰:۰۰ – ۲۰:۰۰',
    href: null,
  },
  {
    city: 'اصفهان',
    name: 'شوروم چهارباغ',
    address: 'خیابان چهارباغ بالا\nنبش کوچه‌ی گلزار، پلاک ۱۸',
    hours: 'شنبه تا پنجشنبه · ۰۹:۰۰ – ۱۸:۰۰',
    href: null,
  },
  {
    city: 'همدان',
    name: 'کارگاه و شوروم مرکزی',
    address: 'بلوار استاد شهریار\nجنب پارک مردم، پلاک ۷',
    hours: 'هر روز · ۰۸:۰۰ – ۱۷:۰۰',
    href: null,
  },
];

function buildAddress(s: PayloadShowroom): string {
  const parts: string[] = [];
  if (s.address?.street) parts.push(s.address.street);
  const line2: string[] = [];
  if (s.address?.plaque) line2.push(`پلاک ${s.address.plaque}`);
  if (s.address?.unit) line2.push(`واحد ${s.address.unit}`);
  if (line2.length) parts.push(line2.join('، '));
  return parts.join('\n');
}

function buildHours(s: PayloadShowroom): string {
  if (!s.hours?.length) return 'تماس بگیرید برای ساعات کاری';
  const first = s.hours.find((h) => !h.closed);
  if (!first) return 'تماس بگیرید برای ساعات کاری';
  const open = first.opens ?? '';
  const close = first.closes ?? '';
  if (open && close) return `${open} – ${close}`;
  return 'تماس بگیرید برای ساعات کاری';
}

export type HomeShowroomsStripProps = {
  showrooms: PayloadShowroom[];
  heading?: string;
  subtitle?: string;
};

export function HomeShowroomsStrip({
  showrooms,
  heading = 'شوروم‌ها',
  subtitle = 'از نزدیک ببینید، لمس کنید، و با تیم ما صحبت کنید.',
}: HomeShowroomsStripProps) {
  const items: ShowroomItem[] = showrooms.length > 0
    ? showrooms.slice(0, 3).map((s) => ({
        city: s.address?.city ?? '',
        name: s.name,
        address: buildAddress(s),
        hours: buildHours(s),
        href: showroomPath(s.slug),
      }))
    : PLACEHOLDER_SHOWROOMS;

  return (
    <section className="bg-cream py-[var(--space-11)]">
      <Container>
        <div className="mb-8">
          <h2 className="mb-2 text-h2 font-black text-ink">{heading}</h2>
          <p className="text-body font-light text-stone">{subtitle}</p>
        </div>

        <div className="grid grid-cols-1 gap-[var(--space-5)] md:grid-cols-3">
          {items.map((item, i) => (
            <GlassCard key={i} href={item.href ?? undefined}>
              <div className="mb-2 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow)] text-forest">
                {item.city}
              </div>
              <h3 className="mb-3 text-h4 font-bold text-charcoal">{item.name}</h3>
              <div className="mb-3 whitespace-pre-line text-small font-light leading-[1.7] text-stone">
                {item.address}
              </div>
              <div className="text-small font-light text-stone">{item.hours}</div>
            </GlassCard>
          ))}
        </div>
      </Container>
    </section>
  );
}
