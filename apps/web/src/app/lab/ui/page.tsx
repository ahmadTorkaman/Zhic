'use client';

import { useState } from 'react';
import {
  ArticleCard,
  Aspect,
  type AspectRatio,
  Badge,
  Breadcrumbs,
  Button,
  Checkbox,
  DateDisplay,
  DesignCard,
  Drawer,
  FormField,
  type GalleryItem,
  Grid,
  ImageGallery,
  Input,
  Modal,
  MoneyDisplay,
  ProductCard,
  Radio,
  RadioGroup,
  Select,
  ShowroomCard,
  SkipLink,
  Split,
  Stack,
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
const ASPECT_RATIOS: AspectRatio[] = ['1/1', '4/5', '3/2', '16/9', '21/9'];

function placeholderSvg(label: string): string {
  const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice">
  <rect width="400" height="500" fill="#F5F0EB"/>
  <rect x="0.5" y="0.5" width="399" height="499" fill="none" stroke="#E8E0D8"/>
  <text x="200" y="260" text-anchor="middle" font-family="sans-serif" font-size="28" fill="#8C8279">${label}</text>
</svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function Placeholder({ label }: { label: string }) {
  return (
    <img
      src={placeholderSvg(label)}
      alt=""
      className="h-full w-full object-cover"
    />
  );
}

const GALLERY_GRID_ITEMS: GalleryItem[] = [
  { src: placeholderSvg('۱ — چوب گردو'), alt: 'کلوزآپ از چوب گردو', kind: 'image', caption: 'بافت چوب گردوی ایرانی' },
  { src: '/55_bal4.gif', alt: 'لوپ کارگاه', kind: 'gif', caption: 'در کارگاه' },
  { src: placeholderSvg('۳ — کتان بلژیکی'), alt: 'نمای کتان بلژیکی', kind: 'image' },
  { src: placeholderSvg('۴ — اتاق خواب'), alt: 'اتاق خواب نمونه', kind: 'image', caption: 'اتاق خواب آرامش، شوروم همدان' },
  { src: '/55_bal4.gif', alt: 'لوپ کوتاه دیگر', kind: 'gif' },
  { src: placeholderSvg('۶ — جزئیات'), alt: 'جزئیات پایه تخت', kind: 'image' },
];

const GALLERY_STRIP_ITEMS: GalleryItem[] = [
  { src: placeholderSvg('شوروم ۱'), alt: 'نمای ورودی شوروم', kind: 'image' },
  { src: '/55_bal4.gif', alt: 'لوپ درون شوروم', kind: 'gif' },
  { src: placeholderSvg('شوروم ۲'), alt: 'قفسه‌ی محصولات', kind: 'image' },
  { src: placeholderSvg('شوروم ۳'), alt: 'میز مشاوره', kind: 'image' },
];

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
  const [modalSize, setModalSize] = useState<'sm' | 'md' | 'lg' | null>(null);
  const [drawerSide, setDrawerSide] = useState<
    'start' | 'end' | 'top' | 'bottom' | 'full' | null
  >(null);

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
          <Tag>نئوکلاسیک</Tag>
          <Tag size="md">پرفروش</Tag>
          <Tag size="md">
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

      <Section
        title="SkipLink"
        caption="نامرئی تا زمان فوکوس؛ روی Tab به بالا می‌پرد"
      >
        <Row label="demo">
          <SkipLink href="#ui-skip-target">پرش به محتوای آزمایش</SkipLink>
          <span className="text-small text-stone">
            Tab را بزنید — گره اول این صفحه این لینک خواهد بود.
          </span>
        </Row>
        <div id="ui-skip-target" tabIndex={-1} className="text-small text-stone">
          این پاراگراف، هدف پرش است.
        </div>
      </Section>

      <Section
        title="Breadcrumbs"
        caption="لیست مسیر + chevron که زیر RTL می‌چرخد"
      >
        <Row label="short">
          <Breadcrumbs
            items={[
              { label: 'خانه', href: '/' },
              { label: 'محصولات', href: '/products' },
              { label: 'آرام' },
            ]}
          />
        </Row>
        <Row label="deep">
          <Breadcrumbs
            items={[
              { label: 'خانه', href: '/' },
              { label: 'محصولات', href: '/products' },
              { label: 'تخت‌خواب', href: '/categories/beds' },
              { label: 'آرام — گردو', href: '/products/aram-walnut' },
              { label: 'اندازه کینگ' },
            ]}
          />
        </Row>
      </Section>

      <Section
        title="Modal"
        caption="dialog native + focus trap + Escape + backdrop click"
      >
        <Row label="sizes">
          <Button variant="secondary" onClick={() => setModalSize('sm')}>
            کوچک
          </Button>
          <Button variant="secondary" onClick={() => setModalSize('md')}>
            متوسط
          </Button>
          <Button variant="secondary" onClick={() => setModalSize('lg')}>
            بزرگ
          </Button>
        </Row>
        <Modal
          open={modalSize !== null}
          onClose={() => setModalSize(null)}
          size={modalSize ?? 'md'}
          title="تأیید سفارش"
          description="برای ادامه، لطفاً اطلاعات زیر را بررسی کنید."
          footer={
            <div className="flex justify-end gap-3">
              <Button variant="ghost" onClick={() => setModalSize(null)}>
                انصراف
              </Button>
              <Button variant="primary" onClick={() => setModalSize(null)}>
                تأیید و ادامه
              </Button>
            </div>
          }
        >
          <div className="space-y-3 text-body">
            <p>سفارش به آدرس زیر ارسال خواهد شد:</p>
            <p className="text-small text-stone">
              تهران، خیابان ولیعصر، کوچه شهید مطهری، پلاک ۱۲
            </p>
            <p>
              پرداخت از طریق درگاه زرین‌پال انجام می‌شود. پس از پرداخت، پیامک
              تأیید برایتان ارسال خواهد شد.
            </p>
          </div>
        </Modal>
      </Section>

      <Section
        title="Drawer"
        caption="edge-anchored (start/end/top/bottom) + full-bleed overlay"
      >
        <Row label="sides">
          <Button variant="secondary" onClick={() => setDrawerSide('start')}>
            شروع (start)
          </Button>
          <Button variant="secondary" onClick={() => setDrawerSide('end')}>
            پایان (end)
          </Button>
          <Button variant="secondary" onClick={() => setDrawerSide('top')}>
            بالا
          </Button>
          <Button variant="secondary" onClick={() => setDrawerSide('bottom')}>
            پایین
          </Button>
          <Button variant="secondary" onClick={() => setDrawerSide('full')}>
            تمام‌پرده
          </Button>
        </Row>
        <Drawer
          open={drawerSide !== null && drawerSide !== 'full'}
          onClose={() => setDrawerSide(null)}
          side={drawerSide && drawerSide !== 'full' ? drawerSide : 'start'}
          title="منو / فیلترها"
          description="این یک نمایش پیش‌فرض است. محتوا بعداً می‌آید."
        >
          <p className="text-body">
            این drawer از لبه‌ی {drawerSide} باز می‌شود. در جهت RTL، شروع از
            راست و پایان از چپ باز می‌شود.
          </p>
        </Drawer>
        <Drawer
          open={drawerSide === 'full'}
          onClose={() => setDrawerSide(null)}
          side="full"
        >
          <div className="flex h-full flex-col items-center justify-center gap-6">
            <span className="text-h3 font-black text-charcoal">ژیک</span>
            <ul className="flex flex-col items-center gap-5 text-h4 font-bold">
              <li>خانه</li>
              <li>محصولات</li>
              <li>ژورنال</li>
              <li>درباره‌ی ما</li>
              <li>تماس</li>
            </ul>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDrawerSide(null)}
            >
              بستن
            </Button>
          </div>
        </Drawer>
      </Section>

      <Section
        title="Aspect"
        caption="پنج نسبت مجاز: 1/1 · 4/5 · 3/2 · 16/9 · 21/9"
      >
        <div className="grid gap-4 md:grid-cols-5">
          {ASPECT_RATIOS.map((ratio) => (
            <Aspect
              key={ratio}
              ratio={ratio}
              className="border border-sand bg-cream"
            >
              <div className="flex h-full w-full items-center justify-center text-small font-bold text-stone">
                {ratio}
              </div>
            </Aspect>
          ))}
        </div>
      </Section>

      <Section
        title="MoneyDisplay + DateDisplay"
        caption="تومان با ارقام فارسی · Jalali با tag‌ی <time>"
      >
        <Row label="money · toman">
          <MoneyDisplay rials={45_000_000} />
          <MoneyDisplay rials={8_400_000} />
          <MoneyDisplay rials={28_000_000} />
          <MoneyDisplay rials={1_250_000_000n} />
        </Row>
        <Row label="money · rial">
          <MoneyDisplay rials={45_000_000} unit="rial" />
          <MoneyDisplay rials={8_400_000} unit="rial" suffix="none" />
        </Row>
        <Row label="money · en digits">
          <MoneyDisplay rials={45_000_000} digits="en" />
        </Row>
        <Row label="date · jalali long">
          <DateDisplay value="2026-03-21T12:00:00.000Z" />
          <DateDisplay value={new Date('2026-01-01T00:00:00.000Z')} />
          <DateDisplay value="2025-11-15T00:00:00.000Z" withWeekday />
        </Row>
      </Section>

      <Section
        title="ProductCard"
        caption="جلد ۴/۵ · عنوان · قیمت یا fallback · نشان موجودی · تگ متریال"
      >
        <div className="grid gap-6 md:grid-cols-3">
          <ProductCard
            href="/products/takht-aramesh"
            name="تخت دو نفره آرامش"
            tagline="چوب گردوی ایرانی، کتان بلژیکی"
            priceRials={45_000_000}
            availability="made_to_order"
            leadTimeDays={56}
            materials={['چوب گردو', 'کتان بلژیکی']}
            image={<Placeholder label="تخت آرامش" />}
          />
          <ProductCard
            href="/products/komod-bahar"
            name="کمد بهار"
            priceFallback="استعلام قیمت"
            availability="in_stock"
            materials={['چوب راش']}
            image={<Placeholder label="کمد بهار" />}
          />
          <ProductCard
            name="میز کنار تخت"
            priceRials={8_400_000}
            image={<Placeholder label="میز کنار تخت" />}
          />
        </div>
      </Section>

      <Section
        title="DesignCard"
        caption="جلد ۳/۲ · نشان گروه سنی · عنوان · توضیح کوتاه"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <DesignCard
            href="/designs/aramesh"
            name="طرح آرامش"
            ageGroupLabel="بزرگسال"
            description="مجموعه‌ای برای اتاق خواب بزرگسالان با خطوط آرام و متریال گرم."
            image={<Placeholder label="طرح آرامش" />}
          />
          <DesignCard
            href="/designs/bahar"
            name="طرح بهار"
            ageGroupLabel="کودک"
            description="مجموعه‌ای شاد و امن برای اتاق کودک، با گوشه‌های گرد و رنگ‌های طبیعی."
            image={<Placeholder label="طرح بهار" />}
          />
        </div>
      </Section>

      <Section
        title="ArticleCard"
        caption="جلد ۳/۲ · eyebrow · عنوان · excerpt · نویسنده · تاریخ · زمان مطالعه"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <ArticleCard
            href="/journal/guide-wood-selection"
            categoryLabel="مصالح"
            title="راهنمای انتخاب چوب مناسب برای مبلمان"
            excerpt="در این راهنما با چوب‌های مناسب برای ساخت مبلمان آشنا می‌شوید و یاد می‌گیرید چطور بر اساس کاربری، بودجه، و ظاهر مطلوب تصمیم بگیرید."
            author="تیم ژیک"
            publishedAt="2026-03-21T12:00:00.000Z"
            readingTimeMinutes={8}
            cover={<Placeholder label="راهنمای چوب" />}
          />
          <ArticleCard
            href="/journal/atelier-tour"
            categoryLabel="کارگاه"
            title="یک روز در کارگاه همدان"
            excerpt="از برش اولیه تا پرداخت نهایی: پشت صحنه‌ی ساخت تخت آرامش."
            author="نرگس رضایی"
            publishedAt="2025-12-02T00:00:00.000Z"
            readingTimeMinutes={5}
            cover={<Placeholder label="کارگاه همدان" />}
          />
        </div>
      </Section>

      <Section
        title="ShowroomCard"
        caption="جلد ۱۶/۹ · نام + شهر · آدرس · ساعت · تلفن"
      >
        <div className="grid gap-6 md:grid-cols-2">
          <ShowroomCard
            href="/showrooms/hamedan"
            name="شوروم همدان"
            city="همدان"
            addressLine="بلوار ارم، خیابان گلستان"
            hoursSummary="شنبه تا پنجشنبه، ۱۰ تا ۲۰"
            phone={{ label: '۰۸۱ ۳۸۱۲ ۳۴۵۶', e164: '+988138123456' }}
            cover={<Placeholder label="شوروم همدان" />}
          />
          <ShowroomCard
            name="شوروم تهران (بدون لینک — phone به لینک tel تبدیل می‌شود)"
            city="تهران"
            addressLine="خیابان ولیعصر، کوچه شهید مطهری"
            hoursSummary="شنبه تا پنجشنبه، ۱۰ تا ۲۲"
            phone={{ label: '۰۲۱ ۸۸۱۲ ۳۴۵۶', e164: '+982188123456' }}
            cover={<Placeholder label="شوروم تهران" />}
          />
        </div>
      </Section>

      <Section
        title="ImageGallery — grid"
        caption="چیدمان ۳ ستونی · نسبت سلول ۴/۵ · لایت‌باکس با پیمایش کیبورد (ArrowLeft/Right)"
      >
        <ImageGallery
          items={GALLERY_GRID_ITEMS}
          layout="grid"
          columns={3}
          cellRatio="4/5"
        />
      </Section>

      <Section
        title="ImageGallery — strip"
        caption="اسکرول افقی با snap · برای چیدمان‌های باریک"
      >
        <ImageGallery
          items={GALLERY_STRIP_ITEMS}
          layout="strip"
          cellRatio="16/9"
        />
      </Section>

      <Section
        title="Grid"
        caption="۱/۲/۳/۴/۶/۱۲ ستونی ریسپانسیو با توکن gap"
      >
        <Row label="columns 2">
          <Grid columns={2} gap="md" className="w-full">
            {['الف', 'ب', 'ج', 'د'].map((l) => (
              <div
                key={l}
                className="flex h-16 items-center justify-center border border-sand bg-cream text-stone"
              >
                {l}
              </div>
            ))}
          </Grid>
        </Row>
        <Row label="columns 3">
          <Grid columns={3} gap="lg" className="w-full">
            {['یک', 'دو', 'سه', 'چهار', 'پنج', 'شش'].map((l) => (
              <div
                key={l}
                className="flex h-16 items-center justify-center border border-sand bg-cream text-stone"
              >
                {l}
              </div>
            ))}
          </Grid>
        </Row>
        <Row label="columns 4">
          <Grid columns={4} gap="sm" className="w-full">
            {Array.from({ length: 8 }, (_, i) => (
              <div
                key={i}
                className="flex h-12 items-center justify-center border border-sand bg-cream text-small text-stone"
              >
                {i + 1}
              </div>
            ))}
          </Grid>
        </Row>
      </Section>

      <Section
        title="Stack"
        caption="flex عمودی/افقی · gap · align · justify · RTL-native"
      >
        <Row label="col · gap md">
          <Stack gap="md">
            <Badge>مورد اول</Badge>
            <Badge>مورد دوم</Badge>
            <Badge>مورد سوم</Badge>
          </Stack>
        </Row>
        <Row label="row · gap sm · center">
          <Stack direction="row" gap="sm" align="center">
            <Badge variant="success">موجود</Badge>
            <Badge variant="warning">محدود</Badge>
            <Badge variant="error">ناموجود</Badge>
          </Stack>
        </Row>
        <Row label="row · between">
          <Stack direction="row" justify="between" className="w-full">
            <span className="text-small text-stone">شروع</span>
            <span className="text-small text-stone">پایان</span>
          </Stack>
        </Row>
      </Section>

      <Section
        title="Split"
        caption="دو ستونه ۵۰/۵۰ · ۶۰/۴۰ · ۴۰/۶۰ · reverse"
      >
        <Row label="50/50">
          <Split ratio="50/50" gap="lg" className="w-full">
            <div className="flex h-24 items-center justify-center border border-sand bg-cream text-stone">
              ستون اول
            </div>
            <div className="flex h-24 items-center justify-center border border-sand bg-cream text-stone">
              ستون دوم
            </div>
          </Split>
        </Row>
        <Row label="60/40">
          <Split ratio="60/40" gap="md" className="w-full">
            <div className="flex h-24 items-center justify-center border border-sand bg-cream text-stone">
              ۶۰٪
            </div>
            <div className="flex h-24 items-center justify-center border border-sand bg-cream text-stone">
              ۴۰٪
            </div>
          </Split>
        </Row>
        <Row label="40/60 · reverse">
          <Split ratio="40/60" gap="md" reverse className="w-full">
            <div className="flex h-24 items-center justify-center border border-sand bg-cream text-stone">
              ستون A
            </div>
            <div className="flex h-24 items-center justify-center border border-sand bg-cream text-stone">
              ستون B
            </div>
          </Split>
        </Row>
      </Section>
    </div>
  );
}
