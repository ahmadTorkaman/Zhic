'use server';

import { redirect } from 'next/navigation';
import { sendSms, formatInquirySms } from '@zhic/sms';
import { API_URL } from '@/lib/env';
import { fetchAllShowrooms } from '@/lib/payload';
import { validateIranianPhone, normalizePhone } from '@/lib/validation';

export type InquiryState = {
  success: boolean;
  errors?: {
    name?: string;
    phone?: string;
    city?: string;
    reason?: string;
    general?: string;
  };
};

const INITIAL_STATE: InquiryState = { success: false };

export async function submitInquiry(
  _prev: InquiryState,
  formData: FormData,
): Promise<InquiryState> {
  const name = (formData.get('name') as string)?.trim() ?? '';
  const phone = (formData.get('phone') as string)?.trim() ?? '';
  const city = (formData.get('city') as string)?.trim() ?? '';
  const reason = formData.get('reason') as string ?? '';
  const preferredDate = (formData.get('preferred_date') as string)?.trim() ?? '';
  const message = (formData.get('message') as string)?.trim() ?? '';
  const productSlug = (formData.get('product') as string)?.trim() ?? '';
  const showroomSlug = (formData.get('showroom') as string)?.trim() ?? '';

  // --- Validate -----------------------------------------------------------

  const errors: NonNullable<InquiryState['errors']> = {};

  if (!name) errors.name = 'لطفاً نام خود را وارد کنید.';
  if (!phone) {
    errors.phone = 'لطفاً شماره تلفن خود را وارد کنید.';
  } else if (!validateIranianPhone(phone)) {
    errors.phone = 'شماره تلفن معتبر نیست. مثال: ۰۹۱۲۳۴۵۶۷۸۹';
  }
  if (!city) errors.city = 'لطفاً شهر خود را انتخاب کنید.';
  if (!reason || !['price_inquiry', 'showroom_visit'].includes(reason)) {
    errors.reason = 'لطفاً موضوع را انتخاب کنید.';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // --- Create inquiry in Payload -----------------------------------------

  const normalizedPhone = normalizePhone(phone);

  const inquiryData: Record<string, unknown> = {
    name,
    phone: normalizedPhone,
    city,
    reason,
    message: message || undefined,
    preferred_date: preferredDate || undefined,
    status: 'new',
  };

  let showrooms: Awaited<ReturnType<typeof fetchAllShowrooms>> = [];
  try {
    showrooms = await fetchAllShowrooms();
  } catch {
    showrooms = [];
  }

  // Resolve product ID if slug provided
  if (productSlug) {
    try {
      const res = await fetch(
        `${API_URL}/api/products?where[slug][equals]=${encodeURIComponent(productSlug)}&limit=1`,
      );
      if (res.ok) {
        const data = await res.json();
        if (data.docs?.[0]?.id) {
          inquiryData.product = data.docs[0].id;
        }
      }
    } catch {
      // Product lookup failure is non-blocking
    }
  }

  // --- SMS routing --------------------------------------------------------

  const matchedShowroom =
    city !== 'سایر شهرها'
      ? showrooms.find((s) => s.address?.city === city)
      : null;
  const centralShowroom = showrooms.find((s) => s.is_central) ?? showrooms[0] ?? null;
  const routedShowroom = matchedShowroom ?? centralShowroom;

  if (routedShowroom) {
    inquiryData.routed_to = routedShowroom.id;
  }

  // --- Save to Payload ----------------------------------------------------

  try {
    const res = await fetch(`${API_URL}/api/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(inquiryData),
    });

    if (!res.ok) {
      console.error('[submitInquiry] Payload error:', await res.text().catch(() => ''));
      return {
        success: false,
        errors: { general: 'خطا در ثبت استعلام. لطفاً دوباره تلاش کنید.' },
      };
    }
  } catch (err) {
    console.error('[submitInquiry] Payload request failed:', err);
    return {
      success: false,
      errors: { general: 'خطا در ارتباط با سرور. لطفاً دوباره تلاش کنید.' },
    };
  }

  // --- Send SMS (fire-and-forget) ----------------------------------------

  const managerPhone = routedShowroom?.manager_phone;
  if (managerPhone) {
    const smsText = formatInquirySms({
      name,
      phone: normalizedPhone,
      city,
      reason: reason as 'price_inquiry' | 'showroom_visit',
      message: message || undefined,
    });
    sendSms({ to: managerPhone, text: smsText }).catch((err) => {
      console.error('[submitInquiry] SMS dispatch failed:', err);
    });
  }

  // --- Redirect to thank-you ---------------------------------------------

  redirect('/thank-you');
}
