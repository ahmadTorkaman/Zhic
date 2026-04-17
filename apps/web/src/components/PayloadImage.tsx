import { Aspect, type AspectRatio } from '@zhic/ui';
import { mediaUrl, type PayloadMedia } from '@/lib/payload';

interface PayloadImageProps {
  media: PayloadMedia | null | undefined;
  alt: string;
  aspect?: AspectRatio;
  fallbackText?: string;
  className?: string;
}

export function PayloadImage({
  media,
  alt,
  aspect,
  fallbackText = 'تصویر به‌زودی',
  className,
}: PayloadImageProps) {
  const src = mediaUrl(media);

  if (!src) {
    const placeholder = (
      <div className="flex h-full w-full items-center justify-center bg-cream text-small text-stone">
        {fallbackText}
      </div>
    );
    return aspect ? (
      <Aspect ratio={aspect} className={className}>
        {placeholder}
      </Aspect>
    ) : (
      <div className={className}>{placeholder}</div>
    );
  }

  const imgEl = (
    <img
      src={src}
      alt={media?.alt ?? alt}
      loading="lazy"
      className="h-full w-full object-cover"
    />
  );

  return aspect ? (
    <Aspect ratio={aspect} className={className}>
      {imgEl}
    </Aspect>
  ) : (
    <div className={className}>{imgEl}</div>
  );
}
