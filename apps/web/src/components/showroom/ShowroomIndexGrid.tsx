import { toPersianDigits } from '@zhic/locale';
import { Container } from '@zhic/ui';
import { GlassCard } from '@/components/shared/GlassCard';
import type { PayloadShowroom, ShowroomHourEntry } from '@/lib/payload';
import { showroomPath } from '@/lib/payload';
import { ShowroomAddressBlock } from './ShowroomAddressBlock';

export type ShowroomIndexGridProps = {
  showrooms: PayloadShowroom[];
  heading?: string;
  subtitle?: string;
};

function summarizeHours(
  hours: ShowroomHourEntry[] | null | undefined,
  appointmentOnly: boolean | null | undefined,
): string {
  if (appointmentOnly) return 'فقط با وقت قبلی';
  if (!hours || hours.length === 0) return 'برای ساعات کاری تماس بگیرید';
  const open = hours.find((h) => !h.closed && h.opens && h.closes);
  if (!open) return 'برای ساعات کاری تماس بگیرید';
  return `${toPersianDigits(open.opens!)} – ${toPersianDigits(open.closes!)}`;
}

export function ShowroomIndexGrid({
  showrooms,
  heading = 'شوروم‌ها',
  subtitle = 'از نزدیک ببینید، لمس کنید، و با تیم ما صحبت کنید. در هر شوروم تجربه‌ای متفاوت منتظر شماست.',
}: ShowroomIndexGridProps) {
  return (
    <section>
      <Container>
        <div className="mb-7">
          <h1 className="text-h1 font-black text-ink mb-3">{heading}</h1>
          {subtitle && (
            <p className="text-lead font-light text-stone max-w-[520px]">{subtitle}</p>
          )}
        </div>

        {showrooms.length === 0 ? (
          <p className="text-stone">شوروم فعالی پیدا نشد.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-[var(--space-5)] pb-[var(--space-9)]">
            {showrooms.map((s) => {
              const city = s.address?.city ?? 'ایران';
              return (
                <GlassCard key={String(s.id)} href={showroomPath(s.slug)}>
                  <div className="mb-3 text-eyebrow font-bold uppercase tracking-[0.08em] text-forest">
                    {city}
                  </div>
                  <h3 className="mb-3 text-h4 font-bold text-charcoal">{s.name}</h3>
                  <ShowroomAddressBlock address={s.address} compact />
                  <div className="mt-4 border-t border-sand pt-3 text-eyebrow text-stone">
                    {summarizeHours(s.hours, s.appointmentOnly)}
                  </div>
                </GlassCard>
              );
            })}
          </div>
        )}
      </Container>
    </section>
  );
}
