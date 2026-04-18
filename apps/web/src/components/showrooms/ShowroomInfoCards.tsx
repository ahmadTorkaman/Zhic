import type { PayloadShowroom } from '@/lib/payload';
import { classifyPhone } from '@zhic/locale';
import { ShowroomHoursTable } from './ShowroomHoursTable';
import { ShowroomMapEmbed } from './ShowroomMapEmbed';
import { ShowroomAddressBlock } from './ShowroomAddressBlock';

type Props = {
  showroom: PayloadShowroom;
};

function mapHref(showroom: PayloadShowroom): string | null {
  if (showroom.neshanProfileUrl) return showroom.neshanProfileUrl;
  if (showroom.googleBusinessProfileUrl) return showroom.googleBusinessProfileUrl;
  if (
    showroom.geo &&
    typeof showroom.geo.lat === 'number' &&
    typeof showroom.geo.lng === 'number'
  ) {
    return `https://neshan.org/maps#c${showroom.geo.lat}-${showroom.geo.lng}-15z-0p`;
  }
  return null;
}

export function ShowroomInfoCards({ showroom }: Props) {
  const phone = showroom.phone ? classifyPhone(showroom.phone) : null;
  const map = mapHref(showroom);
  return (
    <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
      {/* Address + inline map */}
      <div className="glass-card rounded-lg p-6">
        <h3 className="mb-3 text-eyebrow font-bold uppercase tracking-[0.06em] text-stone">
          آدرس
        </h3>
        <ShowroomAddressBlock showroom={showroom} />
        <div className="mt-4">
          <ShowroomMapEmbed showroom={showroom} />
        </div>
      </div>

      {/* Hours table */}
      <div className="glass-card rounded-lg p-6">
        <h3 className="mb-3 text-eyebrow font-bold uppercase tracking-[0.06em] text-stone">
          ساعات کاری
        </h3>
        <ShowroomHoursTable hours={showroom.hours} />
        {showroom.appointmentOnly ? (
          <p className="mt-3 text-small text-stone">
            * این شوروم فقط با وقت قبلی پذیرای مهمانان است.
          </p>
        ) : null}
      </div>

      {/* Phone + CTAs */}
      <div className="glass-card rounded-lg p-6">
        <h3 className="mb-3 text-eyebrow font-bold uppercase tracking-[0.06em] text-stone">
          تماس
        </h3>
        {showroom.phone ? (
          <div className="text-h4 font-bold text-charcoal" dir="ltr">
            {showroom.phone}
          </div>
        ) : null}
        {showroom.email ? (
          <a
            href={`mailto:${showroom.email}`}
            className="mt-1 block text-small text-stone underline-offset-4 hover:underline"
            dir="ltr"
          >
            {showroom.email}
          </a>
        ) : null}
        <div className="mt-5 flex flex-col gap-3">
          {phone ? (
            <a
              href={`tel:${phone.e164}`}
              className="inline-flex items-center justify-center rounded-md bg-charcoal px-9 py-3 text-small font-bold text-ivory transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:-translate-y-px hover:bg-ink hover:shadow-subtle"
            >
              تماس با شوروم
            </a>
          ) : null}
          {map ? (
            <a
              href={map}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center rounded-md border border-sand bg-transparent px-9 py-3 text-small font-bold text-charcoal transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:border-charcoal"
            >
              مسیریابی
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
