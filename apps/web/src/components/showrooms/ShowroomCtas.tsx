import { Button, Stack } from '@zhic/ui';
import type { PayloadShowroom } from '@/lib/payload';
import { classifyPhone } from '@zhic/locale';

type Props = {
  showroom: PayloadShowroom;
};

function mapHref(showroom: PayloadShowroom): string | null {
  if (showroom.neshanProfileUrl) return showroom.neshanProfileUrl;
  if (showroom.googleBusinessProfileUrl) return showroom.googleBusinessProfileUrl;
  if (
    showroom.geo &&
    typeof showroom.geo.lat === 'number' &&
    typeof showroom.geo.lng === 'number'
  ) {
    return `https://neshan.org/maps#c${showroom.geo.lat}-${showroom.geo.lng}-15z-0p`;
  }
  return null;
}

export function ShowroomCtas({ showroom }: Props) {
  const phone = showroom.phone ? classifyPhone(showroom.phone) : null;
  const map = mapHref(showroom);
  const visit = `/contact?showroom=${encodeURIComponent(showroom.slug)}&reason=visit`;
  return (
    <Stack gap="sm">
      {phone ? (
        <Button as="a" href={`tel:${phone.e164}`} variant="primary" size="lg">
          تماس با شوروم
        </Button>
      ) : null}
      <Button as="a" href={visit} variant="secondary" size="md">
        رزرو بازدید
      </Button>
      {map ? (
        <Button as="a" href={map} variant="ghost" size="md" target="_blank" rel="noreferrer">
          مسیریابی
        </Button>
      ) : null}
    </Stack>
  );
}
