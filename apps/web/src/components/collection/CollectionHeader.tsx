import { Aspect, Container, Section, Split, Stack } from '@zhic/ui';
import type { PayloadCollection } from '@/lib/payload';
import { mediaUrl } from '@/lib/payload';
import { RichText } from '@/lib/richtext';

type Props = {
  collection: PayloadCollection;
};

export function CollectionHeader({ collection }: Props) {
  const coverSrc = mediaUrl(collection.cover ?? null);
  return (
    <Section bg="cream" padY="xl">
      <Container>
        <Split ratio="40/60" gap="lg">
          <div>
            <Aspect ratio="4/5" className="bg-sand/40">
              {coverSrc ? (
                <img
                  src={coverSrc}
                  alt={collection.cover?.alt ?? collection.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-body text-stone">
                  تصویر به‌زودی
                </div>
              )}
            </Aspect>
          </div>
          <Stack gap="md" justify="center">
            <p className="text-small text-stone uppercase tracking-wide">
              مجموعه
            </p>
            <h1 className="text-display font-bold text-charcoal text-balance">
              {collection.name}
            </h1>
            {collection.description ? (
              <RichText value={collection.description} />
            ) : null}
          </Stack>
        </Split>
      </Container>
    </Section>
  );
}
