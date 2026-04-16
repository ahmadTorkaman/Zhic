/**
 * @zhic/design-system — tokens + Tailwind v4 theme binding.
 *
 * TS consumers:
 *   import { color, spacing } from '@zhic/design-system';
 *
 * CSS consumers (apps/web, apps/crm, etc.):
 *   @import "@zhic/design-system/tokens.css";
 *   @import "@zhic/design-system/theme.css";
 *   @import "@zhic/design-system/base.css";
 */

export { color } from './tokens/color';
export type { ColorToken } from './tokens/color';

export {
  fontFamily,
  fontWeight,
  fontSize,
  letterSpacing,
} from './tokens/typography';
export type { FontSizeToken } from './tokens/typography';

export { spacing, container, gutter } from './tokens/spacing';
export type { SpacingToken } from './tokens/spacing';

export { radius } from './tokens/radii';
export type { RadiusToken } from './tokens/radii';

export { shadow } from './tokens/shadows';
export type { ShadowToken } from './tokens/shadows';

export { breakpoint } from './tokens/breakpoints';
export type { BreakpointToken } from './tokens/breakpoints';

export { duration, easing } from './tokens/motion';
export type { DurationToken, EasingToken } from './tokens/motion';

export { glass } from './tokens/glass';
export type { GlassToken } from './tokens/glass';

export { zIndex } from './tokens/z-index';
export type { ZIndexToken } from './tokens/z-index';
