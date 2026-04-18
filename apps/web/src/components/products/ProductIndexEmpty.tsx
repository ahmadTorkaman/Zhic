import { Button, Stack } from '@zhic/ui';

type Props = {
  resetHref: string;
};

export function ProductIndexEmpty({ resetHref }: Props) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center py-12">
      <Stack gap="md" align="center">
        <h2 className="text-h3 font-bold text-charcoal">
          موردی با این فیلترها یافت نشد
        </h2>
        <p className="text-body text-stone text-center max-w-prose">
          می‌توانید فیلترها را پاک کنید و دوباره امتحان کنید.
        </p>
        <Button as="a" href={resetHref} variant="secondary" size="md">
          پاک کردن فیلترها
        </Button>
      </Stack>
    </div>
  );
}
