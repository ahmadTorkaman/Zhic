import { formatDate } from '@zhic/locale';

export type DateDisplayProps = {
  /** ISO 8601 string or Date. */
  value: string | Date;
  /** Include weekday in the formatted output. */
  withWeekday?: boolean;
  className?: string;
};

export function DateDisplay({ value, withWeekday, className }: DateDisplayProps) {
  return (
    <time dateTime={typeof value === 'string' ? value : value.toISOString()} className={className}>
      {formatDate(value, { withWeekday })}
    </time>
  );
}
