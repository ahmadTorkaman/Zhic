import { Button, Container } from '@zhic/ui';
import { GlassCard } from '@/components/shared/GlassCard';
import type { PayloadShowroom } from '@/lib/payload';
import { ShowroomAddressBlock } from './ShowroomAddressBlock';
import { ShowroomHoursTable } from './ShowroomHoursTable';
import { ShowroomMapEmbed } from './ShowroomMapEmbed';

export type ShowroomInfoCardsProps = { showroom: PayloadShowroom };

export function ShowroomInfoCards({ showroom }: ShowroomInfoCardsProps) {
  const hasMap =
    !!showroom.mapEmbedUrl ||
    (showroom.geo?.lat != null && showroom.geo?.lng != null);

  const mapHref =
    showroom.neshanProfileUrl ??
    showroom.googleBusinessProfileUrl ??
    (showroom.geo?.lat != null && showroom.geo?.lng != null
      ? `https://www.google.com/maps?q=${showroom.geo.lat},${showroom.geo.lng}`
      : null);

  return (
    <Container>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-5)] pb-[var(--space-9)]">
        {/* Card 1 — Address */}
        <GlassCard>
          <h3 className="text-h4 font-bold text-charcoal mb-3">آدرس</h3>
          <ShowroomAddressBlock address={showroom.address} />
          {hasMap && (
            <div className="mt-4">
              <ShowroomMapEmbed showroom={showroom} aspect="4/3" />
            </div>
          )}
        </GlassCard>

        {/* Card 2 — Hours */}
        <GlassCard>
          <h3 className="text-h4 font-bold text-charcoal mb-3">ساعات کاری</h3>
          <ShowroomHoursTable
            hours={showroom.hours ?? []}
            appointmentOnly={showroom.appointmentOnly ?? undefined}
          />
        </GlassCard>

        {/* Card 3 — Contact */}
        <GlassCard>
          <h3 className="text-h4 font-bold text-charcoal mb-3">تماس</h3>
          {showroom.phone && (
            <div dir="ltr" className="text-h4 font-bold text-charcoal">
              {showroom.phone}
            </div>
          )}
          {showroom.email && (
            <div dir="ltr" className="text-small font-light text-stone">
              {showroom.email}
            </div>
          )}
          <div className="mt-5 flex flex-col gap-3">
            {showroom.phone && (
              <Button as="a" href={`tel:${showroom.phone}`} variant="primary" size="md">
                تماس
              </Button>
            )}
            {mapHref && (
              <Button
                as="a"
                href={mapHref}
                variant="ghost"
                size="md"
                target="_blank"
                rel="noopener noreferrer"
              >
                مسیریابی
              </Button>
            )}
          </div>
        </GlassCard>
      </div>
    </Container>
  );
}
