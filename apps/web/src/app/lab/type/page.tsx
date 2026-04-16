const scale: Array<{
  token: string;
  css: string;
  weight: number;
  weightLabel: string;
  sample: string;
}> = [
  { token: 'display', css: 'text-display', weight: 900, weightLabel: 'فوق‌سیاه ۹۰۰', sample: 'ژیک' },
  { token: 'h1', css: 'text-h1', weight: 900, weightLabel: 'فوق‌سیاه ۹۰۰', sample: 'صنایع چوب ژیک' },
  { token: 'h2', css: 'text-h2', weight: 700, weightLabel: 'سیاه ۷۰۰', sample: 'مبلمان دست‌ساز ایرانی' },
  { token: 'h3', css: 'text-h3', weight: 700, weightLabel: 'سیاه ۷۰۰', sample: 'میز ناهارخوری آرتا' },
  { token: 'h4', css: 'text-h4', weight: 700, weightLabel: 'سیاه ۷۰۰', sample: 'مشخصات فنی محصول' },
  { token: 'lead', css: 'text-lead', weight: 300, weightLabel: 'سبک ۳۰۰', sample: 'ما در کارگاه ژیک با عشق و دقت، هر قطعه را می‌سازیم.' },
  { token: 'body', css: 'text-body', weight: 400, weightLabel: 'معمولی ۴۰۰', sample: 'چوب گردو از جنگل‌های شمال ایران تهیه و با روش‌های سنتی خشک می‌شود.' },
  { token: 'small', css: 'text-small', weight: 400, weightLabel: 'معمولی ۴۰۰', sample: 'ارسال رایگان به سراسر ایران · گارانتی ۵ ساله' },
  { token: 'eyebrow', css: 'text-eyebrow', weight: 700, weightLabel: 'سیاه ۷۰۰', sample: 'کلکسیون بهار ۱۴۰۵' },
];

const weights = [
  { value: 300, label: 'سبک — ۳۰۰', sample: 'آینده — وزن سبک' },
  { value: 400, label: 'معمولی — ۴۰۰', sample: 'آینده — وزن معمولی' },
  { value: 700, label: 'سیاه — ۷۰۰', sample: 'آینده — وزن سیاه' },
  { value: 900, label: 'فوق‌سیاه — ۹۰۰', sample: 'آینده — وزن فوق‌سیاه' },
];

export default function TypeLab() {
  return (
    <article className="space-y-16">
      <header>
        <p className="mb-3 text-eyebrow font-bold tracking-wide text-stone">
          آزمایشگاه · تایپوگرافی
        </p>
        <h1 className="text-h1 font-black text-ink">مقیاس تایپوگرافی</h1>
        <p className="mt-4 max-w-xl text-lead font-light text-stone">
          فونت آینده در ۴ وزن. مقیاس سیّال با clamp() برای پاسخ‌گویی
          به اندازه‌های مختلف صفحه‌نمایش.
        </p>
      </header>

      <section>
        <h2 className="text-h3 font-bold text-charcoal mb-8">مقیاس</h2>
        <div className="space-y-0">
          {scale.map((s) => (
            <div key={s.token} className="border-b border-sand/60 py-4">
              <div className="mb-2 flex items-baseline gap-4">
                <span className="text-eyebrow font-bold tracking-wide text-stone" dir="ltr">
                  {s.token}
                </span>
                <span className="text-eyebrow text-stone" dir="ltr">
                  {s.weightLabel}
                </span>
              </div>
              <p
                className={`${s.css} text-charcoal`}
                style={{ fontWeight: s.weight }}
              >
                {s.sample}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-h3 font-bold text-charcoal mb-8">وزن‌های فونت</h2>
        <div className="grid gap-6 md:grid-cols-2">
          {weights.map((w) => (
            <div key={w.value} className="rounded-md border border-sand p-6">
              <p className="text-eyebrow font-bold tracking-wide text-stone mb-3" dir="ltr">
                {w.label}
              </p>
              <p className="text-h2 text-charcoal" style={{ fontWeight: w.value }}>
                {w.sample}
              </p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-h3 font-bold text-charcoal mb-8">نمونه‌ی پاراگراف</h2>
        <div className="max-w-2xl space-y-4">
          <p className="text-eyebrow font-bold tracking-wide text-forest">
            کلکسیون بهار ۱۴۰۵
          </p>
          <h3 className="text-h2 font-black text-ink">
            صنایع چوب و دکوراسیون داخلی
          </h3>
          <p className="text-lead font-light text-stone">
            فضاهایی آرام و باشکوه با روح ایرانی
          </p>
          <p className="text-body text-charcoal leading-relaxed">
            ژیک با بهره‌گیری از چوب طبیعی و طراحی مینیمال، فضاهایی آرام و
            باشکوه خلق می‌کند که روح ایرانی دارند. هر قطعه‌ی مبلمان در
            کارگاه ما با دقت و عشق ساخته می‌شود. از انتخاب چوب تا پرداخت
            نهایی، هیچ مرحله‌ای عجولانه انجام نمی‌شود.
          </p>
          <p className="text-small text-stone">
            ارسال رایگان به سراسر ایران · گارانتی ۵ ساله · پشتیبانی تلفنی
          </p>
        </div>
      </section>
    </article>
  );
}
