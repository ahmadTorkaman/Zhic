/**
 * Radius tokens. Source: docs/spec/design-system.md §2.5.
 * Most surfaces are square. Roundness is rare and meaningful.
 */
export const radius = {
  none: '0',
  sm: '2px', // inputs, chips
  md: '4px', // cards, buttons
  lg: '8px', // modals
  pill: '999px', // round buttons, tags
} as const;

export type RadiusToken = keyof typeof radius;
