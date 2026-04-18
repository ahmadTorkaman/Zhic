'use client';

import { useActionState, useState } from 'react';
import { Button, FormField, Input, Select, Stack, Textarea } from '@zhic/ui';
import { submitInquiry, type InquiryState } from '@/app/actions/submitInquiry';

export type InquiryFormProps = {
  cities: string[];
  defaultCity?: string;
  defaultReason?: 'price_inquiry' | 'showroom_visit';
  defaultProduct?: string;
  defaultShowroom?: string;
};

const INITIAL: InquiryState = { success: false };

export function InquiryForm({
  cities,
  defaultCity,
  defaultReason,
  defaultProduct,
  defaultShowroom,
}: InquiryFormProps) {
  const [state, action, isPending] = useActionState(submitInquiry, INITIAL);
  const [reason, setReason] = useState(defaultReason ?? '');

  return (
    <div className="rounded-xl border border-sand bg-ivory p-8">
      <form action={action}>
        <Stack gap="md">
          <h2 className="text-h3 font-bold text-charcoal">فرم تماس</h2>

          {state.errors?.general ? (
            <p role="alert" className="rounded-md bg-rust/10 p-3 text-small text-rust">
              {state.errors.general}
            </p>
          ) : null}

          {defaultProduct ? (
            <input type="hidden" name="product" value={defaultProduct} />
          ) : null}
          {defaultShowroom ? (
            <input type="hidden" name="showroom" value={defaultShowroom} />
          ) : null}

          <FormField label="نام و نام خانوادگی" required error={state.errors?.name}>
            <Input name="name" required />
          </FormField>

          <FormField
            label="شماره تلفن"
            required
            help="مثال: ۰۹۱۲۳۴۵۶۷۸۹"
            error={state.errors?.phone}
          >
            <Input name="phone" type="tel" dir="ltr" required />
          </FormField>

          <FormField label="شهر" required error={state.errors?.city}>
            <Select name="city" required defaultValue={defaultCity ?? ''}>
              <option value="" disabled>
                انتخاب کنید
              </option>
              {cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
              <option value="سایر شهرها">سایر شهرها</option>
            </Select>
          </FormField>

          <FormField label="موضوع" required error={state.errors?.reason}>
            <Select
              name="reason"
              required
              defaultValue={defaultReason ?? ''}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="" disabled>
                انتخاب کنید
              </option>
              <option value="price_inquiry">استعلام قیمت</option>
              <option value="showroom_visit">رزرو بازدید از شوروم</option>
            </Select>
          </FormField>

          {reason === 'showroom_visit' ? (
            <FormField label="تاریخ ترجیحی بازدید" help="مثال: هفته‌ی اول خرداد">
              <Input name="preferred_date" />
            </FormField>
          ) : null}

          <FormField label="پیام (اختیاری)">
            <Textarea name="message" rows={3} />
          </FormField>

          <Button type="submit" disabled={isPending}>
            {isPending ? 'در حال ارسال…' : 'ارسال استعلام'}
          </Button>
        </Stack>
      </form>
    </div>
  );
}
