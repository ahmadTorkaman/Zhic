// apps/web/src/lib/tag/state.ts
import 'server-only';
import { payloadGet } from './payload-rest';
import type { Occupancy, ProductState, MediaState } from './types';

export type CandidateImage = { id: number; url: string; alt: string | null; filename: string };
export type DesignState = {
  designId: number;
  slug: string;
  title: string; // mapped from design.name
  occupancies: Occupancy[];
  posters: { occupancy: Occupancy; imageId: number }[];
  candidates: CandidateImage[]; // gallery + slider + hero images for this design
};

type PayloadMediaDoc = { id: number; url: string; alt?: string | null; filename: string };

type PayloadDesignRaw = {
  id: number;
  slug: string;
  name: string; // Designs collection uses `name`, not `title`
  occupancies?: Occupancy[] | null;
  occupancyMedia?: { occupancy: Occupancy; image?: PayloadMediaDoc | number | null }[] | null;
  heroMedia?: PayloadMediaDoc | number | null;
  sliderMedia?: PayloadMediaDoc | number | null;
  gallery?: PayloadMediaDoc[] | null; // designs also have their own gallery
};

type PayloadProductRaw = {
  id: number;
  design?: { id: number } | number | null;
  gallery?: PayloadMediaDoc[] | null;
};

const idOf = (v: { id: number } | number | null | undefined): number | null =>
  v == null ? null : typeof v === 'number' ? v : v.id;

const toCandidate = (m: PayloadMediaDoc): CandidateImage => ({
  id: m.id,
  url: m.url,
  alt: m.alt ?? null,
  filename: m.filename,
});

/** Load occupancy-mode state for ALL designs. depth=1 hydrates upload + relation docs. */
export async function loadOccupancyState(token: string): Promise<DesignState[]> {
  const designs = await payloadGet<{ docs: PayloadDesignRaw[] }>(
    `/api/designs?limit=200&depth=1`,
    token,
  );

  // Products carry per-product gallery images; group candidate images by design.
  const products = await payloadGet<{ docs: PayloadProductRaw[] }>(
    `/api/products?limit=500&depth=1`,
    token,
  );

  const galleryByDesign = new Map<number, CandidateImage[]>();
  for (const p of products.docs) {
    const did = idOf(p.design ?? null);
    if (did == null) continue;
    const arr = galleryByDesign.get(did) ?? [];
    for (const g of p.gallery ?? []) {
      if (g && typeof g === 'object') arr.push(toCandidate(g));
    }
    galleryByDesign.set(did, arr);
  }

  return designs.docs.map((d) => {
    const candidates = new Map<number, CandidateImage>();

    // 1. Design's own gallery
    for (const g of d.gallery ?? []) {
      if (g && typeof g === 'object') candidates.set(g.id, toCandidate(g));
    }

    // 2. Products' gallery images grouped to this design
    for (const c of galleryByDesign.get(d.id) ?? []) candidates.set(c.id, c);

    // 3. heroMedia and sliderMedia
    for (const key of ['heroMedia', 'sliderMedia'] as const) {
      const m = d[key];
      if (m && typeof m === 'object') candidates.set(m.id, toCandidate(m));
    }

    const posters = (d.occupancyMedia ?? [])
      .map((om) => ({ occupancy: om.occupancy, imageId: idOf(om.image ?? null) }))
      .filter((p): p is { occupancy: Occupancy; imageId: number } => p.imageId != null);

    return {
      designId: d.id,
      slug: d.slug,
      title: d.name, // map design.name → DesignState.title for a stable API surface
      occupancies: d.occupancies ?? [],
      posters,
      candidates: [...candidates.values()],
    };
  });
}

type PayloadProductOccRaw = {
  id: number; name?: string | null; title?: string | null;
  occupancies?: Occupancy[] | null;
  design?: { slug?: string | null; name?: string | null; title?: string | null } | number | null;
};

/** Load product-mode state: every product with its occupancies + parent design label. */
export async function loadProductState(token: string): Promise<ProductState[]> {
  const products = await payloadGet<{ docs: PayloadProductOccRaw[] }>(`/api/products?limit=500&depth=1`, token);
  return products.docs.map((p) => {
    const d = p.design && typeof p.design === 'object' ? p.design : null;
    return {
      productId: p.id,
      title: (p.name ?? p.title ?? `#${p.id}`) as string,
      designSlug: d?.slug ?? null,
      designTitle: (d?.name ?? d?.title ?? null) as string | null,
      occupancies: p.occupancies ?? [],
    };
  });
}

type PayloadMediaRaw = { id: number; url: string; thumbnailURL?: string | null; filename: string; alt?: string | null; caption?: string | null; decorative?: boolean | null };

/** Build the in-use set + per-media owner context from products/variants/designs, then page media. */
export async function loadImagesState(
  token: string,
  opts: { page: number; limit: number; needsAlt: boolean },
): Promise<{ images: MediaState[]; total: number; totalPages: number; page: number }> {
  const [products, variants, designs] = await Promise.all([
    payloadGet<{ docs: { id: number; name?: string | null; slug?: string | null; piece_type?: string | null; design?: { name?: string | null } | number | null; gallery?: ({ id: number } | number)[] | null }[] }>(`/api/products?limit=500&depth=1`, token),
    payloadGet<{ docs: { id: number; image?: { id: number } | number | null }[] }>(`/api/product-variants?limit=500&depth=0`, token),
    payloadGet<{ docs: Record<string, unknown>[] }>(`/api/designs?limit=200&depth=1`, token),
  ]);

  const inUse = new Set<number>();
  const owner = new Map<number, MediaState['ctx']>();
  for (const p of products.docs) {
    const designName = p.design && typeof p.design === 'object' ? (p.design.name ?? null) : null;
    for (const g of p.gallery ?? []) {
      const id = idOf(g);
      if (id == null) continue;
      inUse.add(id);
      if (!owner.has(id)) owner.set(id, { pieceType: p.piece_type ?? null, designName, productName: p.name ?? null, productSlug: p.slug ?? null });
    }
  }
  for (const v of variants.docs) { const id = idOf(v.image ?? null); if (id != null) inUse.add(id); }
  for (const d of designs.docs) {
    for (const k of ['heroMedia', 'sliderMedia', 'logoMedia'] as const) { const id = idOf((d[k] as { id: number } | number | null) ?? null); if (id != null) inUse.add(id); }
    for (const g of (d.gallery as ({ id: number } | number)[] | null) ?? []) { const id = idOf(g); if (id != null) inUse.add(id); }
    for (const om of (d.occupancyMedia as { image?: { id: number } | number | null }[] | null) ?? []) { const id = idOf(om.image ?? null); if (id != null) inUse.add(id); }
  }

  const where = opts.needsAlt ? '&where[alt][exists]=false' : '';
  const media = await payloadGet<{ docs: PayloadMediaRaw[]; totalDocs: number; totalPages: number }>(
    `/api/media?limit=${opts.limit}&page=${opts.page}&depth=0${where}`, token,
  );
  const images: MediaState[] = media.docs.map((m) => ({
    id: m.id, url: m.url, thumbnailURL: m.thumbnailURL ?? null, filename: m.filename,
    alt: m.alt ?? null, caption: m.caption ?? null, decorative: !!m.decorative,
    inUse: inUse.has(m.id), ctx: owner.get(m.id) ?? null,
  }));
  return { images, total: media.totalDocs, totalPages: media.totalPages, page: opts.page };
}
