/**
 * Content for the /bedroom-furniture page (Figma 191:207).
 *
 * SEEDED for now — static data + local media under /public/bedroom-furniture.
 * To wire Payload later, replace only the body of `getBedroomFurnitureContent`
 * with a CMS query that returns the same shape (the components stay untouched).
 */

export type ShowcaseSlide = {
  key: string;
  /** Pill label (e.g. «تخت خواب»). */
  label: string;
  /** Image URL (local seed path now; Payload media URL later). */
  img: string;
  href: string;
};

export type RoomCard = {
  key: string;
  /** Plain occupancy word — used for the accessible label / alt. */
  name: string;
  /** Kashida-stretched display form (Figma); falls back to `name`. */
  display?: string;
  img: string;
  href: string;
};

export type BedroomFurnitureContent = {
  showcase: ShowcaseSlide[];
  /** Slide centered on first render (the comp features تخت خواب). */
  showcaseInitial: number;
  rooms: RoomCard[];
  lorem: string;
};

const SEED: BedroomFurnitureContent = {
  showcase: [
    { key: 'nightstand', label: 'پا تختی', img: '/bedroom-furniture/arch-nightstand.jpg', href: '/bedroom-furniture/nightstand' },
    { key: 'bed', label: 'تخت خواب', img: '/bedroom-furniture/arch-bed.jpg', href: '/bedroom-furniture/bed' },
    { key: 'desk', label: 'میز تحریر', img: '/bedroom-furniture/arch-desk.jpg', href: '/bedroom-furniture/table' },
  ],
  showcaseInitial: 1,
  rooms: [
    { key: 'adult', name: 'بزرگسال', display: 'بزرگــســــال', img: '/bedroom-furniture/room-adult.jpg', href: '/bedroom-furniture/adult' },
    { key: 'teen', name: 'نوجوان', display: 'نـــــــوجوان', img: '/bedroom-furniture/room-teen.jpg', href: '/bedroom-furniture/teen' },
    { key: 'infant', name: 'نوزاد', display: 'نــــــــــــــوزاد', img: '/bedroom-furniture/room-infant.jpg', href: '/bedroom-furniture/infant' },
    { key: 'bunk', name: 'دو طبقه', display: 'دو طــــــبقه', img: '/bedroom-furniture/room-bunk.jpg', href: '/bedroom-furniture/bunk' },
  ],
  lorem:
    'لورم ایپسوم متن ساختگی با تولید سادگی نامفهوم از صنعت چاپ و با استفاده از طراحان گرافیک است. چاپگرها و متون بلکه روزنامه و مجله در ستون و سطرآنچنان که لازم است و برای شرایط فعلی تکنولوژی مورد نیاز و کاربردهای متنوع با هدف بهبود ابزارهای کاربردی می باشد.',
};

/**
 * Returns the page content. Async so the Payload swap is seamless later
 * (e.g. `return mapCategoriesToContent(await fetchAllCategories())`).
 */
export async function getBedroomFurnitureContent(): Promise<BedroomFurnitureContent> {
  return SEED;
}
