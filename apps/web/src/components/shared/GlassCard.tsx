import type { ReactNode } from 'react';

type Tone = 'light' | 'dark';

export type GlassCardProps = {
  tone?: Tone;
  /** When provided, renders as <a>; otherwise as <div>. */
  href?: string;
  className?: string;
  children?: ReactNode;
};

const BASE_LIGHT = 'glass-card block rounded-lg p-6';
const BASE_DARK = 'glass-card-dark block rounded-lg p-7';

export function GlassCard({ tone = 'light', href, className, children }: GlassCardProps) {
  const base = tone === 'dark' ? BASE_DARK : BASE_LIGHT;
  const cls = [base, className].filter(Boolean).join(' ');
  if (href) {
    return <a href={href} className={cls}>{children}</a>;
  }
  return <div className={cls}>{children}</div>;
}
