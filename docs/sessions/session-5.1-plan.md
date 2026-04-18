# Session 5.1 — Inquiry Form + SMS Routing

## Context

Phase 4 complete. Session 5.1 is the first non-page session — it ships the
core customer-to-showroom communication pipeline. A unified inquiry form
appears on `/contact` and `/showrooms/[slug]` (replacing the placeholder
`ContactFormSlot`). PDP links already direct to `/contact?product=slug&reason=quote`.
Submission saves to Payload's `Inquiries` collection and fires an SMS to
the correct showroom manager via city-based routing through SMS.ir.

## Authority

`package1-month1.md` §Inquiry form → `CLAUDE.md` (no SMS logic outside
`packages/sms`) → `docs/sessions.md` §5.1.

## Entry state

- `Inquiries` collection exists from 1.3 with all required fields: name,
  phone, city, reason (price_inquiry/showroom_visit), preferred_date,
  message, routed_to (→showrooms), product (→products), status.
- Showrooms have `manager_phone`, `is_central`, `address.city` from 3.3.
- `ContactFormSlot` placeholder rendered on `/contact` (line 155) and
  `/showrooms/[slug]` (line 179).
- Query param contracts wired: `?product=slug&reason=quote` from PDP (3.2),
  `?showroom=slug&reason=visit` from ShowroomCtas (3.3).
- `@zhic/ui` form components: Input, Textarea, Select, Button, FormField.
- `@zhic/locale`: phone classification + Persian digit utilities.
- `packages/sms/` does not exist yet.
- No API routes or server actions exist in `apps/web`.
- `/thank-you` page exists from 3.4 (static, noindex).

## Scope decisions

### In scope

| Item | Justification |
|---|---|
| `packages/sms/` — SMS.ir REST wrapper | CLAUDE.md: "No SMS logic outside packages/sms" |
| `InquiryForm` client component with server action | Spec: unified form on contact + showroom pages |
| City-based SMS routing (city→showroom→manager_phone, fallback to is_central) | package1-month1.md §SMS routing logic |
| Pre-fill from query params (product, reason, showroom) | Existing contracts from 3.2/3.3 |
| Phone validation (Iranian mobile format) | package1-month1.md: "Iranian phone validation" |
| Inquiry saved to Payload + SMS sent + redirect to /thank-you | package1-month1.md §Post-submit flow |

### Deferred

| Item | Deferred to | Justification |
|---|---|---|
| `PhoneInput` with formatted display | Post-5.1 | FU-2.1-c; basic Input + validation sufficient for now |
| Newsletter form wiring (SiteFooter) | Post-5.1 | FU-2.2-f; different form, different endpoint |
| CAPTCHA / rate limiting | Package 2 | No abuse concern pre-launch |
| Inquiry status webhooks / admin notifications | Package 3 | CRM feature |

## Deliverables

### Step 1 — Create `packages/sms/`

**`packages/sms/package.json`** — NEW
- Name: `@zhic/sms`
- TypeScript, exports `./src/index.ts`
- No external dependencies (uses native `fetch`)

**`packages/sms/tsconfig.json`** — NEW
- Extend shared config

**`packages/sms/src/index.ts`** — NEW

Exports:
- `sendSms({ to, text }): Promise<{ ok: boolean; error?: string }>`
  - Reads `SMS_IR_API_KEY` and `SMS_IR_LINE_NUMBER` from env
  - POST to `https://api.sms.ir/v1/send` with authorization header
  - Returns `{ ok: true }` on success, `{ ok: false, error }` on failure
  - Graceful: if env vars missing, logs warning and returns `{ ok: false }`
    (form still saves to Payload — SMS failure must not block inquiry creation)
- `formatInquirySms(data: InquiryData): string`
  - Persian message template with name, phone, city, reason, message

### Step 2 — Server action for form submission

**`apps/web/src/app/actions/submitInquiry.ts`** — NEW

`'use server'` action:
1. Validate input (name required, phone is Iranian mobile, city required,
   reason required)
2. POST to `${API_URL}/api/inquiries` to create the inquiry in Payload
3. Determine SMS routing:
   - Fetch showrooms from Payload
   - Match `city` to `showroom.address.city`
   - If match → use that showroom's `manager_phone`; set `routed_to`
   - If no match or "سایر شهرها" → use `is_central` showroom
