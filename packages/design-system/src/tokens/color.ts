/**
 * Color tokens. Source of truth: docs/spec/design-system.md §2.1.
 *
 * The storefront lives in ivory + charcoal. Sand and cream are for
 * separation and hairlines. Gold is a once-per-page maximum.
 * No pure black, no pure white anywhere.
 */
export const color = {
  ivory: '#FAFAF7',
  cream: '#F5F0EB',
  sand: '#E8E0D8',
  stone: '#8C8279',
  charcoal: '#2C2825',
  ink: '#14110F',
  accent: '#B8A898',
  gold: '#C49A6C',
  rust: '#8B4A2B',
  forest: '#5F7760',
  overlay: 'rgba(20, 17, 15, 0.6)',
} as const;

export type ColorToken = keyof typeof color;
