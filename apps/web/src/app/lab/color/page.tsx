import { color } from '@zhic/design-system';

const swatches: Array<{
  token: keyof typeof color;
  label: string;
  use: string;
  textClass: string;
}> = [
  { token: 'ivory', label: 'عاج', use: 'پس‌زمینه‌ی صفحه، بوم', textClass: 'text-charcoal' },
  { token: 'cream', label: 'کرِم', use: 'پنل‌ها، بخش‌های جایگزین', textClass: 'text-charcoal' },
  { token: 'sand', label: 'شنی', use: 'جداکننده‌ها، خطوط ظریف، هاور', textClass: 'text-charcoal' },
  { token: 'stone', label: 'سنگی', use: 'متن ثانویه، توضیحات', textClass: 'text-ivory' },
  { token: 'charcoal', label: 'زغالی', use: 'متن اصلی، تیترها', textClass: 'text-ivory' },
  { token: 'ink', label: 'مرکّب', use: 'نزدیک به سیاه، استفاده‌ی کم', textClass: 'text-ivory' },
  { token: 'accent', label: 'تأکید', use: 'تأکید خنثی (خاکی گرم)', textClass: 'text-charcoal' },
  { token: 'gold', label: 'طلایی', use: 'رنگ برند — حداکثر یک‌بار در صفحه', textClass: 'text-charcoal' },
  { token: 'rust', label: 'زنگاری', use: 'خطا / هشدار', textClass: 'text-ivory' },
  { token: 'forest', label: 'جنگلی', use: 'رنگ برند — تأکید اصلی', textClass: 'text-ivory' },
  { token: 'overlay', label: 'پوشش', use: 'پس‌زمینه‌ی مودال و دراور', textClass: 'text-ivory' },
];

export default function ColorLab() {
  return (
    <article className="space-y-16">
      <header>
        <p className="mb-3 text-eyebrow font-bold tracking-wide text-stone">
          آزمایشگاه · رنگ
        </p>
        <h1 className="text-h1 font-black text-ink">پالت رنگ ژیک</h1>
        <p className="mt-4 max-w-xl text-lead font-light text-stone">
          رنگ‌های برند بر پایه‌ی خنثی‌های گرم. طلایی و جنگلی فقط در لحظات
          خاص ظاهر می‌شوند — عاج و زغال بار بصری اصلی را حمل می‌کنند.
        </p>
      </header>

      <section className="grid grid-cols-2 gap-px border border-sand bg-sand md:grid-cols-5">
        {swatches.map((s) => (
          <div key={s.token} className="bg-ivory">
            <div
              className="flex aspect-square w-full items-end p-4 border-b border-sand/40"
              style={{ backgroundColor: color[s.token] as string }}
            >
              <span className={`text-eyebrow font-bold tracking-wide ${s.textClass}`}>
                {color[s.token]}
              </span>
            </div>
            <div className="p-4 space-y-1">
              <div className="text-body font-bold text-charcoal">{s.label}</div>
              <div className="text-eyebrow font-bold tracking-wide text-stone" dir="ltr">
                --color-{s.token}
              </div>
              <p className="text-small text-stone">{s.use}</p>
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-h3 font-bold text-charcoal mb-6">جفت‌های کنتراست</h2>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-md bg-ivory p-6 border border-sand">
            <p className="text-body text-charcoal">زغالی روی عاج — متن اصلی بدنه</p>
            <p className="text-small text-stone mt-2">سنگی روی عاج — متن ثانویه</p>
          </div>
          <div className="rounded-md bg-ink p-6">
            <p className="text-body text-ivory">عاجی روی مرکّب — بخش‌های تاریک</p>
            <p className="text-small text-sand mt-2">شنی روی مرکّب — ثانویه‌ی تاریک</p>
          </div>
          <div className="rounded-md bg-cream p-6 border border-sand">
            <p className="text-body text-charcoal">زغالی روی کرِم — پنل‌ها</p>
            <p className="text-small text-forest mt-2">جنگلی روی کرِم — تأکید</p>
          </div>
          <div className="rounded-md bg-charcoal p-6">
            <p className="text-body text-ivory">عاجی روی زغال</p>
            <p className="text-small text-gold mt-2">طلایی روی زغال — لحظه‌ی پاداش</p>
          </div>
        </div>
      </section>
    </article>
  );
}
