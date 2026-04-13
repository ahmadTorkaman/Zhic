# Admin Panels

The admin platform spec. Built on Payload 3, served by `services/api`
(its own Next.js app — see `architecture.md` §5), and exposed publicly
at `admin.zhic.ir` via a Caddy rewrite to the `/admin` path on
`services/api`. Custom views are layered on top of Payload's default
admin UI for the high-frequency flows: pricing, publishing, content
calendar, the order desk, the factor desk, and the inbox.

This document covers screens, roles, workflows, and the non-negotiable
UX guardrails for the **content / catalog / commerce admin** that ships
in Packages 1–2. The deeper CRM, ERP, and MES surfaces live in their own
apps (`apps/crm`, `apps/erp`, `apps/mes`) and are scoped in their
respective package docs and in `discovery.md`. The factor viewer (the
end-user-facing one) lives in `apps/factor`; this document covers only
the **issuing** side of factor management, which lives inside the admin.

Field-level definitions live in `data-schemas.md`. Architectural
context lives in `architecture.md`. The `apps/admin` vs Payload-as-admin
question is held open in `README.md` "What is deliberately not decided
yet"; this document describes the Payload-as-admin path that ships
first.

---

## 1. Goals & non-goals

**Goals**

- A non-developer can run the entire site: prices, products, articles,
  events, leads, SEO.
- The most frequent task — changing a price — takes ≤ 10 seconds.
- The hardest task — publishing a new product — takes ≤ 5 minutes for an
  editor with assets ready.
- No editor action can break the site visually (templates own design).
- Every change is auditable, reversible, and previewable before going live.

**Non-goals**

- A general-purpose page builder. Blocks are constrained to the design
  system, not freeform.
- Direct HTML/CSS editing. Editors never touch markup.
- Multi-tenant. One brand, one site.

---

## 2. Roles & permissions

Roles are defined once in `public.users.role` (see `data-schemas.md`
§1) and apply across every app. The admin enforces them via Payload
access control, which is the ultimate source of truth.

| Role | Description | Can do | Cannot |
| --- | --- | --- | --- |
| `admin` | Founder, lead engineer | Everything, including users, settings, redirects, schema migrations, factor numbering format, payment provider config. | — |
| `editor` | Marketing / content lead | All content CRUD, publish, schedule, manage media, manage redirects, edit SEO. | Manage users, change roles, edit `siteSettings`, change prices, manage orders. |
| `marketing` | Marketing assistant | Draft and edit content, submit articles for review, edit SEO fields. | Publish, approve articles, change prices, manage redirects, manage users, settings, orders. |
| `sales` | HQ sales staff | Read products and customers, create orders manually, edit customer profile, view factors. | Change prices, change product fields, manage users, publish content, issue refunds (Package 3 may relax this). |
| `showroom_manager` | Per-showroom manager | Everything `sales` can do, plus: manage their own showroom's stock, confirm transfers in, see their showroom's KPIs and order pipeline. | Edit other showrooms, change prices, edit catalog, manage users. |
| `showroom_staff` | Showroom floor staff | Read catalog, create orders, look up customers, see floor stock at their location. | Edit any catalog or customer field they didn't create, edit other showrooms' data, change prices. |
| `accountant` | Finance | Issue and void factors, run finance reports, approve refunds, edit finance-relevant `siteSettings` (factor numbering, VAT rate, bank info). | Edit catalog, publish content, manage users. |
| `factory_supervisor` | MES — Package 4 | Manage work orders, BOMs, routings inside `apps/mes`. | Edit `commerce` directly. |
| `factory_worker` | MES — Package 4 | Update work-order state from the floor inside `apps/mes`. | Anything else. |
| `viewer` | Stakeholder | Read-only across the admin. | Any write. |
| `customer` | Storefront customer | Not an admin role. Listed for completeness — customers never see the admin. | Anything in admin. |

**Two-factor authentication is required for `admin`, `editor`, and
`accountant`.** Phone+OTP via `packages/sms` is the primary auth for
all staff (see `architecture.md` §7); password-based login is
bootstrap-only for the founding admin account.

### Editorial team & the "primary editor" convention

