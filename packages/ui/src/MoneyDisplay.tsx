import { formatMoney } from '@zhic/money';

export type MoneyDisplayProps = {
  rials: number | bigint;
  /** Show "تومان" suffix. Default true. */
  withSuffix?: boolean;
  className?: string;
};

export function MoneyDisplay({ rials, withSuffix = true, className }: MoneyDisplayProps) {
  const formatted = formatMoney(rials, { digits: 'fa', suffix: withSuffix ? 'toman' : 'none' });
  return (
    <span dir="ltr" className={className}>
      {formatted}
    </span>
  );
}
