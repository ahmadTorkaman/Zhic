/**
 * Shadow tokens. Source: docs/spec/design-system.md §2.6.
 *
 * Hairlines preferred over shadows. Cards use subtle/card on hover.
 * Elevated for interactive lift moments. Modal for dialogs only.
 */
export const shadow = {
  none: 'none',
  subtle: '0 2px 8px rgba(20, 17, 15, 0.03)',
  card: '0 8px 32px rgba(20, 17, 15, 0.04)',
  elevated: '0 12px 40px rgba(20, 17, 15, 0.08)',
  modal: '0 24px 64px -24px rgba(20, 17, 15, 0.18)',
} as const;

export type ShadowToken = keyof typeof shadow;
