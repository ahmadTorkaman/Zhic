/**
 * Glass surface tokens. Warm frosted translucency over ivory.
 * Used for elevated panels, inquiry forms, and overlay cards.
 */
export const glass = {
  bg: 'rgba(250, 250, 247, 0.6)',
  border: 'rgba(232, 224, 216, 0.5)',
  blur: '24px',
} as const;

export type GlassToken = keyof typeof glass;
