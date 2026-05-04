'use client';

import { useActionState } from 'react';
import { Button, FormField, Input, Textarea } from '@zhic/ui';
import { GlassCard } from '@/components/shared/GlassCard';
import { submitInquiry, type InquiryState } from '@/app/actions/submitInquiry';

const INITIAL_STATE: InquiryState = { success: false };

export type InquiryFormSlimProps = {
  /** Tone prop kept consistent with InquiryForm. Default 'dark'. */
  tone?: 'light' | 'dark';
};

export function InquiryFormSlim({ tone = 'dark' }: InquiryFormSlimProps) {
  const [state, formAction, pending] = useActionState(submitInquiry, INITIAL_STATE);
  const generalError = state.errors?.general;

  return (
    <GlassCard tone={tone}>
      <form action={formAction} aria-busy={pending} noValidate>
        <FormField id="inquiry-slim-name" label="نام و نام خانوادگی" tone={tone} required error={state.errors?.name}>
          <Input id="inquiry-slim-name" name="name" tone={tone} placeholder="مثال: احمد نیوتن" required
                 aria-invalid={state.errors?.name ? true : undefined}
                 aria-describedby={state.errors?.name ? 'inquiry-slim-name-error' : undefined} />
        </FormField>

        <FormField id="inquiry-slim-phone" label="شماره‌ی تماس" tone={tone} required error={state.errors?.phone}>
          <Input id="inquiry-slim-phone" name="phone" tone={tone} type="tel" dir="ltr"
                 placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹" required
                 aria-invalid={state.errors?.phone ? true : undefined}
                 aria-describedby={state.errors?.phone ? 'inquiry-slim-phone-error' : undefined} />
        </FormField>

        <FormField id="inquiry-slim-message" label="پیام شما" tone={tone}>
          <Textarea id="inquiry-slim-message" name="message" tone={tone} rows={3}
                    placeholder="درباره‌ی چه محصولی سؤال دارید؟" />
        </FormField>

        <input type="hidden" name="city" value="سایر شهرها" />
        <input type="hidden" name="reason" value="price_inquiry" />

        {generalError ? (
          <p role="alert" className="mb-4 text-small text-rust">{generalError}</p>
        ) : null}

        <Button variant="accent" size="md" type="submit" disabled={pending} aria-busy={pending} className="w-full">
          {pending ? 'در حال ارسال...' : 'ارسال پیام'}
        </Button>
      </form>
    </GlassCard>
  );
}
