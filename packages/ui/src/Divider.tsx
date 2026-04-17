import { cn } from './cn';

type Variant = 'subtle' | 'strong';
type Spacing = 'sm' | 'md' | 'lg';

export type DividerProps = {
  variant?: Variant;
  spacing?: Spacing;
  className?: string;
};

const VARIANT_CLASSES: Record<Variant, string> = {
  subtle: 'border-sand',
  strong: 'border-stone',
};

const SPACING_CLASSES: Record<Spacing, string> = {
  sm: 'my-4',
  md: 'my-6',
  lg: 'my-8',
};

export function Divider({
  variant = 'subtle',
  spacing = 'md',
  className,
}: DividerProps) {
  return (
    <hr
      role="separator"
      className={cn(
        'border-t',
        VARIANT_CLASSES[variant],
        SPACING_CLASSES[spacing],
        className,
      )}
    />
  );
}
