/**
 * Spacing tokens. 8-point base. Source: docs/spec/design-system.md §2.3.
 *
 * Storefront section rhythm: space-11 desktop, space-9 mobile.
 * Operator apps: space-7 desktop, space-5 mobile.
 */
export const spacing = {
  1: '0.25rem', // 4
  2: '0.5rem', // 8
  3: '0.75rem', // 12
  4: '1rem', // 16
  5: '1.5rem', // 24
  6: '2rem', // 32
  7: '3rem', // 48
  8: '4rem', // 64
  9: '6rem', // 96
  10: '8rem', // 128
  11: '12rem', // 192
  12: '16rem', // 256
} as const;

export const container = {
  storefront: '1440px',
  operator: '1600px',
} as const;

export const gutter = {
  desktop: spacing[6], // 32px
  mobile: spacing[4], // 16px
} as const;

export type SpacingToken = keyof typeof spacing;
