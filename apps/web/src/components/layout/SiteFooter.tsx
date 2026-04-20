import Link from 'next/link';
import { Container } from '@zhic/ui';
import { FOOTER_COLUMNS, FOOTER_LEGAL, FOOTER_COPYRIGHT_LINE } from './footerLinks';

export function SiteFooter() {
  return (
    <footer className="bg-charcoal pb-6 pt-9 text-ivory">
      <Container>
        <div className="mb-8 grid grid-cols-1 gap-5 sm:grid-cols-2 md:grid-cols-4 md:gap-7">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h4 className="mb-4 text-small font-bold text-ivory">{col.heading}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={`${col.heading}-${link.label}`}>
                    <Link
                      href={link.href}
                      className="block text-small font-light text-sand transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:text-ivory"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div
          className="flex flex-col items-center gap-3 border-t pt-5 text-center text-eyebrow font-light md:flex-row md:justify-between md:text-start"
          style={{ borderTopColor: 'rgba(250, 250, 247, 0.06)', color: 'rgba(250, 250, 247, 0.35)' }}
        >
          <span>{FOOTER_COPYRIGHT_LINE}</span>
          <span className="space-x-3">
            {FOOTER_LEGAL.map((link, i) => (
              <span key={link.href}>
                {i > 0 ? <span aria-hidden className="mx-2">·</span> : null}
                <Link
                  href={link.href}
                  className="transition-colors duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:text-ivory"
                >
                  {link.label}
                </Link>
              </span>
            ))}
          </span>
        </div>
      </Container>
    </footer>
  );
}
