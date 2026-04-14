/**
 * Shadow tokens. Source: docs/spec/design-system.md §2.6.
 *
 * Hairlines are preferred over shadows. No drop shadows on cards.
 * Only on modals.
 */
export const shadow = {
  none: 'none',
  modal: '0 24px 64px -24px rgba(20, 17, 15, 0.18)',
} as const;

export type ShadowToken = keyof typeof shadow;
