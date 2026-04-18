import { Container, PhoneLink, Section, Stack } from '@zhic/ui';
import type { PayloadShowroom } from '@/lib/payload';

type Props = {
  showroom: PayloadShowroom | null;
};

export function CentralPhoneCallout({ showroom }: Props) {
  if (!showroom?.phone) return null;
  return (
    <Section bg="cream" padY="lg">
      <Container>
        <Stack gap="md" align="center">
          <p className="text-small uppercase tracking-wide text-stone">
            مرکز تماس ژیک
          </p>
          <p className="text-h2 font-bold text-charcoal">
            <PhoneLink raw={showroom.phone} className="!text-h2 !no-underline" />
          </p>
          <p className="text-body text-stone text-center max-w-prose">
            {showroom.address?.city ?? showroom.name} — تیم ما در ساعات کاری پاسخ‌گوی شماست.
          </p>
          {showroom.email ? (
            <a
              href={`mailto:${showroom.email}`}
              className="text-body text-charcoal underline underline-offset-4 hover:decoration-2"
              dir="ltr"
            >
              {showroom.email}
            </a>
          ) : null}
        </Stack>
      </Container>
    </Section>
  );
}
