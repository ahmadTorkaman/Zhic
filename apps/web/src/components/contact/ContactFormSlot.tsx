import { Stack } from '@zhic/ui';

/**
 * Placeholder for the unified inquiry form. Lands in Session 5.1, which will
 * read the same `?product=&reason=` and `?showroom=&reason=` query params that
 * 3.2 PDP and 3.3 ShowroomDetail link with.
 */
export function ContactFormSlot() {
  return (
    <div className="rounded-xl border border-sand bg-ivory p-8">
      <Stack gap="md">
        <h2 className="text-h3 font-bold text-charcoal">فرم تماس</h2>
        <p className="text-body text-stone max-w-prose">
          فرم تماس ما در حال آماده‌سازی است و به‌زودی فعال می‌شود. تا آن
          زمان، لطفاً از طریق تماس تلفنی یا ایمیل با ما در ارتباط باشید —
          همکاران ژیک در ساعات کاری پاسخ‌گوی شما هستند.
        </p>
      </Stack>
    </div>
  );
}
