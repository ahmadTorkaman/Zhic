import { toPersianDigits } from '@zhic/locale';
import type { PayloadShowroom } from '@/lib/payload';

type Props = {
  showroom: PayloadShowroom;
};

export function ShowroomAddressBlock({ showroom }: Props) {
  const a = showroom.address;
  if (!a) return null;
  const lineParts = [a.district, a.street, a.plaque ? `پلاک ${a.plaque}` : null, a.unit ? `واحد ${a.unit}` : null]
    .filter(Boolean)
    .join('، ');
  const cityLine = [a.city, a.province && a.province !== a.city ? a.province : null]
    .filter(Boolean)
    .join('، ');
  return (
    <address className="not-italic flex flex-col gap-1 text-body text-stone">
      {cityLine ? <span className="text-charcoal">{cityLine}</span> : null}
      {lineParts ? <span>{lineParts}</span> : null}
      {a.postalCode ? (
        <span dir="ltr" className="text-small">
          کد پستی: {toPersianDigits(a.postalCode)}
        </span>
      ) : null}
      {a.notes ? <span className="text-small">{a.notes}</span> : null}
    </address>
  );
}
