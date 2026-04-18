import { createOgImage } from '@/lib/og';
import { fetchProduct } from '@/lib/payload';

export const runtime = 'nodejs';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export async function generateImageMetadata({
  params,
}: {
  params: { slug: string };
}) {
  return [{ id: 'og', alt: `محصول ژیک — ${params.slug}`, size, contentType }];
}

export default async function OgImage({ params }: { params: { slug: string } }) {
  const product = await fetchProduct(params.slug);
  return createOgImage({
    title: product?.name ?? 'محصول ژیک',
    subtitle: product?.tagline ?? undefined,
  });
}
