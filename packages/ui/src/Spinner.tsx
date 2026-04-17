import { cn } from './cn';

type Size = 'sm' | 'md' | 'lg';

export type SpinnerProps = {
  size?: Size;
  label?: string;
  className?: string;
};

const SIZE_CLASSES: Record<Size, string> = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
};

export function Spinner({
  size = 'md',
  label = 'در حال بارگذاری',
  className,
}: SpinnerProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      aria-label={label}
      role="status"
      className={cn(
        'animate-spin',
        SIZE_CLASSES[size],
        className,
      )}
    >
      <circle cx="12" cy="12" r="10" strokeOpacity="0.2" />
      <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round" />
    </svg>
  );
}
