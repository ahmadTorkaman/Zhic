import type { ReactNode } from 'react';
import { Container, Section } from '@zhic/ui';

type Variant = 'page' | 'section';

export type DarkSplitHeroProps = {
  /** Main heading (ivory, h2 size per mockup). */
  title: string;
  /** Lead paragraph (sand color, light weight). */
  lead?: string;
  /** Gold-eyebrow contact block: phone, email, optional label. */
  contact?: {
    label?: string;  // defaults to "دفتر مرکزی"
    phone?: string;  // plain string; caller formats
    email?: string;
  };
  /** Gold-eyebrow hours block. */
  hours?: {
    label?: string;  // defaults to "ساعات پاسخ‌گویی"
    text: string;    // e.g. "شنبه تا پنجشنبه · ۰۹:۰۰ – ۱۷:۰۰"
  };
  /** Form slot — typically <InquiryForm /> (page variant) or <InquiryFormSlim /> (section variant). */
  children: ReactNode;
  /** 'page' uses padY=xl (for /contact standalone page); 'section' uses padY=lg (for HomeInquiryCta embedded in /). */
  variant?: Variant;
};

export function DarkSplitHero({
  title, lead, contact, hours, children,
  variant = 'page',
}: DarkSplitHeroProps) {
  const padY = variant === 'page' ? 'xl' : 'lg';
  const contactLabel = contact?.label ?? 'دفتر مرکزی';
  const hoursLabel = hours?.label ?? 'ساعات پاسخ‌گویی';

  return (
    <Section bg="ink" padY={padY} fullBleed className="relative overflow-hidden">
      {/* Decorative radial forest glow at top-end (RTL) corner */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-[200px] -end-[200px] h-[600px] w-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, color-mix(in srgb, var(--color-forest) 6%, transparent) 0%, transparent 70%)',
        }}
      />

      <Container>
        <div className="relative grid grid-cols-1 items-start gap-7 md:grid-cols-2 md:gap-10">
          {/* Text column */}
          <div>
            <div aria-hidden className="mb-6 h-[2px] w-12 bg-gold" />
            <h1 className="mb-4 text-balance text-h2 font-black text-ivory">{title}</h1>
            {lead ? (
              <p className="mb-6 max-w-[460px] text-body font-light leading-[1.85] text-sand">{lead}</p>
            ) : null}

            {contact?.phone || contact?.email ? (
              <div className="mb-5">
                <div className="mb-3 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow)] text-gold">
                  {contactLabel}
                </div>
                {contact.phone ? (
                  <div dir="ltr" className="text-end text-h3 font-bold text-ivory">{contact.phone}</div>
                ) : null}
                {contact.email ? (
                  <div dir="ltr" className="mt-1 text-end text-small font-light text-sand">{contact.email}</div>
                ) : null}
              </div>
            ) : null}

            {hours ? (
              <div className="mb-5">
                <div className="mb-3 text-eyebrow font-bold uppercase tracking-[var(--tracking-eyebrow)] text-gold">
                  {hoursLabel}
                </div>
                <div className="text-small font-light text-sand">{hours.text}</div>
              </div>
            ) : null}
          </div>

          {/* Form column */}
          <div>{children}</div>
        </div>
      </Container>
    </Section>
  );
}
