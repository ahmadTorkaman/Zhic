import { CountUp } from '@zhic/ui';

export type StatBlockProps = {
  value: number;
  suffix?: string;
  label: string;
};

export function StatBlock({ value, suffix, label }: StatBlockProps) {
  return (
    <div className="border-s-2 border-gold ps-5">
      <div className="text-h3 font-black leading-[var(--leading-h2)] text-ivory md:text-h2">
        <CountUp value={value} suffix={suffix} />
      </div>
      <div className="mt-1 text-small font-light text-sand">{label}</div>
    </div>
  );
}
