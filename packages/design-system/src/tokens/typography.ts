/**
 * Typography tokens. Source of truth: docs/spec/design-system.md §2.2.
 *
 * Ayandeh is loaded via next/font/local in apps/web. This package
 * exposes the CSS variable name it binds to (--font-ayandeh) and the
 * modular type scale. Line-heights are tuned for Persian ascenders
 * and descenders, which need more vertical room than Latin.
 */

export const fontFamily = {
  ayandeh: 'var(--font-ayandeh)',
  sans: 'var(--font-ayandeh), ui-sans-serif, system-ui, sans-serif',
} as const;

export const fontWeight = {
  light: 300,
  regular: 400,
  bold: 700,
  black: 900,
} as const;

/**
 * Modular scale, ratio 1.25, base 16px. Mobile uses clamp() to cap
 * display at 56px and h1 at 40px.
 */
export const fontSize = {
  display: {
    value: 'clamp(3.5rem, 6vw + 1rem, 6rem)', // 56 → 96
    lineHeight: 1.15,
    weight: fontWeight.black,
  },
  h1: {
    value: 'clamp(2.5rem, 4vw + 1rem, 4rem)', // 40 → 64
    lineHeight: 1.2,
    weight: fontWeight.bold,
  },
  h2: {
    value: 'clamp(2rem, 3vw + 0.75rem, 3rem)', // 32 → 48
    lineHeight: 1.25,
    weight: fontWeight.bold,
  },
  h3: {
    value: 'clamp(1.5rem, 2vw + 0.5rem, 2rem)', // 24 → 32
    lineHeight: 1.3,
    weight: fontWeight.bold,
  },
  h4: {
    value: '1.5rem', // 24
    lineHeight: 1.35,
    weight: fontWeight.bold,
  },
  lead: {
    value: '1.25rem', // 20
    lineHeight: 1.7,
    weight: fontWeight.light,
  },
  body: {
    value: '1rem', // 16
    lineHeight: 1.75,
    weight: fontWeight.regular,
  },
  small: {
    value: '0.875rem', // 14
    lineHeight: 1.7,
    weight: fontWeight.regular,
  },
  eyebrow: {
    value: '0.75rem', // 12
    lineHeight: 1.5,
    weight: fontWeight.bold,
  },
} as const;

export const letterSpacing = {
  tight: '-0.005em', // large display sizes
  normal: '0em',
  wide: '0.02em', // word-spacing aid for Persian body
} as const;

export type FontSizeToken = keyof typeof fontSize;
