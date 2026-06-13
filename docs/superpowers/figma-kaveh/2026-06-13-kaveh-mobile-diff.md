# Kaveh (mobile 402px) ↔ Live Homepage — Section Diff

**Date:** 2026-06-13
**Design source:** Figma frame **`19:120` "Kaveh"**, **402 × 4480 px** (mobile), read live via the local Dev Mode MCP server (no rate limit). Frame uses **raw values, no variables**.
**Code source:** [2026-06-13-current-code-inventory.md](2026-06-13-current-code-inventory.md) (current `feat/figma-homepage-alignment` branch).
**Headline finding:** Kaveh is a **mobile** comp. Palette already matches tokens (forest `#5F7760` exact, ivory `#FAFAF6`≈`#FAFAF7`, forest-dark `#2E3B2F`≈`#2D3A2E`, gold `#C2986B`≈`#C49A6C`). So the gaps are **content + mobile type scale + a few layout details**, not the design system.

## Kaveh mobile type scale (exact, from design-context)
| Role | Kaveh px | leading | tracking | color | Code mobile (clamp floor) | Δ |
|---|---|---|---|---|---|---|
| Hero headline | **38.5** | 1.4 | −0.77px (−.02em) | forest `#5f7760` | `--home-t1` 40px | ~match |
| About heading | **32.2** | 1.49 | — | dark | `--home-t2` 36px | code bigger |
| Section/band titles, stat #s | **23.45** | 1.49 | −0.47px | `#212121` | `--home-t3` 32px | **code much bigger** |
| «زیبایی» | **35.0** | — | −0.70px | `#657767` (muted forest) | t1, forest `#5F7760` | size+color Δ |
| Eyebrows (دسته سنی / نمایندگی‌ها) | **11.9** | normal | — | forest `#5f7760` | `--home-t6` 16px | **code bigger** |
| Card titles / labels | 8.3 / 7.5 | — | — | — | t7 14px | code bigger |

➡️ **Systematic finding:** the homepage's mobile clamp **floors were derived from the 1920 desktop ref and are too large** for Kaveh. Bringing the `--home-t*` mobile floors down (hero≈38, headings≈23, eyebrow≈12) is the single biggest visual-fidelity fix. (Token-respecting: adjust the clamp min, never hardcode px.)

---

## Section-by-section

### 1. Header — ✅ matches
Pill bar (Kaveh 376×43 ≈ code mobile pill 44px), hamburger (3 lines) + centered logo + search. No change.

### 2. Hero — content deltas
| | Kaveh | Code | Action |
|---|---|---|---|
| Layout | photo (402×533) then text below | stacked (media→text) | ✅ match |
| Headline | «خواب خوب،تمام ماجــــــراست» forest, gold comma | same | ✅ |
| **Subtitle** | **«تولیدی سرویس خواب و وسایل اتاق خواب، با ارسال به سراسر ایران»** | *not rendered* (dead prop) | **ADD — render subheading** |
| **CTA label** | **«مشاهده‌ سرویس خواب»** | «مشاهده‌ی محصولات» | **CHANGE text** (full-width dark bar otherwise matches) |

### 3. Age bands — content + order deltas
Three stacked bands (image + eyebrow + title + subtitle + «مشاهده» + green Vector accent). Order in Kaveh: **دو نفره → کودک → نوجوان**.
| Band | Kaveh title | Kaveh subtitle |
|---|---|---|
| 1 (double/adult) | «سرویس خواب دو نفره» | «مدلهای سرویس خواب دو نفره‌ی هماهنگ، شامل تخت، پاتختی و میز آرایش؛ چوبی و ام دی اف، برای آرامش بلندمدت اتاق خواب شما.» |
| 2 (kid) | «سرویس خواب کودک» | «سرویس خواب کودک با قطعات ایمن و رنگ های آرام؛ طراحی ‌شده تا همراه رشد کودک، از نوزادی تا کودکی بماند.» |
| 3 (teen) | «سرویس خواب نوجوان» | «سرویس خواب نوجوان با طراحی منعطف؛ از تخت و میز تحریر تا کتابخانه، مناسب سالهای درس و مطالعه.» |
- **Titles/subtitles are CMS-driven in code** → set seed/CMS `name`+`tagline` to the above (or override). Kaveh names use "سرویس خواب X" not the room name.
- **Eyebrow:** Kaveh «دسته سنی» (no ezafe); code «دسته‌ی سنی». *Band 3 eyebrow in Kaveh reads «اتاق نوجوان» — likely a design typo; recommend «دسته سنی» on all 3.* → **Decision: keep code's grammatically-correct «دسته‌ی سنی»? or match Kaveh «دسته سنی»?**
- «مشاهده» CTA ✅ matches.