There can be **multiple users with the `editor` role** — this avoids the
single-reviewer bottleneck (vacations, sick days, time zones). Any user
with the editor role can approve any article in `in_review`. `admin` can
also approve as the absolute fallback.

To preserve accountability, `siteSettings.primaryEditor` (a relation to
a `users` record) designates one editor as the default reviewer. The
primary editor:

- Receives the default "Submitted for review" notification.
- Is shown next to their name in the audit log.
- Is the fallback for any review queue routing rules added later.

This is a soft convention, not a permission boundary. We deliberately
did **not** introduce a separate "co-editor" role — capabilities should
be encoded by roles, not org charts. If the team grows, simply add more
users to the `editor` role.

Sensitive actions ALWAYS require a confirmation modal: price change,
slug change, publish, unpublish, delete, redirect creation, user role
change.

---

## 3. Information architecture

The admin is RTL by default (Persian-first; see `design-system.md`
§2.4 for logical-property rules). Left-rail in LTR maps to the
right-rail in RTL automatically. Groups, in order:

```
DASHBOARD
  · Home (داشبورد)
  · Content calendar (تقویم محتوا)
  · Inbox (صندوق ورودی)

CATALOG (کاتالوگ)
  · Products
  · Quick price editor      ← custom view
  · Collections
  · Categories
  · Tags
  · Materials
  · 3D models               ← custom view
  · Variants overview       ← custom view
  · Reviews

COMMERCE (فروش)            ← Package 2+
  · Customers
  · Orders                  ← custom view (the order desk)
  · Carts (live + abandoned)
  · Payments
  · Promotions              ← custom view (Shape C)
  · Gift cards              ← custom view (Shape C)
  · Returns

INVENTORY (موجودی)          ← Package 2+
  · Stock locations
  · Stock levels
  · Stock transfers
  · Stock reservations      ← custom view (Shape C)
  · Cycle counts (Package 3+)

FACTORS (فاکتورها)          ← Package 2+ (the issuing side)
  · Issued factors
  · Adjustment factors
  · Voided factors
  · Numbering & sequences   ← custom view, accountant-restricted

LOCATIONS (شوروم‌ها)
  · Showrooms
  · Appointments            ← Package 3

CONTENT (محتوا)
  · Journal articles
  · Authors
  · Journal categories
  · Pages
  · Testimonials
  · Press
  · FAQ

EVENTS (رویدادها)
  · Events

MARKETING (بازاریابی)
  · Promotions
  · Newsletter (SMS / email)
  · Forms
  · Submissions

SEO
  · SEO control center      ← custom view
  · Redirects
  · Sitemap status
  · Broken links / 404s
  · Search Console (embed)

MEDIA (رسانه)
  · Library

SETTINGS (تنظیمات)
  · Site settings
  · Users & roles
  · Audit log
  · Integrations            (SMS provider, payment provider, object storage)
```

Items above marked **Package 2+** appear in the left rail starting in
Package 2 when the corresponding collections exist. Showroom managers,
sales staff, accountants, and factory roles see only the groups
their role is allowed to read.

---

## 4. Dashboard

The home screen the editor sees on login. Three stacked cards:

1. **Today**
   - **Articles awaiting your review** (editor-only badge — drives the
     editorial sign-off workflow).
   - Drafts in progress.
   - Scheduled-to-publish in next 7 days.
   - Unanswered form submissions count.
   - Pending appointments per showroom.
   - Pending reviews / trade applications count.
2. **Content calendar (mini)**
   - Month view, shows scheduled articles, events, promotions.
3. **Performance snapshot**
   - **Plausible** sessions last 7d vs prior 7d (self-hosted; no GA4).
   - Search Console clicks/impressions last 7d.
   - Top 5 landing pages.
   - Core Web Vitals status (green/amber/red).
4. **Commerce snapshot (Package 2+)**
   - Orders placed last 7d vs prior 7d (toman, Persian digits).
   - Pending orders awaiting payment / production / dispatch.
   - Today's factor count and total issued (toman).
   - Stock alerts: variants below `reorderPoint`.
   - For showroom roles: scoped to their own showroom only.

---

## 5. Custom screens

