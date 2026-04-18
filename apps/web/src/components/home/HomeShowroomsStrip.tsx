import { Container, Grid, PhoneLink, Section, ShowroomCard, Stack } from '@zhic/ui';
import type { PayloadShowroom } from '@/lib/payload';
import { mediaUrl } from '@/lib/payload';
import { BlockReveal } from '@/components/motion/BlockReveal';

export type HomeShowroomsStripProps = {
  showrooms: PayloadShowroom[];
};

function ShowroomCover({ showroom }: { showroom: PayloadShowroom }) {
  const src = mediaUrl(showroom.cover ?? showroom.gallery?.[0] ?? null);
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-cream text-small text-stone">
        {showroom.address?.city ?? 'شوروم'}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={showroom.cover?.alt ?? showroom.gallery?.[0]?.alt ?? showroom.name}
      className="h-full w-full object-cover"
    />
  );
}

function addressLineOf(showroom: PayloadShowroom): string | undefined {
  const a = showroom.address;
  if (!a) return undefined;
  const parts = [a.district, a.street].filter(Boolean);
  return parts.length > 0 ? parts.join(' — ') : undefined;
}

function hoursSummaryOf(showroom: PayloadShowroom): string | undefined {
  const open = (showroom.hours ?? []).filter((h) => !h.closed && h.opens && h.closes);
  const first = open[0];
  if (!first) return undefined;
  return `${first.opens} – ${first.closes}`;
}

export function HomeShowroomsStrip({ showrooms }: HomeShowroomsStripProps) {
  if (showrooms.length === 0) return null;
  const count = showrooms.length;
  const columns = count >= 3 ? 3 : 2;
  return (
    <Section bg="cream" padY="lg">
      <Container>
        <Stack gap="lg">
          <BlockReveal>
            <Stack gap="xs">
              <h2 className="text-h2 font-bold text-charcoal">شوروم‌ها</h2>
              <p className="text-lead text-stone">
                از نزدیک ببینید، لمس کنید، و با تیم ما صحبت کنید.
              </p>
            </Stack>
          </BlockReveal>
          <Grid columns={columns} gap="md">
            {showrooms.map((showroom) => (
              <ShowroomCard
                key={showroom.id}
                href={`/showrooms/${showroom.slug}`}
                name={showroom.name}
                city={showroom.address?.city ?? undefined}
                addressLine={addressLineOf(showroom)}
                hoursSummary={hoursSummaryOf(showroom)}
                phone={
                  showroom.phone
                    ? {
                        // PhoneLink renders inline (span) inside the linked card body
                        label: <PhoneLink raw={showroom.phone} inline />,
                        // ShowroomCard's inner phone is rendered as text under href; e164
                        // is unused in the linked variant but satisfies the prop shape.
                        e164: showroom.phone,
                      }
                    : undefined
                }
                cover={<ShowroomCover showroom={showroom} />}
              />
            ))}
          </Grid>
        </Stack>
      </Container>
    </Section>
  );
}
