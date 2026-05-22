'use client';

import { PickerBar, type PickerBarProps } from './PickerBar';

type Props = Omit<PickerBarProps, 'onInquiry'> & { thankYouPath?: string };

export function InquiryHandler({ thankYouPath = '/thank-you', ...rest }: Props) {
  const submit = async (payload: Parameters<NonNullable<PickerBarProps['onInquiry']>>[0]) => {
    const params = new URLSearchParams();
    params.set('product', String(payload.productId));
    if (payload.variantId !== null) params.set('variant', String(payload.variantId));
    for (const [k, v] of Object.entries(payload.selectedAxes)) params.set(`axis_${k}`, v);
    window.location.assign(`/contact?${params.toString()}`);
  };

  return <PickerBar {...rest} onInquiry={submit} />;
}
