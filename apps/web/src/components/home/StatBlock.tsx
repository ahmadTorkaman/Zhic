export type StatBlockProps = {
  value: string;
  label: string;
};

export function StatBlock({ value, label }: StatBlockProps) {
  return (
    <div className="border-s-2 border-gold ps-5">
      <div className="text-h3 font-black leading-[var(--leading-h2)] text-ivory md:text-h2">{value}</div>
      <div className="mt-1 text-small font-light text-sand">{label}</div>
    </div>
  );
}
