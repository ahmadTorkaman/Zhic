import { toPersianDigits } from '@zhic/locale';
import type { PayloadAddress } from '@/lib/payload';

export type ShowroomAddressBlockProps = {
  address: PayloadAddress | null | undefined;
  /** Show only street + plaque, skip city/postal. Default false. */
  compact?: boolean;
};

export function ShowroomAddressBlock({ address, compact }: ShowroomAddressBlockProps) {
  if (!address) return null;

  const lines: string[] = [];

  if (!compact && address.city) {
    lines.push(
      address.province && address.province !== address.city
        ? `${address.province} — ${address.city}`
        : address.city,
    );
  }

  const streetParts = [address.district, address.street].filter(Boolean) as string[];
  if (streetParts.length) lines.push(streetParts.join('، '));

  const plaqueParts = [
    address.plaque ? `پلاک ${toPersianDigits(address.plaque)}` : null,
    address.unit ? `واحد ${toPersianDigits(address.unit)}` : null,
  ].filter(Boolean) as string[];
  if (plaqueParts.length) lines.push(plaqueParts.join('، '));

  if (!compact && address.postalCode) {
    lines.push(`کدپستی: ${toPersianDigits(address.postalCode)}`);
  }

  return (
    <address className="not-italic text-small font-light leading-[1.6] text-stone">
      {lines.map((line, i) => (
        <div key={i}>{line}</div>
      ))}
    </address>
  );
}
