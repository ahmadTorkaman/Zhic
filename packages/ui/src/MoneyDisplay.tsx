import type { HTMLAttributes } from 'react';
import { formatMoney, type FormatMoneyOptions } from '@zhic/money';
import { cn } from './cn';

export type MoneyDisplayProps = Omit<
  HTMLAttributes<HTMLSpanElement>,
  'children'
> & {
  rials: number | bigint;
  unit?: FormatMoneyOptions['unit'];
  digits?: FormatMoneyOptions['digits'];
  suffix?: FormatMoneyOptions['suffix'];
};

export function MoneyDisplay({
  rials,
  unit,
  digits,
  suffix,
  className,
  ...rest
}: MoneyDisplayProps) {
  const text = formatMoney(rials, { unit, digits, suffix });
  return (
    <span {...rest} className={cn('font-sans tabular-nums', className)}>
      {text}
    </span>
  );
}
