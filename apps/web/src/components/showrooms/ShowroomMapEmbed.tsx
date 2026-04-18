import { Aspect } from '@zhic/ui';
import type { PayloadShowroom } from '@/lib/payload';

type Props = {
  showroom: PayloadShowroom;
};

function fallbackMapHref(showroom: PayloadShowroom): string | null {
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

export function ShowroomMapEmbed({ showroom }: Props) {
  if (showroom.mapEmbedUrl) {
    return (
      <Aspect ratio="16/9" className="overflow-hidden rounded-lg border border-sand">
        <iframe
          src={showroom.mapEmbedUrl}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          title={`نقشه — ${showroom.name}`}
          className="h-full w-full border-0"
          allowFullScreen
        />
      </Aspect>
    );
  }
  const href = fallbackMapHref(showroom);
  return (
    <div className="rounded-lg border border-sand bg-cream p-6 text-center">
      <p className="text-body text-stone mb-3">نقشه‌ی تعاملی به‌زودی منتشر می‌شود.</p>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="inline-block text-charcoal underline underline-offset-4 hover:decoration-2"
        >
          دیدن در نشان
        </a>
      ) : null}
    </div>
  );
}
