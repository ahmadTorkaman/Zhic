import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { EditorialPage } from '@/components/editorial/EditorialPage';
import { fetchRoom } from '@/lib/payload';

const VALID_SLUGS = new Set(['kid', 'teen', 'adult']);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (!VALID_SLUGS.has(slug)) return { title: 'یافت نشد' };
  const room = await fetchRoom(slug);
  if (!room) return { title: 'یافت نشد' };
  return {
    title: room.name,
    description: room.tagline ?? undefined,
  };
}

export default async function RoomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (!VALID_SLUGS.has(slug)) notFound();
  const room = await fetchRoom(slug);
  if (!room) notFound();

  return (
    <EditorialPage
      eyebrow="دسته‌ی سنی"
      heading={room.name}
      lead={room.tagline ?? undefined}
      body={room.longDescription ?? null}
      heroHeight="lg"
    />
  );
}
