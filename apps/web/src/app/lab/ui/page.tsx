'use client';

import { useState } from 'react';
import {
  Badge,
  Button,
  Checkbox,
  FormField,
  Input,
  Radio,
  RadioGroup,
  Select,
  Tag,
  Textarea,
} from '@zhic/ui';

/**
 * /lab/ui — Session 2.1 verification surface.
 *
 * Renders every component × variant × size × state so a human can eyeball:
 *   - Tokens resolve (no raw hex / physical-direction utilities bled in)
 *   - RTL layout reads correctly (chevrons flip, X on inline-end, focus ring
 *     wraps the element on both sides)
 *   - Keyboard tab order moves right → left through each cluster
 *   - Error states surface on FormField and native elements together
 */

const BUTTON_VARIANTS = ['primary', 'secondary', 'ghost', 'link'] as const;
const BUTTON_SIZES = ['sm', 'md', 'lg'] as const;
const CONTROL_SIZES = ['sm', 'md', 'lg'] as const;
const BADGE_VARIANTS = [
  'neutral',
  'accent',
  'success',
  'warning',
  'error',
] as const;
const BADGE_SIZES = ['sm', 'md'] as const;
const BADGE_SHAPES = ['square', 'rounded'] as const;

function Section({
  title,
  caption,
  children,
}: {
  title: string;
  caption?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-5 border-t border-sand pt-10">
      <header className="space-y-1">
        <h2 className="text-h3 font-black text-charcoal">{title}</h2>
        {caption ? <p className="text-small text-stone">{caption}</p> : null}
      </header>
      <div className="space-y-8">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-4 md:grid-cols-[160px_1fr] md:items-start">
      <div
        className="text-eyebrow uppercase tracking-wide text-stone"
        dir="ltr"
      >
        {label}
      </div>
      <div className="flex flex-wrap items-start gap-4">{children}</div>
    </div>
  );
}

function ArrowEnd() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
      className="rtl:-scale-x-100"
    >
      <path
        d="M3 8 H13 M9 4 L13 8 L9 12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CartIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden
    >
      <path
        d="M2 3 H4 L5.5 11 H13 L14 5 H5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6" cy="13.5" r="1" />
      <circle cx="12" cy="13.5" r="1" />
    </svg>
  );
}

