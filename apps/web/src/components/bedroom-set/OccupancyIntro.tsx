/** Intro band under the /bedroom-set/[occupancy] hero (CMS «بخش معرفی»).
 *  Renders nothing when both fields are empty. Sized in cqw against the page's
 *  430 container. */
export type OccupancyIntroProps = {
  heading?: string;
  body?: string;
};

export function OccupancyIntro({ heading, body }: OccupancyIntroProps) {
  if (!heading && !body) return null;
  return (
    <section className="px-[22px] text-center">
      {heading ? (
        <h2 className="text-[4.7cqw] font-bold leading-[1.5] text-ink">{heading}</h2>
      ) : null}
      {body ? (
        <p className="mt-[6px] text-[3.3cqw] leading-[1.95] text-stone whitespace-pre-line">{body}</p>
      ) : null}
    </section>
  );
}
