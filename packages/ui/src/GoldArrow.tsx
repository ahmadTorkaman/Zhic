import type { SVGProps } from 'react';

/**
 * Slim line-arrow glyph (RTL "forward/مشاهده") from the bedroom-furniture
 * Figma (node 191:289). Stroke uses `currentColor`, so set the color via a
 * text utility — e.g. `className="text-gold w-[24px]"`. Decorative by default.
 */
export function GoldArrow({ className, ...rest }: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24.1649 9.03366"
      fill="none"
      aria-hidden="true"
      focusable="false"
      className={className}
      {...rest}
    >
      <path
        d="M23.7132 4.75553C23.7132 4.75553 6.09085 4.91472 6.09085 4.75547C6.09085 4.59621 6.09085 0.615166 5.91462 0.455986C5.7384 0.296806 0.451681 4.5987 0.451681 4.75547C0.451681 4.91223 6.09085 8.58193 6.09085 8.58193"
        stroke="currentColor"
        strokeWidth="0.903361"
        strokeLinecap="round"
      />
    </svg>
  );
}
