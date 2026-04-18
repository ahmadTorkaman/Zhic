import { Container, Section, Stack } from '@zhic/ui';
import type { PayloadShowroom, ShowroomHourEntry } from '@/lib/payload';
import { BlockReveal } from '@/components/motion/BlockReveal';
import { toPersianDigits } from '@zhic/locale';

export type HomeShowroomsStripProps = {
  showrooms: PayloadShowroom[];
};

function addressLines(showroom: PayloadShowroom): string[] {
  const a = showroom.address;
  if (!a) return [];
  const line1 = [a.district, a.street].filter(Boolean).join('، ');
  const line2 = [a.plaque ? `پلاک ${a.plaque}` : null, a.unit ? `واحد ${a.unit}` : null]
    .filter(Boolean)
    .join('، ');
  return [line1, line2].filter((s): s is string => Boolean(s));
}

const DAY_FA: Record<string, string> = {
  sat: 'شنبه',
  sun: 'یکشنبه',
  mon: 'دوشنبه',
  tue: 'سه‌شنبه',
  wed: 'چهارشنبه',
  thu: 'پنج‌شنبه',
  fri: 'جمعه',
};

function hoursSummary(hours: ShowroomHourEntry[] | null | undefined): string | null {
  const open = (hours ?? []).filter((h) => !h.closed && h.opens && h.closes);
  if (open.length === 0) return null;
  const first = open[0]!;
  const last = open[open.length - 1]!;
  const dayRange =
    open.length === 1
      ? DAY_FA[first.day] ?? first.day
      : `${DAY_FA[first.day] ?? first.day} تا ${DAY_FA[last.day] ?? last.day}`;
  const time = toPersianDigits(`${first.opens} – ${first.closes}`);
  return `${dayRange} · ${time}`;
}

export function HomeShowroomsStrip({ showrooms }: HomeShowroomsStripProps) {
  if (showrooms.length === 0) return null;
  const display = showrooms.slice(0, 3);

  return (
    <Section bg="cream" padY="xl" fullBleed>
      <Container>
        <Stack gap="lg">
          <BlockReveal>
            <Stack gap="xs">
              <h2 className="text-h2 font-black text-ink">شوروم‌ها</h2>
              <p className="text-lead font-light text-stone">
                از نزدیک ببینید، لمس کنید، و با تیم ما صحبت کنید.
              </p>
            </Stack>
          </BlockReveal>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:gap-5">
            {display.map((showroom, idx) => {
              const lines = addressLines(showroom);
              const hours = hoursSummary(showroom.hours);
              return (
                <BlockReveal key={showroom.id} delay={idx * 0.08}>
                  <a
                    href={`/showrooms/${showroom.slug}`}
                    className="glass-card block rounded-md p-5 md:p-7"
                  >
                    {showroom.address?.city ? (
                      <div className="mb-4 text-eyebrow font-bold uppercase tracking-[0.08em] text-forest">
                        {showroom.address.city}
                      </div>
                    ) : null}
                    <h3 className="mb-3 text-h4 font-bold text-charcoal">
                      {showroom.name}
                    </h3>
                    {lines.length > 0 ? (
                      <div className="mb-4 text-small font-light leading-[1.7] text-stone">
                        {lines.map((line, i) => (
                          <div key={i}>{line}</div>
                        ))}
                      </div>
                    ) : null}
                    {hours ? (
                      <div className="border-t border-sand pt-4 text-small font-light text-stone">
                        {hours}
                      </div>
                    ) : null}
                  </a>
                </BlockReveal>
              );
            })}
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
