import { cn } from './cn';

export type DotsIndicatorProps = {
  /** Number of dots. */
  count: number;
  /** Index of the active dot (solid); others render at 50% opacity. */
  active?: number;
  className?: string;
  /** Accessible label for the indicator group. */
  label?: string;
  /** When provided, dots become clickable and call this with the index. */
  onSelect?: (index: number) => void;
};

/**
 * Row of carousel dots (bedroom-furniture showcase, Figma nodes 191:308–310).
 * Gold dots; the active one is solid, the rest at 50% opacity — 10px dots on
 * a ~21px pitch, matching the comp. Pass `onSelect` to make them clickable.
 */
export function DotsIndicator({
  count,
  active = 0,
  className,
  label = 'اسلایدها',
  onSelect,
}: DotsIndicatorProps) {
  return (
    <div
      className={cn('flex items-center justify-center gap-[11px]', className)}
      role="tablist"
      aria-label={label}
    >
      {Array.from({ length: count }, (_, i) => {
        const dot = 'block size-[10px] rounded-full bg-gold';
        const style = { opacity: i === active ? 1 : 0.5 };
        return onSelect ? (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={i === active}
            aria-label={`اسلاید ${i + 1}`}
            onClick={() => onSelect(i)}
            className={cn(dot, 'cursor-pointer p-0')}
            style={style}
          />
        ) : (
          <span key={i} role="tab" aria-selected={i === active} className={dot} style={style} />
        );
      })}
    </div>
  );
}