### 5.1 Quick price editor

The single most-requested workflow. A spreadsheet-like table.

- Columns: thumbnail, Persian name, SKU, status, base price (toman),
  sale price (toman), availability, last changed, actions.
- All prices edited and displayed in **toman** (Persian digits, ٬
  separator) but stored as integer **rials** via `packages/money`.
  The conversion is invisible to the editor; the column header
  reads "قیمت پایه (تومان)".
- Inline edit on price columns. Tab to next row. Ctrl+S commits.
- Filters: collection, category, status, availability, "has sale
  price," "below reorder point."
- Bulk select → bulk edit modal: percent change, fixed change
  (toman), set value (toman), toggle availability, schedule price
  change for date X (Jalali date picker).
- Every commit:
  - Writes to `auditLog` with before/after (in rials).
  - Appends to `priceHistory` (in rials).
  - Triggers ISR revalidation of affected pages.
  - Optional notification to a configured channel (Telegram /
    Eitaa / email — no Slack assumption baked in).
- Undo last action button (5-minute window).
- Export CSV with both rial and toman columns.

### 5.2 Variants overview

Cross-cutting view of every variant across every product, useful for stock
syncing and audits.

### 5.2b 3D model manager

Dedicated screen for the WebXR assets:

- Lists every product alongside its 3D coverage: glTF / USDZ / poster
  presence, file size, polycount, KTX2 status, last updated.
- Inline `<model-viewer>` preview for any selected model — orbit, zoom,
  test AR via QR code on a phone.
- Bulk download / re-upload.
- Validation badges: ✅ within budget, ⚠ over budget, ❌ broken (missing
  scene, no materials, etc).
- "Open in editor" link to a hosted glTF inspector for ad-hoc fixes.

#### Asset preparation: Blender export, not server-side compression

We deliberately do **not** run an in-admin compression pipeline. Server-
side glTF transforms are blind, hard to verify visually, and prone to
quietly producing broken or ugly results. Instead the workflow is:

1. The 3D artist prepares the model in **Blender**.
2. They export with the documented Blender preset (see below), which
   handles draco geometry compression, KTX2 textures, polycount
   decimation, and material variants.
3. They visually verify the exported `.glb` in a local viewer (Blender's
   own preview, `<model-viewer>` running locally, or Babylon Sandbox).
4. They upload the already-optimized `.glb` to the admin.
5. The admin **validates** the upload — it does not transform it.

This puts visual control where it belongs (with the artist, in front of
their eyes) and keeps the admin small.

#### Admin validator (server-side, validation only)

On glTF/GLB upload the admin runs a fast read-only check and either
accepts, warns, or rejects:

| Check | Threshold | Action if exceeded |
| --- | --- | --- |
| File size | > 2 MB | warn; > 4 MB reject |
| Triangle count | > 80k warn; > 100k reject |
| Has a `scene` | required | reject |
| Texture format | KTX2 preferred | warn if any PNG/JPG |
| Has draco compression | preferred | warn if absent |
| Material slots without variants | > 4 | warn |
| Missing `alt` text on the model3d group | required | reject |

Warnings appear inline next to the upload and are also shown as badges
in the 3D model manager so artists can fix and re-upload. Rejections
block the save entirely.

#### Blender export preset (documentation only)

The artist follows this preset every time. We will publish it as both
a written checklist and a downloadable Blender operator preset
(`zhic-web-glb.py`) once Package 1 nears completion.

Export settings (Blender → File → Export → glTF 2.0):

- **Format:** `glTF Binary (.glb)`
- **Include:** Selected Objects, Visible Objects only.
- **Transform:** +Y Up.
- **Geometry:**
  - Apply Modifiers: on
  - UVs, Normals, Tangents: on
  - Vertex Colors: only if used
  - Compression (Draco): on, level 6
- **Animation:** off (unless the model has animation, which beds do not).
- **Materials:**
  - Material Variants: on if the product has variant bindings
  - Image format: KTX2 (requires the KHR_texture_basisu add-on)
  - KTX2 quality: 200 for hero models, 150 otherwise
