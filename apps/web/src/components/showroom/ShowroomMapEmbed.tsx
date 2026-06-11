import type { PayloadShowroom } from '@/lib/payload';

export type ShowroomMapEmbedProps = {
  showroom: Pick<PayloadShowroom, 'mapEmbedUrl' | 'geo' | 'name'>;
  /** Aspect ratio string. Default '16/9'. */
  aspect?: '4/3' | '16/9';
};

export function ShowroomMapEmbed({ showroom, aspect = '16/9' }: ShowroomMapEmbedProps) {
  const aspectClass = aspect === '4/3' ? 'aspect-[4/3]' : 'aspect-video';

  if (showroom.mapEmbedUrl) {
    return (
      <div className={`w-full overflow-hidden rounded-md ${aspectClass}`}>
        <iframe
          src={showroom.mapEmbedUrl}
          title={`نقشه‌ی ${showroom.name}`}
          className="h-full w-full border-0"
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
          allow="geolocation"
        />
      </div>
    );
  }

  // Fallback placeholder
  return (
    <div
      className={`flex w-full items-center justify-center rounded-md bg-cream text-small text-stone ${aspectClass}`}
    >
      نقشه‌ی این شعبه به‌زودی
    </div>
  );
}