4. Update the inquiry with `routed_to` (PATCH)
5. Call `sendSms()` from `@zhic/sms` (fire-and-forget — don't block on failure)
6. Return `{ success: true }` or `{ success: false, errors: {...} }`

The action receives `FormData` from the client form.

### Step 3 — `InquiryForm` client component

**`apps/web/src/components/inquiry/InquiryForm.tsx`** — NEW

`'use client'` component using `useActionState` (React 19).

Props:
- `cities: string[]` — showroom cities for dropdown
- `defaultCity?: string` — pre-fill from showroom page
- `defaultReason?: 'price_inquiry' | 'showroom_visit'` — pre-fill from query params
- `defaultProduct?: string` — product slug from PDP link (hidden field)
- `defaultShowroom?: string` — showroom slug (hidden field)

Fields (per spec):
1. **Name** — `<FormField><Input></FormField>`, required
2. **Phone** — `<FormField><Input type="tel"></FormField>`, required,
   validated as Iranian mobile
3. **City** — `<FormField><Select></FormField>`, required, options from
   `cities` prop + "سایر شهرها"
4. **Reason** — `<FormField><Select></FormField>`, required
5. **Preferred date** — `<FormField><Input></FormField>`, shown only when
   reason = `showroom_visit`
6. **Message** — `<FormField><Textarea></FormField>`, optional

Hidden fields: `product`, `showroom` (from props)

Submit button with loading state. On success, `redirect('/thank-you')`.
Error display: per-field inline errors + general error message.

### Step 4 — Replace `ContactFormSlot` with `InquiryForm`

**`apps/web/src/app/(site)/contact/page.tsx`** — MODIFY

- Import `InquiryForm` instead of `ContactFormSlot`
- Extract unique cities from showrooms: `[...new Set(showrooms.map(s => s.address?.city).filter(Boolean))]`
- Read `searchParams` for `?product=`, `?reason=`, `?showroom=`
- Pass props to `InquiryForm`

**`apps/web/src/app/(site)/showrooms/[slug]/page.tsx`** — MODIFY

- Import `InquiryForm` instead of `ContactFormSlot`
- Extract cities from all showrooms (need to fetch them)
- Pre-fill city with this showroom's city, reason with `showroom_visit`
- Pass showroom slug as `defaultShowroom`

### Step 5 — Phone validation utility

**`apps/web/src/lib/validation.ts`** — NEW

- `validateIranianPhone(phone: string): boolean` — accepts 09xx or +989xx formats
  (uses `@zhic/locale` utilities if suitable, or simple regex)
- `normalizePhone(phone: string): string` — normalize to 09xx format for SMS

### Step 6 — Register `@zhic/sms` in workspace

**`packages/sms/package.json`** — workspace entry
**`apps/web/package.json`** — add `@zhic/sms` as dependency
**`turbo.json`** — verify sms package is included in pipeline

### Step 7 — Update state.md

- Mark 5.1 ✅
- Close FU-3.3-b (form integration)
- Close FU-2.2-f partially (newsletter still pending)
- Log new follow-ups

## Exit check

- [ ] `pnpm --filter @zhic/sms typecheck` passes
- [ ] `pnpm --filter @zhic/web typecheck` passes
- [ ] `pnpm --filter @zhic/web lint` passes (0 errors)
- [ ] `pnpm --filter @zhic/web test` passes
- [ ] `pnpm --filter @zhic/web build` passes
- [ ] `/contact` renders InquiryForm with city dropdown populated from showrooms
- [ ] `/contact?product=takht-aramesh&reason=quote` pre-fills product + reason
- [ ] `/showrooms/hamedan` renders InquiryForm with city=همدان, reason=showroom_visit
- [ ] Form validates: name required, phone format, city required, reason required
- [ ] Form submission → inquiry created in Payload `Inquiries` collection
- [ ] SMS routing: matching city → correct manager_phone; no match → central
- [ ] SMS sent via SMS.ir (or graceful fallback if API key not configured)
- [ ] Success → redirect to `/thank-you`
- [ ] `docs/state.md` updated

## Critical files

| File | Action |
|---|---|
| `packages/sms/src/index.ts` | New — SMS.ir wrapper |
| `packages/sms/package.json` | New |
| `apps/web/src/app/actions/submitInquiry.ts` | New — server action |
| `apps/web/src/components/inquiry/InquiryForm.tsx` | New — form component |
| `apps/web/src/lib/validation.ts` | New — phone validation |
| `apps/web/src/app/(site)/contact/page.tsx` | Modify — wire form |
| `apps/web/src/app/(site)/showrooms/[slug]/page.tsx` | Modify — wire form |
| `apps/web/package.json` | Add @zhic/sms dep |

## Verification

1. `pnpm --filter @zhic/sms typecheck`
2. `pnpm --filter @zhic/web typecheck && pnpm --filter @zhic/web lint`
3. `pnpm --filter @zhic/web test`
4. `pnpm --filter @zhic/web build`
5. End-to-end with Postgres + SMS.ir sandbox:
   - `docker compose up postgres` → `pnpm --filter @zhic/api dev`
   - Set `SMS_IR_API_KEY` + `SMS_IR_LINE_NUMBER` env vars
   - Submit inquiry → verify Payload admin shows entry + SMS received