- **Decimation (do this in Blender, not in the exporter):**
  - Target: ≤ 100k triangles total, ≤ 80k preferred
  - Preserve sharp edges with the Decimate modifier in `Planar` mode
    where possible
- **Final pre-flight in Blender:**
  - Apply all transforms (`Ctrl+A → All Transforms`)
  - Origin to bottom-center for floor placement in AR
  - Verify scale is in meters (a King bed is ~2.0 m × 2.1 m × 1.2 m)
  - Verify the model is centered on origin
  - Bake any procedural materials to image textures before export

USDZ pair (for iOS Quick Look):

- Generated separately via Reality Composer (macOS), Apple's
  `usdzconvert`, or Blender's USD exporter.
- Same physical scale as the glb.
- ≤ 8 MB.
- Optional but recommended for hero products.

If the artist follows this preset the validator will pass on the first
try and the file will be well inside the 2 MB serving budget.

### 5.2c Editorial review queue

Surfaces every article currently in `in_review` status. Editor-only.

- Columns: title, author, submitted at, time-in-queue, category,
  word count.
- Click → opens article in a "review mode" view: read-only body on the
  left, comment thread on the right, big **Approve** / **Request
  changes** buttons at the bottom.
- Approving moves status to `approved`; the editor can then publish
  immediately or schedule.
- Requesting changes captures notes (richText) and bounces the article
  back to `changes_requested`, notifying the original author.
- Every transition writes to `auditLog`.

### 5.3 Content calendar

Full month / week view of all scheduled content (articles, events,
promotions, product launches). Drag to reschedule. Click to open the
underlying document.

### 5.4 SEO control center

A single dashboard to manage everything search-related:

- Global SEO defaults (from `siteSettings`).
- Sitemap regeneration status + manual trigger.
- robots.txt editor (validated).
- Per-URL meta override search.
- Pages missing meta title or description.
- Pages missing OG image.
- Articles without internal links.
- Schema validation report (last build).
- Pasted-URL tester: "preview how Google sees this page" (renders SSR HTML
  + structured data + OG card).

### 5.5 Inbox

A unified view of: contact form, trade applications, appointments,
newsletter signups, RSVPs, reviews. Tabs at top.

- Statuses: new, read, responded, archived, spam.
- Assign to a user.
- Internal notes thread.
- "Reply via email" opens the user's mail client with prefilled subject /
  body.
- Bulk archive, bulk export.
- Spam filter integration (Akismet or similar).

### 5.6 Broken links / 404s

Reads from the production access logs (or a Vercel/Cloudflare integration)
and surfaces:

- Top 404 URLs in last 7 / 30 days.
- "Create redirect" inline action.
- Internal links pointing to missing pages.

### 5.7 Audit log viewer

Filterable: by user, by collection, by action, by date. Diff view shows
before/after JSON. Cannot be edited or deleted, even by admins.

### 5.8 Order desk (Package 2+)

The operator screen for managing real orders. Sales, showroom managers,
showroom staff, and admins use it daily.

- List view columns: order number, Persian customer name, channel,
  origin showroom, total (toman), payment status, fulfillment status,
  placed at (Jalali), assigned staff.
- Filters: status, payment status, channel, showroom, date range
  (Jalali picker), assigned staff, "needs my attention".
- Saved views: "Today's orders," "Awaiting payment," "Awaiting
  dispatch," "My showroom — open," "All cancelled this month."
- Detail view: full order with line items, payments timeline, factor
  link, delivery record, audit history. Status transitions are
  buttons; each one writes to `auditLog`.
- "Manual order entry" — for showroom walk-ins and phone orders.
  Picks customer (or creates one with phone+name), picks line items,
  picks delivery method and address, captures payment (cash / card
  POS / bank transfer / online link), and issues a factor.
- Showroom-scoped roles see **only their showroom's orders**. HQ
  sales and admin see everything.
- Refund flow gated to `accountant` and `admin`; `showroom_manager`
  may request a refund which an accountant must approve.

### 5.9 Factor desk (Package 2+)

The accountant's workspace.

- List of issued factors (Persian, Jalali dates, toman totals).
- Filters: date range, issuing showroom, kind (`original`,
  `adjustment`, `void`), customer.
