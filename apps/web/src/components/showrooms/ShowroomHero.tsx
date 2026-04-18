import { Container, Section, Stack } from '@zhic/ui';
import type { PayloadShowroom } from '@/lib/payload';
import { mediaUrl } from '@/lib/payload';

type Props = {
  showroom: PayloadShowroom;
};

export function ShowroomHero({ showroom }: Props) {
  const cover = mediaUrl(showroom.cover ?? showroom.gallery?.[0] ?? null);
  return (
    <Section fullBleed bg="cream" padY="sm">
      <div className="relative min-h-[40vh] md:min-h-[55vh]">
        {cover ? (
          <>
            <img
              src={cover}
              alt={showroom.cover?.alt ?? showroom.gallery?.[0]?.alt ?? showroom.name}
              className="absolute inset-0 -z-10 h-full w-full object-cover"
            />
            <div className="absolute inset-0 -z-10 bg-ink/35" aria-hidden />
          </>
        ) : (
          <div className="absolute inset-0 -z-10 bg-cream" aria-hidden />
        )}
        <Container>
          <div className="flex min-h-[40vh] md:min-h-[55vh] items-end py-10">
            <Stack gap="sm">
              {showroom.address?.city ? (
                <p
                  className={`text-small uppercase tracking-wide ${
                    cover ? 'text-ivory/85' : 'text-stone'
                  }`}
                >
                  {showroom.address.city}
                </p>
              ) : null}
              <h1
                className={`text-display font-bold text-balance ${
                  cover ? 'text-ivory' : 'text-charcoal'
                }`}
              >
                {showroom.name}
              </h1>
              {showroom.headline ? (
                <p
                  className={`text-lead max-w-prose ${
                    cover ? 'text-ivory/90' : 'text-stone'
                  }`}
                >
                  {showroom.headline}
                </p>
              ) : null}
            </Stack>
          </div>
        </Container>
      </div>
    </Section>
  );
}
