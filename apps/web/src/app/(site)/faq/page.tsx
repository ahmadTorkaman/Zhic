import { Container, Breadcrumbs } from '@zhic/ui';
import { FaqAccordion } from '@/components/faq/FaqAccordion';
import { fetchFaq, type PayloadFaqItem } from '@/lib/payload';

const FALLBACK_ITEMS: PayloadFaqItem[] = [
  {
    question: 'آیا امکان سفارش اندازه‌ی سفارشی وجود دارد؟',
    answer: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'بله، بسیاری از محصولات ما قابلیت سفارشی‌سازی ابعاد را دارند. لطفاً از طریق فرم تماس اندازه‌ی مورد نظرتان را بنویسید تا تیم ما راهنمایی کند.',
              },
            ],
          },
        ],
      },
    },
  },
  {
    question: 'زمان تحویل سفارش چقدر است؟',
    answer: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'بسته به محصول، بین ۱۴ تا ۴۵ روز کاری. محصولات موجود سریع‌تر و سفارشی‌ها زمان بیش‌تری نیاز دارند.',
              },
            ],
          },
        ],
      },
    },
  },
  {
    question: 'هزینه‌ی ارسال چقدر است؟',
    answer: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'ارسال به سراسر ایران رایگان است. بسته‌بندی ویژه و بیمه‌ی حمل در قیمت لحاظ شده.',
              },
            ],
          },
        ],
      },
    },
  },
  {
    question: 'گارانتی محصولات شامل چه مواردی می‌شود؟',
    answer: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'تمام محصولات ژیک ۳ سال گارانتی سازه و ۲ سال گارانتی پوشش (رنگ و روغن) دارند. آسیب‌های ناشی از استفاده‌ی نادرست شامل نمی‌شود.',
              },
            ],
          },
        ],
      },
    },
  },
  {
    question: 'آیا امکان بازدید از کارگاه وجود دارد؟',
    answer: {
      root: {
        type: 'root',
        children: [
          {
            type: 'paragraph',
            children: [
              {
                type: 'text',
                text: 'بله، با هماهنگی قبلی می‌توانید از کارگاه ما در همدان بازدید کنید. لطفاً از طریق فرم تماس درخواست بدهید.',
              },
            ],
          },
        ],
      },
    },
  },
];

export function generateMetadata() {
  return {
    title: 'پرسش‌های متداول',
    description: 'پاسخ پرسش‌های رایج درباره‌ی سفارش، تحویل، گارانتی و بازدید از کارگاه ژیک.',
  };
}

export default async function FaqPage() {
  const faq = await fetchFaq();
  const items = faq?.items && faq.items.length > 0 ? faq.items : FALLBACK_ITEMS;

  return (
    <>
      <Container>
        <div className="pt-[calc(var(--header-height)+var(--space-5))]">
          <Breadcrumbs items={[{ label: 'خانه', href: '/' }, { label: 'پرسش‌های متداول' }]} />
        </div>
        <div className="mx-auto max-w-[680px] pb-[var(--space-9)] pt-[var(--space-7)]">
          <h1 className="mb-[var(--space-7)] text-h2 font-black text-ink">
            {faq?.title ?? 'پرسش‌های متداول'}
          </h1>
          <FaqAccordion items={items} />
        </div>
      </Container>
    </>
  );
}
