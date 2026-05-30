#!/usr/bin/env python3
"""
Seed 12 short filler articles so the homepage HomeJournalRows + /journal
have enough content to scroll/parallax convincingly. Idempotent on slug.

Each article gets a brief Lexical body (one paragraph), Persian title +
excerpt, rotated through the 4 existing categories + 3 authors, and a
published_at staggered backwards from today.

Usage: python3 services/api/scripts/seed-filler-articles.py
"""

from datetime import datetime, timedelta, timezone
import psycopg2
from psycopg2.extras import Json

DATABASE_URI = 'postgresql://zhic:zhic_staging_pw_2026@127.0.0.1:5433/zhic'

ARTICLES = [
    ('تخت‌خوابی برای دو نسل',
     'tahkhab-baray-do-nasl',
     'تختی که از مادر به فرزند می‌رسد، یک قطعه‌ی اثاثیه نیست؛ راوی است.',
     'سبک زندگی', 'team-zhic'),
    ('هندسه‌ی منبت در طراحی امروز',
     'handese-monabbat-tarrahi-emrooz',
     'نقش‌هایی که از اصفهان آمده‌اند، حالا در خطوط ساده‌ی مدرن جا گرفته‌اند.',
     'متریال‌شناسی', 'sara-ahmadi'),
    ('چرا چوب گردوی ایرانی؟',
     'cheraa-choob-gerdoo-irani',
     'بافت تیره، رگه‌های موج‌دار و قدرت ساختاری چوب گردوی همدان.',
     'متریال‌شناسی', 'team-zhic'),
    ('اتاق دوستانه برای دو فرزند',
     'otaagh-dostane-do-farzand',
     'وقتی دو فرزند یک اتاق را شریک می‌شوند، تخت دوطبقه فقط اول راه است.',
     'سبک زندگی', 'sara-ahmadi'),
    ('کمد و حافظه — درس‌هایی از سنت',
     'komod-haafeze-sonnat',
     'صندوقچه‌ی جهیزیه‌ی مادربزرگ، الگوی پنهان همه‌ی کمدهای امروز.',
     'سبک زندگی', 'team-zhic'),
    ('روایت یک سرویس از ابتدا تا نصب',
     'ravayat-yek-servis-ebteda-ta-nasb',
     'از انتخاب چوب تا روزی که تخت در اتاق خواب مشتری مستقر می‌شود.',
     'بلاگ', 'team-zhic'),
    ('آرامش در نور صبحگاهی',
     'aramesh-noor-sobhgaahi',
     'چیدمان اتاق خواب باید با مسیر نور صبح هم‌خوان باشد.',
     'سبک زندگی', 'sara-ahmadi'),
    ('پایداری چوب — انتخاب درست',
     'paayedaari-choob-entekhaab-dorost',
     'تفاوت بین چوب خشک‌شده‌ی صحیح و چوب نیمه‌خشک، در سال‌های بعد آشکار می‌شود.',
     'مراقبت و نگهداری', 'team-zhic'),
    ('کلکسیون بهار: الهام از باغ ایرانی',
     'colection-bahaar-elham-bagh-irani',
     'گل‌های نقاشی‌شده روی قاب آینه، طرحی از حوض‌ها و باغ‌های قدیم.',
     'بلاگ', 'sara-ahmadi'),
    ('سه نکته در انتخاب پاتختی',
     'se-nokte-entekhaab-paatakhti',
     'ارتفاع، نسبت با تخت، و فاصله از دیوار — جزئیاتی که چیدمان را می‌سازد.',
     'سبک زندگی', 'team-zhic'),
    ('اتاق نوجوان — فضای رشد',
     'otaagh-nojavaan-fazaaye-roshd',
     'فضای خواب نوجوان باید با تغییر سلیقه‌اش رشد کند، نه اینکه عوض شود.',
     'سبک زندگی', 'sara-ahmadi'),
    ('روایت کارگاه: یک هفته با استادکارها',
     'ravayat-kargah-hafte-baa-ostadkaar',
     'پشت هر قطعه‌ی ژیک، دستی هست که سال‌ها چوب را شناخته.',
     'بلاگ', 'team-zhic'),
]


def lexical_body(excerpt: str, title: str) -> dict:
    return {
        'root': {
            'type': 'root', 'format': '', 'indent': 0, 'version': 1,
            'children': [
                {'type': 'paragraph', 'format': '', 'indent': 0, 'version': 1,
                 'children': [{'mode': 'normal', 'text': excerpt + ' این یک مقاله‌ی نمونه است که برای نمایش چیدمان صفحه استفاده می‌شود.', 'type': 'text', 'style': '', 'detail': 0, 'format': 0, 'version': 1}],
                 'direction': 'rtl'},
            ],
            'direction': 'rtl',
        }
    }


CATEGORY_BY_NAME = {
    'مراقبت و نگهداری': 4,
    'سبک زندگی': 3,
    'متریال‌شناسی': 2,
    'بلاگ': 1,
}
AUTHOR_BY_SLUG = {'admin': 1, 'team-zhic': 2, 'sara-ahmadi': 3}


def main():
    conn = psycopg2.connect(DATABASE_URI)
    cur = conn.cursor()

    inserted = skipped = 0
    base_date = datetime(2026, 5, 20, tzinfo=timezone.utc)

    for i, (title, slug, excerpt, cat_name, author_slug) in enumerate(ARTICLES):
        cur.execute('SELECT id FROM articles WHERE slug = %s', (slug,))
        if cur.fetchone():
            skipped += 1
            print(f'  - skip (exists): {slug}')
            continue
        body = lexical_body(excerpt, title)
        published_at = (base_date - timedelta(days=i * 3)).isoformat()
        now = datetime.now(timezone.utc).isoformat()
        cur.execute(
            """
            INSERT INTO articles (
                title, slug, body, excerpt, cover_id, author_id, category_id,
                status, published_at, featured, reading_time_minutes,
                created_at, updated_at
            ) VALUES (%s, %s, %s, %s, NULL, %s, %s, 'published', %s, FALSE, %s, %s, %s)
            RETURNING id
            """,
            (title, slug, Json(body), excerpt,
             AUTHOR_BY_SLUG[author_slug], CATEGORY_BY_NAME[cat_name],
             published_at, 1, now, now),
        )
        new_id = cur.fetchone()[0]
        inserted += 1
        print(f'  + article[{new_id}] {slug}  ({cat_name} / {author_slug})')

    conn.commit()
    cur.close()
    conn.close()
    print(f'\nDone. Inserted {inserted}, skipped {skipped}.')


if __name__ == '__main__':
    main()
