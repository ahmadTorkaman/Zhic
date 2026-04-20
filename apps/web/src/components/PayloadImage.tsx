import { mediaUrl, type PayloadMedia } from '@/lib/payload';

export type PayloadImageProps = {
  media: PayloadMedia | null | undefined;
  alt?: string;
  /** Tailwind classes applied to the rendered <img>. Defaults to "h-full w-full object-cover". */
  className?: string;
  /** Loading hint. Defaults to "lazy" — pass "eager" for above-fold heroes. */
  loading?: 'lazy' | 'eager';
  /** Fetch priority hint. Pass "high" for the LCP image. */
  fetchPriority?: 'high' | 'low' | 'auto';
  /** Text to render in place of the image when media is null. */
  fallbackText?: string;
};

export function PayloadImage({
  media,
  alt,
  className = 'h-full w-full object-cover',
  loading = 'lazy',
  fetchPriority,
  fallbackText,
}: PayloadImageProps) {
  const src = mediaUrl(media);
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-cream text-small text-stone">
        {fallbackText ?? 'تصویر به‌زودی منتشر می‌شود'}
      </div>
    );
  }
  return (
    <img
      src={src}
      alt={alt ?? media?.alt ?? ''}
      loading={loading}
      fetchPriority={fetchPriority}
      className={className}
    />
  );
}
