// apps/web/src/lib/tag/alt-gen.ts
// Persian alt generator — ported verbatim from services/api/scripts/reconcile-10-alt-text.mts
// (the web app cannot import the script). Pure: derives alt from filename + parent context.

const PIECE_FA: Record<string, string> = {
  bed: 'تخت', nightstand: 'پاتختی', closet: 'کمد', dresser: 'دراور', mirror: 'آینه',
  desk: 'میز تحریر', bookcase: 'کتابخانه', display_cabinet: 'ویترین', vanity: 'میز آرایش',
  chair: 'صندلی', console: 'کنسول', changing_table: 'میز تعویض', bracket: 'براکت', sofa: 'مبل',
};
const NUM_FA = ['', 'یک', 'دو', 'سه', 'چهار', 'پنج', 'شش'];
const COLOR_FA: Record<string, string> = {
  cream: 'کرم', green: 'سبز', gray: 'خاکستری', grey: 'خاکستری', white: 'سفید',
  black: 'مشکی', walnut: 'گردویی', oak: 'بلوط',
};

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const faDigits = (s: string) => s.replace(/\d/g, (d) => FA_DIGITS[+d] ?? d);

function qualifiers(rest: string[]): string[] {
  const q: string[] = [];
  for (let i = 0; i < rest.length - 1; i++) {
    const n = Number(rest[i]);
    if (n >= 1 && n <= 6 && rest[i + 1] === 'doors') q.push(`${NUM_FA[n]} درب`);
    if (n >= 1 && n <= 6 && rest[i + 1] === 'drawers') q.push(`${NUM_FA[n]} کشو`);
  }
  if (rest.includes('mdf')) q.push('ام‌دی‌اف');
  if (rest.includes('glass')) q.push('شیشه‌ای');
  if (rest.includes('pieces')) {
    const i = rest.indexOf('pieces'); const n = Number(rest[i - 1]);
    if (n >= 1 && n <= 6) q.push(`ست ${NUM_FA[n]}‌تکه`);
  }
  for (const t of rest) if (COLOR_FA[t]) { q.push(`رنگ ${COLOR_FA[t]}`); break; }
  for (const t of rest) if (/^\d{2,3}$/.test(t)) { q.push(`سایز ${faDigits(t)}`); break; }
  if (rest.includes('open')) q.push('نمای داخلی');
  else if (rest.includes('picture')) q.push('نمای محیطی');
  return q;
}

export type AltContext = {
  filename: string;
  pieceType?: string | null;
  designName?: string | null;
  productName?: string | null;
  productSlug?: string | null;
};

/** Generate Persian alt text from filename qualifiers + parent context. Pure. */
export function altFromContext(ctx: AltContext): string {
  const base = (ctx.productName?.trim() || `${PIECE_FA[ctx.pieceType ?? ''] ?? 'محصول'} ${ctx.designName ?? ''}`.trim());
  const name = ctx.filename.replace(/\.[a-z0-9]+$/i, '');
  const slug = ctx.productSlug ?? '';
  const rest = (slug && name.startsWith(slug + '-') ? name.slice(slug.length + 1) : name).split('-');
  const q = qualifiers(rest);
  return q.length ? `${base} — ${q.join('، ')}` : base;
}
