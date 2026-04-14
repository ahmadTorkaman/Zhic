/**
 * Z-index tokens. Source: docs/spec/design-system.md §2.7.
 */
export const zIndex = {
  base: 0,
  raised: 10,
  sticky: 100,
  header: 200,
  overlay: 900,
  modal: 1000,
  toast: 1100,
} as const;

export type ZIndexToken = keyof typeof zIndex;
