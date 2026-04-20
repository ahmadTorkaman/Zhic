'use client';

import { useActionState } from 'react';
import { useState } from 'react';
import { Button, FormField, Input, Textarea, Select } from '@zhic/ui';
import { GlassCard } from '@/components/shared/GlassCard';
import { submitInquiry, type InquiryState } from '@/app/actions/submitInquiry';

const INITIAL_STATE: InquiryState = { success: false };

export type InquiryFormProps = {
  /** City options. Always include 'سایر شهرها' as the last one for fallback routing. */
  cities: string[];
  /** Optional product slug — renders as hidden input when set. */
  productSlug?: string;
  /** Optional showroom slug — renders as hidden input when set. */
  showroomSlug?: string;
  /** Tone prop kept so the form can be reused on light surfaces too. Default 'dark'. */
  tone?: 'light' | 'dark';
};

export function InquiryForm({ cities, productSlug, showroomSlug, tone = 'dark' }: InquiryFormProps) {
  const [state, formAction, pending] = useActionState(submitInquiry, INITIAL_STATE);
  const [reason, setReason] = useState<string>('');

  const generalError = state.errors?.general;

  return (
    <GlassCard tone={tone}>
      <form action={formAction} aria-busy={pending} noValidate>
        <FormField id="inquiry-name" label="نام و نام خانوادگی" tone={tone} required error={state.errors?.name}>
          <Input id="inquiry-name" name="name" tone={tone} placeholder="مثال: احمد نیوتن" required
                 aria-invalid={state.errors?.name ? true : undefined}
                 aria-describedby={state.errors?.name ? 'inquiry-name-error' : undefined} />
        </FormField>

        <FormField id="inquiry-phone" label="شماره‌ی تماس" tone={tone} required error={state.errors?.phone}>
          <Input id="inquiry-phone" name="phone" tone={tone} type="tel" dir="ltr"
                 placeholder="۰۹۱۲ ۳۴۵ ۶۷۸۹" required
                 aria-invalid={state.errors?.phone ? true : undefined}
                 aria-describedby={state.errors?.phone ? 'inquiry-phone-error' : undefined} />
        </FormField>

        <FormField id="inquiry-city" label="شهر" tone={tone} required error={state.errors?.city}>
          <Select id="inquiry-city" name="city" tone={tone} defaultValue="" required
                  aria-invalid={state.errors?.city ? true : undefined}
                  aria-describedby={state.errors?.city ? 'inquiry-city-error' : undefined}>
            <option value="" disabled>انتخاب شهر</option>
            {cities.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </FormField>

        <FormField id="inquiry-reason" label="موضوع" tone={tone} required error={state.errors?.reason}>
          <Select id="inquiry-reason" name="reason" tone={tone} value={reason} required
                  onChange={(e) => setReason(e.target.value)}
                  aria-invalid={state.errors?.reason ? true : undefined}
                  aria-describedby={state.errors?.reason ? 'inquiry-reason-error' : undefined}>
            <option value="" disabled>انتخاب موضوع</option>
            <option value="price_inquiry">استعلام قیمت</option>
            <option value="showroom_visit">رزرو بازدید از شوروم</option>
          </Select>
        </FormField>

        {reason === 'showroom_visit' ? (
          <FormField id="inquiry-date" label="تاریخ پیشنهادی بازدید" tone={tone} help="تاریخ میلادی — هماهنگی نهایی با شما انجام می‌شود.">
            <Input id="inquiry-date" name="preferred_date" tone={tone} type="date" dir="ltr" />
          </FormField>
        ) : null}

        <FormField id="inquiry-message" label="پیام" tone={tone}>
          <Textarea id="inquiry-message" name="message" tone={tone} rows={4}
                    placeholder="درباره‌ی چه محصولی سؤال دارید؟" />
        </FormField>

        {productSlug ? <input type="hidden" name="product" value={productSlug} /> : null}
        {showroomSlug ? <input type="hidden" name="showroom" value={showroomSlug} /> : null}

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
