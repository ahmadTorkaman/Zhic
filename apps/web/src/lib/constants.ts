export const COLORS = {
  ivory: '#FAFAF7',
  cream: '#F5F0EB',
  sand: '#E8E0D8',
  stone: '#8C8279',
  charcoal: '#2C2825',
  accent: '#B8A898',
} as const;

export const SCROLL_CONFIG = {
  desktop: {
    lerp: 0.08,
    wheelMultiplier: 0.8,
    videoScrub: 0.6,
  },
  mobile: {
    syncTouch: true,
    syncTouchLerp: 0.06,
    touchInertiaExponent: 1.8,
    touchMultiplier: 1.5,
    videoScrub: 0.3,
  },
} as const;

export const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1440,
} as const;

export const NAV_LINKS = [
  { label: 'Collection', href: '#products' },
  { label: 'About', href: '#about' },
  { label: 'Contact', href: '#contact' },
] as const;
