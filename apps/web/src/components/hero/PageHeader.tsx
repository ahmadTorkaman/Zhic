import type { ReactNode } from 'react';
import { Container, Section } from '@zhic/ui';

export type PageHeaderProps = {
  title: ReactNode;
  subtitle?: ReactNode;
};

export function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <Section padY="md" fullBleed>
      <Container>
        <h1 className="text-h1 font-black text-ink text-balance">{title}</h1>
        {subtitle ? (
          <p className="mt-3 max-w-prose text-lead font-light text-stone">{subtitle}</p>
        ) : null}
      </Container>
    </Section>
  );
}
