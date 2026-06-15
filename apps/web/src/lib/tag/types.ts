// apps/web/src/lib/tag/types.ts
export type Occupancy = 'baby' | 'teen' | 'double' | 'bunk';
export const OCCUPANCIES: Occupancy[] = ['baby', 'teen', 'double', 'bunk'];
export const OCCUPANCY_FA: Record<Occupancy, string> = {
  baby: 'نوزاد', teen: 'نوجوان', double: 'دونفره', bunk: 'دوطبقه',
};
export const ALLOWED_ROLES = ['admin', 'editor', 'marketing'] as const;
export type AllowedRole = (typeof ALLOWED_ROLES)[number];

export type TagUser = { id: number; email: string; role: string };

/** A poster pick for one age within one design. imageId null = clear the slot. */
export type DesignPoster = { occupancy: Occupancy; imageId: number | null };

/** The full intended state for ONE design, produced by the UI. */
export type DesignEdit = {
  designId: number;
  occupancies: Occupancy[];
  posters: DesignPoster[]; // one entry per asserted occupancy
};

/** Current persisted shape of a design's occupancy data (image as numeric id). */
export type DesignCurrent = {
  designId: number;
  occupancies: readonly Occupancy[];
  occupancyMedia: { occupancy: Occupancy; image: number | null }[];
};

/** A single field-level change for diff/snapshot/audit. */
export type FieldChange = {
  collection: 'designs' | 'products' | 'media';
  id: number;
  field: 'occupancies' | 'occupancyMedia' | 'alt' | 'caption' | 'decorative';
  before: unknown;
  after: unknown;
};

/** The UI's intended per-image text fields. */
export type MediaEdit = { mediaId: number; alt: string | null; caption: string | null; decorative: boolean };

export type MediaState = {
  id: number;
  url: string;
  thumbnailURL: string | null;
  filename: string;
  alt: string | null;
  caption: string | null;
  decorative: boolean;
  inUse: boolean;
  ctx: { pieceType: string | null; designName: string | null; productName: string | null; productSlug: string | null } | null;
};

/** The UI's intended occupancies for ONE product (product mode). */
export type ProductEdit = { productId: number; occupancies: Occupancy[] };

export type ProductState = {
  productId: number;
  title: string;
  designSlug: string | null;
  designTitle: string | null;
  occupancies: Occupancy[];
};

export type PreviewResult = { changes: FieldChange[]; confirmToken: string };
export type ApplyResult = { applied: number; backupDir: string };
