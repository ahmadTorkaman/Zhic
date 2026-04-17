import type { ReactNode } from 'react';
import Link from 'next/link';
import { cn } from './cn';
import { Container } from './Container';
import { FooterNewsletter } from './FooterNewsletter';

export type FooterColumn = {
  title: string;
  links: { label: string; href: string }[];
};

export type FooterSocial = {
  label: string;
  href: string;
  icon: ReactNode;
};

export type SiteFooterProps = {
  columns: FooterColumn[];
  newsletter?: {
    placeholder?: string;
    submitLabel?: string;
    helpText?: ReactNode;
    heading?: ReactNode;
  };
  socials?: FooterSocial[];
  copyright: ReactNode;
  className?: string;
};

export function SiteFooter({
  columns,
  newsletter,
  socials,
  copyright,
  className,
}: SiteFooterProps) {
  return (
    <footer
      aria-labelledby="site-footer-title"
      className={cn('bg-charcoal text-ivory', className)}
    >
      <h2 id="site-footer-title" className="sr-only">
        پاورقی سایت
      </h2>
      <Container>
        <div className={cn('grid gap-10 py-10', {
          'md:grid-cols-2': columns.length === 2,
          'md:grid-cols-3': columns.length === 3,
          'md:grid-cols-4': columns.length >= 4,
        })}>
          {columns.map((col) => (
            <nav key={col.title} aria-label={col.title}>
              <h3 className="text-eyebrow uppercase tracking-wide text-accent">
                {col.title}
              </h3>
              <ul className="mt-4 space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="rounded-sm text-small text-ivory/70 transition-colors hover:text-ivory focus-ring-invert focus-visible:outline-none"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        {newsletter ? (
          <div className="border-t border-ivory/10 py-8">
            <div className="grid gap-6 md:grid-cols-[1fr_minmax(320px,auto)] md:items-end">
              <div>
                <h3 className="text-h4 font-bold text-ivory">
                  {newsletter.heading ?? 'خبرنامه'}
                </h3>
                {newsletter.helpText ? (
                  <p className="mt-2 text-small text-ivory/60">
                    {newsletter.helpText}
                  </p>
                ) : null}
              </div>
              <FooterNewsletter
                placeholder={newsletter.placeholder}
                submitLabel={newsletter.submitLabel}
              />
            </div>
          </div>
        ) : null}

        <div className="flex flex-col items-start justify-between gap-4 border-t border-ivory/10 py-6 md:flex-row md:items-center">
          {socials && socials.length > 0 ? (
            <ul className="flex items-center gap-3">
              {socials.map((social) => (
                <li key={social.href}>
                  <a
                    href={social.href}
                    aria-label={social.label}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md text-ivory/60 transition-colors hover:text-ivory focus-ring-invert focus-visible:outline-none"
                    target={social.href.startsWith('http') ? '_blank' : undefined}
                    rel={social.href.startsWith('http') ? 'noopener noreferrer' : undefined}
                  >
                    {social.icon}
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <span />
          )}
          <span className="text-eyebrow text-ivory/40">{copyright}</span>
        </div>
      </Container>
    </footer>
  );
}
