// apps/web/src/lib/tag/state.ts
import 'server-only';
import { payloadGet } from './payload-rest';
import type { Occupancy } from './types';

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