### 4. Stats + About (dark band) — biggest content deltas
**Floating stat card (370×140), 3 stats + vertical dividers:**
| | Kaveh | Code | Type |
|---|---|---|---|
| Stat 1 | **+25** «سال تجربه در صنایع چوب» | 25+ same label | ✅ number matches |
| Stat 2 | **+1200** «قطعه سرویس خواب تولید شده» | **570430+** «قطعه مبلمان تولیدشده» | ⚠️ **business number + wording** |
| Stat 3 | **3** «شعب در سراسر ایران» | **22** «شعبه در سراسر ایران» | ⚠️ **business number + شعب/شعبه** |

**About block:**
| | Kaveh | Code | |
|---|---|---|---|
| Eyebrow | «درباره‌ی ژیک» | same | ✅ |
| Heading | **«از کارخونه،تا خونه»** (32px, colloquial خونه) | «از همدان، برای ایران» | ⚠️ different |
| Body | one block: «شرکت هنر چوب ژیک، تولیدی سرویس خواب و وسایل اتاق خواب است. ما هر تخت، پاتختی، میز آرایش و کمد را از چوب و ام‌دی‌اف باکیفیت با روکش وکیوم می‌سازیم و بدون واسطه، مستقیم از کارخانه به دست شما می‌رسانیم. باور ما این است که اتاق خواب آرام‌ترین گوشه‌ی خانه است؛ … نه بیشتر از آنچه لازم است می‌سازیم، نه کمتر از آنچه شایسته است. سرویس خواب ژیک همواره با گارانتی و ارسال به سراسر ایران عرضه می‌شود.» | different 3-paragraph «ژیک از همدان آغاز شده است…» | ⚠️ different story |
| CTA | «بیشتر درباره‌ی ما» | «بیش‌تر درباره‌ی ما» (ZWNJ) | minor |

### 5. Journal — content + framing delta
| | Kaveh | Code | |
|---|---|---|---|
| Eyebrow | «ژورنال ژیک» | same | ✅ |
| Heading | **«راهنمای خرید و چیدمان اتاق خواب»** (reframes as buying-guide) | «از کارگاه، از همدان» | ⚠️ different |
| Lead | «از انتخاب سرویس خواب تا چیدمان اتاق کودک و نوجوان؛ راهنماهایی که خرید را برای شما ساده می‌کنند.» | «یادداشت‌هایی از پشت‌صحنه‌ی ساخت…» | ⚠️ different |
| Cards | horizontal rows, card 188×106 (≈16:9), category «ژورنال ژیک» + title «طراحی اتاق خواب آرام اصولی و ایده ها» | parallax rows, 16:9 cover, title below | ✅ structure ~matches |
| CTA | «همه ی مقالات» | «همه‌ی مقالات» | minor (space vs ZWNJ) |

### 6. Showrooms — one addition
| | Kaveh | Code | Action |
|---|---|---|---|
| Eyebrow | «نمایندگی‌ها» | same | ✅ |
| Heading | «ما را در شهر خودتان ببینید» | same | ✅ |
| **Lead** | **«سرویس خواب ژیک را از نزدیک در شعب ما ببینید.»** | *none* | **ADD lead** |
| Cards | 3 × (126×168, ≈3:4): همدان / اراک / ساری | CMS cities, 3:4 | ⚠️ Kaveh illustrative vs CMS real |
| Expand | «فهرست کامل» | same | ✅ |
| Seam ribbon | Vector 6 383×16 | same | ✅ |

### 7. Consultation CTA — color nuance only
All copy matches («زیبایی» / «از یک انتخاب ساده آغاز می‌شود» / «مشاوره تخصصی برای خرید سرویس خواب مناسب» / «دریافت مشاوره رایگان»). **«زیبایی» color in Kaveh = `#657767` (muted forest-gray), 35px** — code uses pure forest `#5F7760`. → nudge «زیبایی» to `#657767`. **This resolves the forest-vs-gold-vs-gray debate: Kaveh = muted forest.**

