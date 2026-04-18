import { createOgImage } from '@/lib/og';
import { fetchArticle } from '@/lib/payload';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function generateImageMetadata({
  params,
}: {
  params: { slug: string };
}) {
  return [{ id: 'og', alt: `ژورنال ژیک — ${params.slug}`, size, contentType }];
}

export default async function OgImage({ params }: { params: { slug: string } }) {
  const article = await fetchArticle(params.slug);
  return createOgImage({
    title: article?.title ?? 'ژورنال ژیک',
    subtitle: article?.category?.name ?? undefined,
  });
}
