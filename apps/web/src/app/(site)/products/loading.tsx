import { Aspect, Container, Section, Stack } from '@zhic/ui';

export default function Loading() {
  return (
    <Section padY="lg">
      <Container>
        <Stack gap="lg">
          <div className="h-12 w-1/3 animate-pulse rounded bg-cream" />
          <div className="h-6 w-2/3 animate-pulse rounded bg-cream" />
          <div className="grid gap-8 md:grid-cols-[18rem_1fr]">
            <aside className="hidden md:block">
              <div className="space-y-4">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 w-full animate-pulse rounded bg-cream" />
                ))}
              </div>
            </aside>
            <div className="grid grid-cols-2 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="space-y-3">
                  <Aspect ratio="4/5" className="bg-cream animate-pulse">
                    <span className="sr-only">در حال بارگذاری</span>
                  </Aspect>
                  <div className="h-4 w-3/4 animate-pulse rounded bg-cream" />
                  <div className="h-3 w-1/2 animate-pulse rounded bg-cream" />
                </div>
              ))}
            </div>
          </div>
        </Stack>
      </Container>
    </Section>
  );
}
