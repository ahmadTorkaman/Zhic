'use client';

import { useActionState } from 'react';
import { submitInquiry, type InquiryState } from '@/app/actions/submitInquiry';

const INITIAL: InquiryState = { success: false };

export function HomeInquiryForm() {
  const [state, action, isPending] = useActionState(submitInquiry, INITIAL);

  return (
    <form
      action={action}
      aria-busy={isPending}
      className="rounded-lg border border-ivory/[0.06] bg-ivory/[0.03] p-5 md:p-7"
      style={{ backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)' }}
    >
      {/* Hidden defaults — submitInquiry requires city + reason */}
      <input type="hidden" name="city" value="سایر شهرها" />
      <input type="hidden" name="reason" value="price_inquiry" />

      {state.errors?.general ? (
        <p
          role="alert"
          className="mb-5 rounded-md border border-rust/40 bg-rust/10 p-3 text-small text-ivory"
        >
          {state.errors.general}
        </p>
      ) : null}

      <label className="mb-2 block text-small font-light text-sand" htmlFor="home-inq-name">
        نام و نام خانوادگی
      </label>
      <input
        id="home-inq-name"
        name="name"
        required
        placeholder="مثال: احمد نیوتن"
        aria-invalid={Boolean(state.errors?.name)}
        aria-describedby={state.errors?.name ? 'home-inq-name-error' : undefined}
        className="mb-1 w-full rounded-md border border-ivory/10 bg-transparent px-4 py-[14px] text-body text-ivory placeholder:text-ivory/20 focus:border-forest focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring-color)]"
      />
      {state.errors?.name ? (
        <p id="home-inq-name-error" className="mb-3 text-small text-rust">
          {state.errors.name}
        </p>
      ) : (
        <div className="mb-3" />
      )}

      <label className="mb-2 block text-small font-light text-sand" htmlFor="home-inq-phone">
        شماره‌ی تماس
      </label>
      <input
        id="home-inq-phone"
        name="phone"
        type="tel"
        dir="ltr"
        required
        placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹"
        aria-invalid={Boolean(state.errors?.phone)}
        aria-describedby={state.errors?.phone ? 'home-inq-phone-error' : undefined}
        className="mb-1 w-full rounded-md border border-ivory/10 bg-transparent px-4 py-[14px] text-body text-ivory placeholder:text-ivory/20 focus:border-forest focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring-color)]"
      />
      {state.errors?.phone ? (
        <p id="home-inq-phone-error" className="mb-3 text-small text-rust">
          {state.errors.phone}
        </p>
      ) : (
        <div className="mb-3" />
      )}

      <label className="mb-2 block text-small font-light text-sand" htmlFor="home-inq-message">
        پیام شما
      </label>
      <textarea
        id="home-inq-message"
        name="message"
        rows={4}
        placeholder="درباره‌ی چه محصولی سؤال دارید؟"
        className="mb-5 w-full resize-none rounded-md border border-ivory/10 bg-transparent px-4 py-[14px] text-body text-ivory placeholder:text-ivory/20 focus:border-forest focus:outline-none focus:ring-2 focus:ring-[var(--focus-ring-color)]"
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
