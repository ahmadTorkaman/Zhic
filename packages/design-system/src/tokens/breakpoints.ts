/**
 * Breakpoint tokens. Source: docs/spec/design-system.md §2.8.
 * Mobile-first. Storefront designs produced at 390, 1024, 1440, 1920.
 */
export const breakpoint = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1440px',
  '2xl': '1920px',
} as const;

export type BreakpointToken = keyof typeof breakpoint;
