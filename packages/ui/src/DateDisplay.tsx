import type { TimeHTMLAttributes } from 'react';
import { formatDate, type FormatDateOptions } from '@zhic/locale';
import { cn } from './cn';

export type DateDisplayProps = Omit<
  TimeHTMLAttributes<HTMLTimeElement>,
  'children' | 'dateTime'
> & {
  value: string | Date;
  withWeekday?: FormatDateOptions['withWeekday'];
  digits?: FormatDateOptions['digits'];
};

function toIso(value: string | Date): string {
  return value instanceof Date ? value.toISOString() : value;
}

export function DateDisplay({
  value,
  withWeekday,
  digits,
  className,
  ...rest
}: DateDisplayProps) {
  const text = formatDate(value, { withWeekday, digits });
  return (
    <time
      {...rest}
      dateTime={toIso(value)}
      className={cn('font-sans tabular-nums', className)}
    >
      {text}
    </time>
  );
}