export default function UiLabPage() {
  const [tags, setTags] = useState([
    'چوب گردو',
    'نئوکلاسیک',
    'رنگ عسلی',
    'تحویل تهران',
  ]);
  const [radioValue, setRadioValue] = useState('walnut');
  const [orientation, setOrientation] = useState('vertical');
  const [formState, setFormState] = useState({
    name: '',
    phone: '',
    city: '',
    message: '',
    agree: false,
  });
  const [submitted, setSubmitted] = useState(false);

  const phoneInvalid =
    submitted &&
    formState.phone.trim().length > 0 &&
    !/^09\d{9}$/.test(formState.phone.replaceAll(' ', ''));
  const nameError =
    submitted && formState.name.trim().length === 0
      ? 'نام الزامی است.'
      : undefined;
  const phoneError = phoneInvalid
    ? 'شماره موبایل معتبر نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹'
    : undefined;

  return (
    <div dir="rtl" className="space-y-10">
      <header className="space-y-2">
        <p className="text-eyebrow font-bold uppercase tracking-wide text-stone">
          Session 2.1 · Verification
        </p>
        <h1 className="text-h1 font-black text-charcoal">
          UI — دکمه‌ها، فیلدها، نشان‌ها
        </h1>
        <p className="text-body text-stone">
          هر کامپوننت از <code dir="ltr">@zhic/ui</code> خوانده می‌شود و فقط
          توکن‌های <code dir="ltr">@zhic/design-system</code> را مصرف می‌کند.
          اگر چیزی اینجا اشتباه است، خود بسته اشتباه است.
        </p>
      </header>

      <Section
        title="Button"
        caption="primary · secondary · ghost · link × sm · md · lg · loading · disabled · slots · polymorphic"
      >
        {BUTTON_VARIANTS.map((variant) => (
          <Row key={variant} label={variant}>
            {BUTTON_SIZES.map((size) => (
              <Button key={size} variant={variant} size={size}>
                خرید محصول
              </Button>
            ))}
          </Row>
        ))}
        <Row label="loading">
          {BUTTON_VARIANTS.map((variant) => (
            <Button key={variant} variant={variant} loading>
              در حال ارسال
            </Button>
          ))}
        </Row>
        <Row label="disabled">
          {BUTTON_VARIANTS.map((variant) => (
            <Button key={variant} variant={variant} disabled>
              غیرفعال
            </Button>
          ))}
        </Row>
        <Row label="slots">
          <Button variant="primary" startSlot={<CartIcon />}>
            افزودن به سبد
          </Button>
          <Button variant="secondary" endSlot={<ArrowEnd />}>
            مشاهده کاتالوگ
          </Button>
          <Button
            variant="ghost"
            startSlot={<CartIcon />}
            endSlot={<ArrowEnd />}
          >
            هر دو
          </Button>
        </Row>
        <Row label="as anchor">
          <Button as="a" href="#top" variant="primary">
            لینک اصلی
          </Button>
          <Button as="a" href="#top" variant="link">
            ادامه مطلب
          </Button>
        </Row>
      </Section>

      <Section
        title="Input"
        caption="text · email · search · tel · url · number · password × sm · md · lg × error · disabled"
      >
        {CONTROL_SIZES.map((size) => (
          <Row key={size} label={size}>
            <Input size={size} placeholder="نام و نام خانوادگی" />
            <Input size={size} type="email" placeholder="you@zhicwood.com" />
            <Input
              size={size}
              type="tel"
              inputMode="tel"
              placeholder="09123456789"
            />
          </Row>
        ))}
        <Row label="number">
          <Input type="number" inputMode="numeric" placeholder="مقدار" />
          <Input type="search" placeholder="جست‌وجو در کاتالوگ…" />
          <Input type="url" placeholder="https://zhicwood.com" />
          <Input type="password" placeholder="••••••••" />
        </Row>
        <Row label="states">
          <Input placeholder="خالی" />
          <Input defaultValue="پر شده" />
          <Input invalid defaultValue="خطادار" />
          <Input disabled placeholder="غیرفعال" />
          <Input disabled defaultValue="غیرفعال + پر" />
        </Row>
      </Section>

      <Section title="Textarea" caption="rows 3 / 5 / 8 × size · invalid · disabled">
        <Row label="rows">
          <Textarea rows={3} placeholder="۳ خط" />
          <Textarea rows={5} placeholder="۵ خط" />
          <Textarea rows={8} placeholder="۸ خط" />
        </Row>
        <Row label="states">
          <Textarea placeholder="پیش‌فرض" />
          <Textarea invalid defaultValue="پیام خطا دارد" />
          <Textarea disabled defaultValue="غیرفعال" />
        </Row>
      </Section>

      <Section title="Select" caption="سایز × invalid × disabled (chevron RTL-aware)">
        {CONTROL_SIZES.map((size) => (
          <Row key={size} label={size}>
            <Select size={size} defaultValue="">
              <option value="" disabled>
                شهر مقصد
              </option>
              <option value="tehran">تهران</option>
              <option value="mashhad">مشهد</option>
              <option value="isfahan">اصفهان</option>
              <option value="shiraz">شیراز</option>
            </Select>
          </Row>
        ))}
        <Row label="states">
          <Select invalid defaultValue="tehran">
            <option value="tehran">تهران</option>
            <option value="mashhad">مشهد</option>
          </Select>
          <Select disabled defaultValue="tehran">
            <option value="tehran">تهران</option>
          </Select>
        </Row>
      </Section>

      <Section
        title="Checkbox & Radio"
        caption="native input + custom indicator, peer-driven states"
      >
        <Row label="checkbox">
          <Checkbox>قبول می‌کنم</Checkbox>
          <Checkbox defaultChecked>عضویت در خبرنامه</Checkbox>
          <Checkbox disabled>غیرفعال</Checkbox>
          <Checkbox disabled defaultChecked>
            غیرفعال + تیک
          </Checkbox>
          <Checkbox invalid>باید تأیید شود</Checkbox>
        </Row>
        <Row label="controlled">
          <Checkbox
            checked={formState.agree}
            onChange={(e) =>
              setFormState((s) => ({ ...s, agree: e.target.checked }))
            }
          >
            با قوانین موافقم
          </Checkbox>
          <span className="text-small text-stone" dir="ltr">
            {String(formState.agree)}
          </span>
        </Row>
        <Row label="radio group">
          <RadioGroup
            name="finish"
            value={radioValue}
            onValueChange={setRadioValue}
            orientation={orientation as 'horizontal' | 'vertical'}
          >
            <Radio value="walnut">چوب گردو</Radio>
            <Radio value="oak">چوب بلوط</Radio>
            <Radio value="ash">چوب زبان‌گنجشک</Radio>
          </RadioGroup>
          <Button
            variant="ghost"
            size="sm"
            onClick={() =>
              setOrientation((o) =>
                o === 'vertical' ? 'horizontal' : 'vertical',
              )
            }
          >
            orientation: {orientation}
          </Button>
          <span className="text-small text-stone" dir="ltr">
            value: {radioValue}
          </span>
        </Row>
      </Section>

      <Section
        title="Badge"
        caption="neutral · accent · success · warning · error × sm · md × square · rounded"
      >
        {BADGE_SHAPES.map((shape) => (
          <Row key={shape} label={shape}>
            {BADGE_SIZES.map((size) =>
              BADGE_VARIANTS.map((variant) => (
                <Badge
                  key={`${size}-${variant}`}
                  size={size}
                  variant={variant}
                  shape={shape}
                >
                  {variant}
                </Badge>
              )),
            )}
          </Row>
        ))}
        <Row label="use cases">
          <Badge variant="success" size="md">
            موجود
          </Badge>
          <Badge variant="warning" size="md">
            تعداد محدود
          </Badge>
          <Badge variant="error" size="md">
            ناموجود
          </Badge>
          <Badge variant="accent" size="sm" shape="square">
            جدید
          </Badge>
        </Row>
      </Section>

      <Section
        title="Tag"
        caption="pill-shaped chip · dismiss button on inline-end (RTL-aware)"
      >
        <Row label="filter chips">
          {tags.length === 0 ? (
            <span className="text-small text-stone">
              همه حذف شدند — رفرش کنید.
            </span>
          ) : (
            tags.map((t) => (
              <Tag
                key={t}
                size="md"
                onDismiss={() =>
                  setTags((prev) => prev.filter((x) => x !== t))
                }
              >
                {t}
              </Tag>
            ))
          )}
        </Row>
        <Row label="static">
          <Tag>چوب گردو</Tag>
          <Tag variant="accent">نئوکلاسیک</Tag>
          <Tag size="md">پرفروش</Tag>
          <Tag variant="accent" size="md">
            محدود
          </Tag>
        </Row>
      </Section>

      <Section
        title="FormField"
        caption="label · help · error · required · id + aria wiring"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <FormField label="نام و نام خانوادگی" required>
            <Input placeholder="مثال: نرگس رضایی" />
          </FormField>
          <FormField label="ایمیل" help="برای ارسال فاکتور استفاده می‌شود.">
            <Input type="email" placeholder="you@zhicwood.com" />
          </FormField>
          <FormField
            label="شماره موبایل"
            error="شماره وارد شده معتبر نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹"
            required
          >
            <Input type="tel" inputMode="tel" defaultValue="091234" />
          </FormField>
          <FormField label="شهر" help="برای انتخاب شوروم نزدیک.">
            <Select defaultValue="">
              <option value="" disabled>
                انتخاب شهر
              </option>
              <option value="tehran">تهران</option>
              <option value="mashhad">مشهد</option>
              <option value="isfahan">اصفهان</option>
            </Select>
          </FormField>
          <FormField label="پیام" help="حداکثر ۵۰۰ کاراکتر.">
            <Textarea placeholder="درباره سفارش خود بنویسید…" rows={5} />
          </FormField>
          <FormField
            label="قبول قوانین"
            error="برای ادامه لازم است قوانین را بپذیرید."
            required
          >
            <Checkbox>قوانین و شرایط را خوانده‌ام.</Checkbox>
          </FormField>
        </div>
      </Section>

      <Section
        title="Composed form"
        caption="آرایش کل زنجیره: FormField + Input + Select + Textarea + Button"
      >
        <form
          className="grid gap-6 rounded-md border border-sand bg-cream/40 p-8 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            setSubmitted(true);
          }}
          noValidate
        >
          <FormField label="نام و نام خانوادگی" required error={nameError}>
            <Input
              value={formState.name}
              onChange={(e) =>
                setFormState((s) => ({ ...s, name: e.target.value }))
              }
              placeholder="نام کامل"
            />
          </FormField>
          <FormField
            label="شماره موبایل"
            help="بدون فاصله، ۱۱ رقم"
            required
            error={phoneError}
          >
            <Input
              type="tel"
              inputMode="tel"
              value={formState.phone}
              onChange={(e) =>
                setFormState((s) => ({ ...s, phone: e.target.value }))
              }
              placeholder="09123456789"
            />
          </FormField>
          <FormField label="شهر مقصد">
            <Select
              value={formState.city}
              onChange={(e) =>
                setFormState((s) => ({ ...s, city: e.target.value }))
              }
            >
              <option value="">انتخاب شهر</option>
              <option value="tehran">تهران</option>
              <option value="mashhad">مشهد</option>
              <option value="isfahan">اصفهان</option>
              <option value="shiraz">شیراز</option>
            </Select>
          </FormField>
          <FormField label="علاقه" help="می‌توانید بیش از یک مورد را انتخاب کنید.">
            <RadioGroup
              name="interest"
              value={radioValue}
              onValueChange={setRadioValue}
              orientation="horizontal"
            >
              <Radio value="walnut">گردو</Radio>
              <Radio value="oak">بلوط</Radio>
              <Radio value="ash">زبان‌گنجشک</Radio>
            </RadioGroup>
          </FormField>
          <div className="md:col-span-2">
            <FormField label="پیام" help="درباره سفارش، محل تحویل، یا رنگ ترجیحی">
              <Textarea
                rows={5}
                value={formState.message}
                onChange={(e) =>
                  setFormState((s) => ({ ...s, message: e.target.value }))
                }
                placeholder="متن پیام…"
              />
            </FormField>
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4">
            <Checkbox
              checked={formState.agree}
              onChange={(e) =>
                setFormState((s) => ({ ...s, agree: e.target.checked }))
              }
            >
              با قوانین و شرایط موافقم.
            </Checkbox>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setFormState({
                    name: '',
                    phone: '',
                    city: '',
                    message: '',
                    agree: false,
                  });
                  setSubmitted(false);
                }}
              >
                پاک‌کردن
              </Button>
              <Button type="submit" variant="primary" endSlot={<ArrowEnd />}>
                ارسال
              </Button>
            </div>
          </div>
        </form>
      </Section>
    </div>
  );
}
