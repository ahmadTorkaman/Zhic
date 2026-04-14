/**
 * Motion tokens. Source: docs/spec/design-system.md §6.3.
 *
 * Storefront defaults to slow, choreographed motion. Operator apps
 * default to a reduced, functional vocabulary. Shared easings.
 */

export const duration = {
  // Storefront
  instant: '100ms',
  fast: '240ms',
  base: '480ms',
  slow: '720ms',
  glacial: '1200ms',

  // Operator
  opFast: '120ms',
  opBase: '180ms',
  opSlow: '280ms',
} as const;

export const easing = {
  outSoft: 'cubic-bezier(0.22, 1, 0.36, 1)',
  inSoft: 'cubic-bezier(0.64, 0, 0.78, 0)',
  inOutSoft: 'cubic-bezier(0.65, 0, 0.35, 1)',
  expoOut: 'cubic-bezier(0.16, 1, 0.3, 1)',
} as const;

export type DurationToken = keyof typeof duration;
export type EasingToken = keyof typeof easing;
