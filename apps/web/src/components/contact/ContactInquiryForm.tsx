'use client';

import { useActionState, useState } from 'react';
import { submitInquiry, type InquiryState } from '@/app/actions/submitInquiry';

const INITIAL: InquiryState = { success: false };

type Props = {
  cities: string[];
  defaultCity?: string;
  defaultReason?: 'price_inquiry' | 'showroom_visit';
  defaultProduct?: string;
  defaultShowroom?: string;
};

export function ContactInquiryForm({
  cities,
  defaultCity,
  defaultReason,
  defaultProduct,
  defaultShowroom,
}: Props) {
  const [state, action, isPending] = useActionState(submitInquiry, INITIAL);
  const [reason, setReason] = useState(defaultReason ?? '');

  const inputClass =
    'w-full rounded-md border border-ivory/10 bg-transparent px-4 py-[14px] text-body text-ivory placeholder:text-ivory/20 focus:border-forest focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring-color)]';
  const labelClass = 'mb-2 block text-small font-light text-sand';

  return (
    <form
      action={action}
      aria-busy={isPending}
      className="rounded-lg border border-ivory/[0.06] bg-ivory/[0.03] p-7"
      style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      <h2 className="mb-5 text-h4 font-bold text-ivory">ارسال پیام</h2>

      {defaultProduct ? <input type="hidden" name="product" value={defaultProduct} /> : null}
      {defaultShowroom ? <input type="hidden" name="showroom" value={defaultShowroom} /> : null}

      {state.errors?.general ? (
        <p
          role="alert"
          className="mb-5 rounded-md border border-rust/40 bg-rust/10 p-3 text-small text-ivory"
        >
          {state.errors.general}
        </p>
      ) : null}

      <label className={labelClass} htmlFor="contact-name">نام و نام خانوادگی</label>
      <input
        id="contact-name"
        name="name"
        required
        placeholder="مثال: احمد نیوتن"
        aria-invalid={Boolean(state.errors?.name)}
        aria-describedby={state.errors?.name ? 'contact-name-error' : undefined}
        className={`${inputClass} mb-1`}
      />
      {state.errors?.name ? (
        <p id="contact-name-error" className="mb-3 text-small text-rust">{state.errors.name}</p>
      ) : (
        <div className="mb-3" />
      )}

      <label className={labelClass} htmlFor="contact-phone">شماره‌ی تماس</label>
      <input
        id="contact-phone"
        name="phone"
        type="tel"
        dir="ltr"
        required
        placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
        aria-invalid={Boolean(state.errors?.phone)}
        aria-describedby={state.errors?.phone ? 'contact-phone-error' : undefined}
        className={`${inputClass} mb-1`}
      />
      {state.errors?.phone ? (
        <p id="contact-phone-error" className="mb-3 text-small text-rust">{state.errors.phone}</p>
      ) : (
        <div className="mb-3" />
      )}

      <label className={labelClass} htmlFor="contact-city">شهر</label>
      <select
        id="contact-city"
        name="city"
        required
        defaultValue={defaultCity ?? ''}
        aria-invalid={Boolean(state.errors?.city)}
        aria-describedby={state.errors?.city ? 'contact-city-error' : undefined}
        className={`${inputClass} mb-1`}
      >
        <option value="" disabled>انتخاب کنید</option>
        {cities.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
        <option value="سایر شهرها">سایر شهرها</option>
      </select>
      {state.errors?.city ? (
        <p id="contact-city-error" className="mb-3 text-small text-rust">{state.errors.city}</p>
      ) : (
        <div className="mb-3" />
      )}

      <label className={labelClass} htmlFor="contact-reason">موضوع</label>
      <select
        id="contact-reason"
        name="reason"
        required
        defaultValue={defaultReason ?? ''}
        onChange={(e) => setReason(e.target.value)}
        aria-invalid={Boolean(state.errors?.reason)}
        aria-describedby={state.errors?.reason ? 'contact-reason-error' : undefined}
        className={`${inputClass} mb-1`}
      >
        <option value="" disabled>انتخاب کنید</option>
        <option value="price_inquiry">استعلام قیمت</option>
        <option value="showroom_visit">رزرو بازدید از شوروم</option>
      </select>
      {state.errors?.reason ? (
        <p id="contact-reason-error" className="mb-3 text-small text-rust">{state.errors.reason}</p>
      ) : (
        <div className="mb-3" />
      )}

      {reason === 'showroom_visit' ? (
        <>
          <label className={labelClass} htmlFor="contact-date">تاریخ ترجیحی بازدید</label>
          <input
            id="contact-date"
            name="preferred_date"
            placeholder="مثال: هفته‌ی اول خرداد"
            className={`${inputClass} mb-3`}
          />
        </>
      ) : null}

      <label className={labelClass} htmlFor="contact-message">پیام</label>
      <textarea
        id="contact-message"
        name="message"
        rows={4}
        placeholder="درباره‌ی چه محصولی سؤال دارید؟"
        className={`${inputClass} mb-5 resize-none`}
      />

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-md bg-forest px-4 py-4 text-small font-bold text-ivory transition-all duration-[var(--dur-hover)] ease-[var(--ease-out-soft)] hover:-translate-y-px hover:shadow-[0_8px_32px_color-mix(in_srgb,var(--color-forest)_25%,transparent)] focus-ring-invert disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'در حال ارسال…' : 'ارسال پیام'}
      </button>
    </form>
  );
}