- Detail view: the factor as printed, the customer snapshot, the
  seller snapshot at issue time, links to the underlying order and
  payments.
- "Issue adjustment" creates a new immutable adjustment factor with
  `parentInvoiceId` set; never edits the original (see
  `data-schemas.md` §19).
- "Void" creates a void record but leaves the original on file.
- "Re-print" regenerates the cached PDF.
- "Export to accounting software" exports to whatever format the
  business's accountant uses (decided in Discovery / Package 3+).

### 5.10 Numbering & sequences (accountant + admin only)

Custom view for the factor numbering format and per-showroom
sequences.

- Reads/writes `siteSettings.invoiceNumberFormat`.
- Shows the next sequence number per showroom.
- Allows manual reset only with admin override (e.g., annual reset
  if the format includes the year).
- Every change writes to `auditLog` and is gated by 2FA.

### 5.11 Stock manager (Package 2+)

- Per-location stock-level grid: variant rows × location columns,
  showing on-hand, reserved, available, reorder point.
- Inline edit on `onHand` writes a `stock_adjust` audit row with a
  required reason.
- "Create transfer" picks source and destination locations, selects
  variants and quantities, dispatches at source.
- Receiving screen at the destination confirms qty received,
  records discrepancies, requires accountant review on mismatch.
- Cycle-count workflow ships in Package 3+.

### 5.12 Promotion editor (Package 2 — Shape C)

Custom view for the rules-based promotion engine (`packages/promotions`,
`data-schemas.md` §27).

- List view: name, type, status (active / scheduled / expired / draft),
  date range (Jalali), usage count, discount summary.
- Create / edit view:
  - Name, code (optional — auto-generated if blank).
  - Discount type: `percentage`, `fixed_amount`, `buy_x_get_y`.
  - Apply to: cart-level or specific collections / categories / products.
  - Constraints: min cart total (toman), max uses, max per-customer,
    `customerScoped` (requires login), `timeWindowed` (start/end Jalali).
  - Stackability: whether this promo combines with others.
- Preview panel: "test this promo on a sample cart" — pick products, see
  the discount applied, verify the rules engine output.
- Scope fence note in the UI: "No dynamic pricing, no behaviour-triggered
  discounts, no A/B-tested promotions, no per-segment targeting
  (Package 3+)."

### 5.13 Gift card manager (Package 2 — Shape C)

Custom view for gift card issuance and balance tracking
(`packages/gift-cards`, `data-schemas.md` §27b–27c).

- List view: code (masked), status (active / redeemed / void / expired),
  initial balance (toman), current balance (toman), issued at (Jalali),
  purchaser, recipient.
- Create / bulk-create: generate N cards with a set initial balance.
  Physical card codes can be pre-assigned.
- Detail view: full transaction ledger (issuance, redemptions, voids)
  with timestamps and order links.
- "Void" action requires accountant or admin role.
- Accountant note: tax treatment of gift cards (deferred revenue vs
  immediate) must be confirmed in Discovery accountant schema-walk
  before this screen goes live.

### 5.14 SMS automation editor (Package 2 — Shape C)

Custom view for managing delivery-step SMS templates sent via
`packages/sms`.

- List of automation triggers: `order_confirmed`, `order_shipped`,
  `order_out_for_delivery`, `order_delivered`, `order_cancelled`,
  `refund_initiated`.
- Per-trigger: template text (Persian, with `{orderNumber}`,
  `{customerName}`, `{trackingUrl}` placeholders), enabled/disabled
  toggle, preview.
- Send-log tab: recent sends with delivery status from Kavenegar.
- Scope fence: no conditional logic, no user-behaviour triggers, no
  A/B testing on message content. Package 3+ territory.

### 5.15 Stock reservation debug (Package 2 — Shape C)

Operational view for monitoring cart-hold reservations
(`data-schemas.md` §27d).

- List view: variant, location, qty, status (held / released / expired /
  converted), cart/order link, created at (Jalali), expires at.
- Filters: status, location, "expiring in < 5 min", variant.
- Bulk release: admin can force-release stuck reservations.
- Stats card: total held qty across all variants, average hold duration,
  expiry sweep last-run time, conversion rate (held → order).