### 8. Footer — ✅ near-exact
Columns match: **برند** (درباره ما / سوالات متداول / مجله) and **فروشگاه** (سرویس خواب / تخت خواب / کمد و دراور / اکسسوری) are exact. **ارتباط با ما** in Kaveh = اینستاگرام / تلگرام / تلفن (code adds خبرنامه + more socials — keep, real functionality). Tagline «ساخته شده برای ماندن», SINCE 2008, pitch, copyright all match. Optional: add brand descriptor «ژیک — تولیدی سرویس خواب و وسایل اتاق خواب» under the logo.

---

## Business-data conflicts (need operator — Kaveh may be placeholder)
1. **Stat #2 count + noun:** Kaveh `+1200 قطعه سرویس خواب` vs code `570430+ قطعه مبلمان`. Real number?
2. **Stat #3 count + word:** Kaveh `3 شعب` vs code `22 شعبه`. How many branches, and شعب vs شعبه?
3. **Showroom cities:** Kaveh همدان/اراک/ساری (illustrative) vs code CMS real data.

## Pure-content adoptions (match Kaveh unless flagged above)
Hero subtitle (add) · hero CTA «مشاهده‌ سرویس خواب» · band titles/subtitles · about heading «از کارخونه،تا خونه» · about body (Kaveh story) · journal heading/lead (buying-guide framing) · showroom lead (add) · «زیبایی» → `#657767`.

## Layout/type fixes (token-respecting)
- Lower `--home-t*` **mobile clamp floors** to Kaveh (hero≈38, headings≈23, about≈32, eyebrow≈12, card≈8). Keep desktop maxes.
- Hero leading 1.4 (code 1.45).
- Band 1 leads with «دو نفره» (double) — confirm band order.

## Implemented — 2026-06-13 (operator decisions applied)
Decisions: stats **keep real data** (570430+/22) · showroom cities **keep CMS** · editorial copy **adopt Kaveh**.

| Change | File | Status |
|---|---|---|
| `--home-t1..t6` mobile floors → Kaveh (38/32/23/19/15/12px); desktop maxes untouched | `packages/design-system/css/tokens.css` | ✅ |
| Hero: render subtitle (node 19:257); CTA → «مشاهده‌ی سرویس خواب»; heading leading 1.45→1.4 | `HomeHeroCarousel.tsx`, `home-hero-carousel.css` | ✅ |
| About: heading → «از کارخونه،تا خونه»; body → Kaveh story (node 19:131, kashida stripped, ZWNJ normalized, 3 staggered paras) | `HomeBrandStatement.tsx` | ✅ |
| Stats: **unchanged** (kept 570430+ / 22 شعبه per decision) | — | ✅ by decision |
| Journal: heading → «راهنمای خرید و چیدمان اتاق خواب»; lead → Kaveh buying-guide lead | `HomeJournalRows.tsx` | ✅ |
| Showrooms: add lead «سرویس خواب ژیک را از نزدیک در شعب ما ببینید.» | `HomeShowroomsTeaser.tsx`, `home-showrooms-teaser.css` | ✅ |
| Age bands: homepage-only title/subtitle override + order (دو نفره→کودک→نوجوان); site-wide room names untouched | `app/(site)/page.tsx` | ✅ |
| Showroom cities: **unchanged** (CMS) | — | ✅ by decision |

**Deliberate deviations from Kaveh:** ZWNJ added where the comp omitted it (project Persian rule); `--home-t7` card titles kept legible (Kaveh 7.5px fails WCAG); eyebrow kept grammatically-correct «دسته‌ی سنی» (Kaveh «دسته سنی»); «زیبایی» color left as forest `#5F7760` (Kaveh `#657767` is a 6-unit off-palette nudge — deferred to avoid token sprawl).

**Not yet verified:** `node`/`pnpm` are absent from the agent sandbox, so the build/lint/tests were NOT run. Operator must run `pnpm -w build` + lint + a visual pass at 402px before merging. Band title/subtitle override is homepage-display only — if a CMS-level change is preferred, move it into `services/api/src/seed.ts` + reseed instead.
