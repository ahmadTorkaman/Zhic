import { cn } from './cn';

type Variant = 'text' | 'block' | 'circle';

export type SkeletonProps = {
  variant?: Variant;
  width?: string;
  height?: string;
  lines?: number;
  className?: string;
};

export function Skeleton({
  variant = 'text',
  width,
  height,
  lines = 1,
  className,
}: SkeletonProps) {
  if (variant === 'text' && lines > 1) {
    return (
      <div className={cn('flex flex-col gap-2', className)}>
        {Array.from({ length: lines }, (_, i) => (
          <div
            key={i}
            className={cn(
              'skeleton-shimmer h-4 rounded-md',
              i === lines - 1 ? 'w-3/5' : 'w-full',
            )}
          />
        ))}
      </div>
    );
  }

  if (variant === 'circle') {
    return (
      <div
        className={cn('skeleton-shimmer rounded-full', className)}
        style={{ width: width ?? '48px', height: width ?? '48px' }}
      />
    );
  }

  if (variant === 'block') {
    return (
      <div
        className={cn('skeleton-shimmer rounded-md', className)}
        style={{ width, height }}
      />
    );
  }

  return (
    <div
      className={cn('skeleton-shimmer h-4 w-full rounded-md', className)}
      style={{ width }}
    />
  );
}