---

## 6. Standard collection screens (Payload defaults, customized)

Each Payload collection list view is configured with:

- A meaningful default sort.
- Useful columns (not just `id` and `updatedAt`).
- Filters above the table.
- Saved views (e.g. "All drafts," "Featured products," "This week's
  articles").
- Bulk actions where safe.

### Document edit screens

Standard layout:

- Left: form fields, grouped into tabs (Content / Media / SEO / Settings).
- Right sidebar:
  - Status (draft / scheduled / published).
  - Publish / Save draft / Schedule buttons.
  - Live preview link (opens the public URL with a draft token).
  - Last updated by / at.
  - Version history with restore.
  - Slug editor with redirect warning.
  - Audit log link filtered to this document.

### Versioning & preview

- Every save creates a version. Versions are diffable and restorable.
- Drafts have stable preview URLs (`?preview=token`) that bypass the cache
  but render the real templates.
- Scheduled publish uses Payload's built-in scheduler, double-checked by a
  daily cron sweep.

---

## 7. Workflow walkthroughs

### 7.1 Editor changes the price of "آرورا" from ۸٬۴۰۰٬۰۰۰ to ۸٬۸۰۰٬۰۰۰ تومان

1. Login (phone+OTP) → Dashboard.
2. Catalog → Quick price editor.
3. Search "آرورا" → click base price cell → type `8800000` → Enter.
4. Confirmation modal: "تغییر قیمت پایه‌ی آرورا از ۸٬۴۰۰٬۰۰۰ به
   ۸٬۸۰۰٬۰۰۰ تومان؟" → Confirm.
5. Inline toast: "قیمت به‌روزرسانی شد. تا ۵ دقیقه قابل بازگردانی است."
6. `auditLog` + `priceHistory` rows written (in **rials** —
   `84000000` → `88000000`). ISR revalidates `/products/aurora`,
   `/products`, and `/`.

Total time: under 15 seconds.

### 7.2 Marketing drafts an article and editor signs off

1. **Marketing** logs in → Content → Journal articles → New.
2. Title, slug auto-fills.
3. Drag cover image into media slot → Alt text required → save.
4. Write body in MDX block editor; insert "Featured product" block, link
   to Aurora.
5. SEO tab: meta title, meta description (live preview of Google snippet),
   pick OG image.
6. Save draft → click **"Submit for review."** Status moves to
   `in_review`. Marketing can no longer publish from here.
7. **Editor** sees a badge on the dashboard → opens the editorial review
   queue → opens the article in review mode.
8. Editor either:
   - Clicks **Approve** → status `approved` → editor can publish now or
     schedule, OR
   - Clicks **Request changes** → leaves comments → status
     `changes_requested` → notification sent to the original author, who
     iterates and re-submits.
9. On publish (manual or scheduled), Payload publishes, ISR revalidates,
   sitemap updates, optional Slack notification fires, and the audit log
   records the full transition history.

### 7.3 Editor adds a new product (with GIFs and a 3D model)

1. Catalog → Products → New.
2. Fill core fields: name, slug, taglines, description, price (guidance),
   SKU, dimensions, materials, lead time.
3. Add variants (size + finish + price delta).
4. **Stills:** upload gallery images (≥ 3, alt text enforced).
5. **GIFs:** upload atelier loops / fabric drape / light play GIFs (alt
   text required, ≤ 3 MB each, ≤ 8 s).
6. **3D model:** upload `.glb` (≤ 2 MB, draco-compressed) and optional
   `.usdz` (iOS Quick Look). The admin runs validation: polycount,
   material variants, missing scene. Set the poster frame, alt text,
   default camera orbit, and (optional) variant bindings.
7. Inline `<model-viewer>` preview confirms the model loads and AR works.
8. SEO tab: review auto-generated meta, override if needed.
9. Save draft → preview → publish.
10. ISR revalidates `/products`, `/products/[slug]`, sitemap. JSON-LD
    `Product` block emitted automatically.

### 7.3b Editor adds a new showroom

1. Locations → Showrooms → New.
2. Persian name, ASCII slug, headline, description.
3. Cover image + gallery (Persian alt text enforced).
4. Address (Iranian fields: province, city, district, street,
   plaque, unit, postal code) → geo lat/lng auto-resolves from
   address with manual override (Neshan or Google Maps geocoder).
5. Hours (Persian day names, Persian-digit times), holiday hours
   (Iranian holidays — Nowruz, Sizdah Bedar, Tasua, Ashura),
   parking, transit.
6. Optional: Google Business Profile URL, **Neshan** profile URL,
   manager assignment (`showroom_manager` role).
7. Save → preview → publish.
8. ISR revalidates `/showrooms` and `/showrooms/[slug]`.
   `LocalBusiness` (`FurnitureStore`) JSON-LD is emitted on the
   slug page; the index page emits an `ItemList` of all showrooms.

### 7.6 Showroom staff places a walk-in order and issues a factor (Package 2+)

1. Showroom staff logs in (phone+OTP) on a showroom tablet.
2. Commerce → Orders → "ثبت سفارش جدید."
3. Customer lookup by phone. If new, creates a customer with phone +
   Persian name. If the customer wants a tax-compliant factor,
   captures national ID + economic code.
4. Picks line items from the catalog; variant picker shows
   per-location stock for this showroom.
5. Picks delivery method (in-showroom pickup, courier, white-glove).
6. Records payment: cash / card POS / bank transfer / online link
   (the last generates a `packages/payments` link the customer can
   pay from their phone).
7. On payment confirmation, order moves to `confirmed`, stock is
   reserved, and the system issues a factor with the next per-showroom
   sequence number from `siteSettings.invoiceNumberFormat`.
8. Factor opens in print view (`packages/invoices` template). Staff
   prints two copies — one for the customer, one for the showroom file.
9. Customer receives an SMS confirmation with the order number via
   `packages/sms`.

### 7.7 Accountant issues an adjustment factor (Package 2+)

1. Factors → Issued factors → search by factor number.
2. Open the factor → "Issue adjustment."
3. Enter the adjustment line items and reason.
4. Submit → a new adjustment factor is created with `parentInvoiceId`
   pointing at the original. The original stays read-only.
5. The adjustment carries the next sequence number; both factors
   appear in the customer's account and in any export.
6. `auditLog` records the issuing accountant and the reason.

### 7.4 Editor renames a slug

1. Open product → Settings tab → edit slug.
2. Modal: "This will create a 301 redirect from `/products/old-slug` to
   `/products/new-slug`. Continue?"
3. Confirm → slug updates, redirect entry inserted automatically, audit log
   entry written.

### 7.5 Marketing posts a sitewide promo banner

1. Marketing → Promotions → New.
2. Name, banner headline, banner CTA, start/end date, optional code.
3. Save → preview banner on staging.
4. On start date, banner appears sitewide. On end date, it disappears
   automatically.

---

## 8. Guardrails

These are the things the admin must NOT allow, ever.

- Publishing a product without: cover image (with alt), price, dimensions,
  meta title, meta description.
- Publishing an article without: cover image (with alt), excerpt, meta
  title, meta description, **and editor approval (`approved` status).**
  Marketing role can never publish, even if it tries via API.
- Publishing a showroom without: cover image, address, geo, hours.
- Uploading an image > 4 MB, GIF > 3 MB, video > 8 MB, glTF > 2 MB, or
  USDZ > 8 MB without an admin override.
- Uploading a glTF that fails validation (no scene, broken materials,
  polycount above budget).
- Uploading an image, GIF, or 3D model without alt text (unless
  `decorative: true`).
- Deleting a product or article that has inbound internal links — must
  show the list and force resolution.
- Saving a slug that collides with another in the same collection.
- Changing a price without a confirmation modal.
- Bulk deleting more than 10 items without typing `delete` to confirm.
- Editing site settings without 2FA.

---

## 9. Notifications

- **SMS** (via `packages/sms`, Kavenegar first) on: new appointment
  request to the assigned showroom manager, order confirmation to
  the customer, OTP delivery, refund initiated.
- **Email** on: new contact form submission, new trade application,
  scheduled publish failure, factor issuance receipt to the
  accountant. Email provider is whichever transactional service
  accepts Iranian signups (Mailgun EU is the current candidate; see
  `README.md` stack decisions).
- **Optional channel** (Telegram / Eitaa / email digest) on:
  publish, price change, new submission, CWV regression. Channel is
  configurable in integrations and defaults to email for the
  founding team.
- **Daily digest email** at 8am Tehran time to `editor`, `admin`,
  and `accountant` summarizing yesterday.

---

## 10. Integrations

The integration list is constrained by what works reliably from
inside Iran. See `README.md` "Stack decisions (Iran-aware)" for the
rationale.

- **`packages/sms`** — Kavenegar first; MelliPayamak / Ghasedak as
  pluggable adapters. The wrapper is provider-agnostic; call sites
  never know which provider is configured.
- **`packages/payments`** — ZarinPal / IDPay / Zibal. Final
  provider chosen in Package 2. Same wrapper pattern.
- **Plausible (self-hosted on Hetzner)** — embedded dashboard for
  the storefront analytics tile. **No GA4.**
- **Search Console** — embedded dashboard via API for SEO control
  center. Verification may need a non-Iranian phone for some flows.
- **Glitchtip (self-hosted, Sentry-compatible)** — error
  monitoring for the admin and the storefront.
- **Object storage** — Hetzner Object Storage default; a domestic
  Iranian S3 candidate evaluated in parallel.
- **Spam filtering** — a self-hosted or Iran-friendly equivalent
  for `formSubmissions`. No US-based SaaS dependency.

The earlier list of US-based marketing tools (Klaviyo, Resend,
Stripe, Slack) is gone. Klaviyo / Resend are replaced by SMS-first
flows + a transactional email provider that accepts Iranian signups.
Stripe is replaced by `packages/payments`. Slack is replaced by an
optional Telegram / Eitaa / email channel.

---

## 11. Accessibility & UX standards for the admin itself

- The admin must be keyboard-navigable end-to-end.
- All custom screens follow the same design tokens as the public site
  (more utilitarian density, but same color, type, motion language).
- All destructive actions are undoable for at least 5 minutes (soft
  delete, recoverable).
- All async actions show optimistic UI + toast confirmation.
- All forms autosave drafts every 30 seconds.
- All tables remember the user's last sort, filter, and column visibility.

---

## 12. Open admin questions

1. **`apps/admin` vs Payload-as-admin.** This document describes the
   Payload-as-admin path. The decision to graduate any specific
   surface (the order desk, the showroom-manager dashboard) into a
   custom `apps/admin` or `apps/crm` is held open in `README.md`
   and unblocked by Discovery (`discovery.md` §13).
2. **Showroom scope vs CRM scope.** Several screens described here
   (order desk, stock manager, factor desk) overlap with what
   `apps/crm` will eventually own. The split is decided after
   Discovery — until then, these live in the Payload admin.
3. **Client preview link.** Do we need a draft-preview URL that
   exposes a single article to an external reviewer (PR / press)
   without logging them in?
4. **Public RSS feed.** Should `/journal` expose an RSS feed for
   Persian readers who use feed readers?
5. **In-admin Persian / Arabic character normalization.** Do we run
   the ZWNJ / Arabic-yeh normalization on every text field at
   write-time, at read-time, or both? (Currently planned: write-time
   via a Payload field hook, with a CI check on the rendered output.)

Resolved (carried into the spec above):

- **Co-editor role?** No new role. Multiple users may hold the
  existing `editor` role; `siteSettings.primaryEditorId` designates
  the default reviewer for accountability. See §2.
- **In-admin glTF compressor?** No. The 3D artist optimizes in
  Blender with a documented export preset; the admin only validates
  the upload. See §5.2b.
- **Payload hosting?** Payload runs as `services/api`, its own
  Next.js app, exposed at `admin.zhic.ir` via Caddy. **Not** mounted
  inside `apps/web`. See `architecture.md` §5.
- **GA4?** No. Plausible only.
- **Klaviyo / Resend / Stripe / Slack?** No. SMS-first via
  `packages/sms`, payments via `packages/payments`, email via an
  Iran-friendly transactional provider, notifications via Telegram /
  Eitaa / email — never US-based marketing SaaS.
