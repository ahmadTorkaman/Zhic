interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  label?: string;
  className?: string;
}

export default function SectionHeading({
  title,
  subtitle,
  label,
  className = '',
}: SectionHeadingProps) {
  return (
    <div className={`text-center mb-16 md:mb-24 ${className}`}>
      {label && (
        <span className="inline-flex items-center gap-3 text-[10px] tracking-[0.4em] uppercase text-accent font-medium mb-5 block">
          <span className="w-6 h-px bg-accent/40 inline-block" />
          {label}
          <span className="w-6 h-px bg-accent/40 inline-block" />
        </span>
      )}
      <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-light text-charcoal tracking-wide leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-5 text-stone text-sm md:text-base font-light max-w-lg mx-auto leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  );
}
