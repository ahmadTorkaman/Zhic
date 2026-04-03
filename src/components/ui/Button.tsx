import { ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'outline';
}

export default function Button({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonProps) {
  const base =
    'inline-flex items-center justify-center px-8 py-3 text-[11px] tracking-[0.2em] uppercase font-medium font-sans cursor-pointer rounded-full transition-all duration-500 ease-out';
  const variants = {
    primary:
      'bg-charcoal text-ivory hover:bg-accent hover:shadow-[0_8px_30px_rgba(184,168,152,0.3)] hover:-translate-y-0.5 active:translate-y-0',
    outline:
      'border border-charcoal/15 text-charcoal hover:border-charcoal/40 hover:shadow-[0_8px_30px_rgba(44,40,37,0.06)] hover:-translate-y-0.5 active:translate-y-0',
  };

  return (
    <button className={`${base} ${variants[variant]} ${className}`} {...props}>
      {children}
    </button>
  );
}
