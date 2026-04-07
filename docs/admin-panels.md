# Admin Panels

The admin platform spec. Built on Payload 3 (mounted at `/admin`), with
custom views layered on top of the default Payload UI for the high-frequency
flows: pricing, publishing, content calendar, and the lead inbox.

This document covers screens, roles, workflows, and the non-negotiable UX
guardrails. Field-level definitions live in `data-schemas.md`.

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

| Role | Description | Can do | Cannot |
| --- | --- | --- | --- |
| `admin` | Founder, lead engineer | Everything, including users, settings, redirects, schema migrations. | — |
| `editor` | Marketing lead | All content CRUD, publish, schedule, manage media, manage redirects, edit SEO. | Manage users, change roles, edit site settings. |
| `marketing` | Marketing assistant | Draft and edit content, submit articles for review, edit SEO fields. Cannot publish or change prices. | Publish, approve articles, change price, manage redirects, manage users, settings. |
| `viewer` | Stakeholder, agency | Read-only across the admin. | Any write. |

Two-factor authentication is required for `admin` and `editor`.

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

Left-rail navigation, grouped:

```
DASHBOARD
  · Home
  · Content calendar
  · Inbox

CATALOG
  · Products
  · Quick price editor      ← custom view
  · Collections
  · Categories
  · Tags
  · Materials
  · 3D models               ← custom view
  · Variants overview        ← custom view
  · Reviews

LOCATIONS
  · Showrooms
  · Appointments

CONTENT
  · Journal articles
  · Authors
  · Journal categories
  · Pages
  · Testimonials
  · Press
  · FAQ

EVENTS
  · Events

MARKETING
  · Promotions
  · Newsletter
  · Forms
  · Submissions

SEO
  · SEO control center       ← custom view
  · Redirects
  · Sitemap status
  · Broken links / 404s
  · Search Console (embed)

MEDIA
  · Library

SETTINGS
  · Site settings
  · Users & roles
  · Audit log
  · Integrations
```

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
   - GA4 sessions last 7d vs prior 7d.
   - Search Console clicks/impressions last 7d.
   - Top 5 landing pages.
   - Core Web Vitals status (green/amber/red).

---

## 5. Custom screens

### 5.1 Quick price editor

The single most-requested workflow. A spreadsheet-like table.

- Columns: thumbnail, name, SKU, status, base price, sale price, currency,
  availability, last changed, actions.
- Inline edit on price columns. Tab to next row. Cmd+S commits.
- Filters: collection, category, status, availability, currency, "has sale
  price."
- Bulk select → bulk edit modal: percent change, fixed change, set value,
  toggle availability, set currency, schedule price change for date X.
- Every commit:
  - Writes to `auditLog` with before/after.
  - Appends to `priceHistory`.
  - Triggers ISR revalidation of affected pages.
  - Optionally sends a Slack message to #marketing.
- Undo last action button (5-minute window).
- Export CSV.

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

#### In-admin glTF compressor pipeline

Editors will not always receive pre-optimized files from the brand or
from a 3D vendor. The admin therefore runs a server-side compressor on
upload so the public site never serves a fat glTF.

Pipeline (executed in a background job, not in the upload request):

1. **Validate** — parse the glTF/GLB. Reject anything missing a `scene`.
2. **Geometry** — apply Draco compression (level 7 default).
3. **Textures** — convert PNG/JPG to KTX2 (UASTC + Zstd) with a
   `--quality 200` preset for hero models, `--quality 150` for others.
4. **Mesh ops** — `gltf-transform`: weld + dedup + prune unused nodes.
5. **Quantization** — quantize positions, normals, UVs to int16/int8
   where safe.
6. **Polycount check** — warn at > 80k, hard-fail at > 100k triangles.
7. **Re-export** — write a new GLB. Store both the original and the
   compressed version in `media`; the public site only ever serves the
   compressed one.
8. **Optional USDZ** — if no USDZ was uploaded, attempt automatic glTF →
   USDZ conversion via `usd-from-gltf`. Result is flagged "auto" so
   editors can override with a hand-tuned file.
9. **Metrics** — record before/after file size, polycount, texture
   memory, and material variant list back onto the `media` document.
10. **Notify** — toast in admin + audit log entry. If compression fails,
    the original is kept but the model is marked `needs_attention` and
    a banner appears on the product.

Tooling: `gltf-transform` CLI (Apache 2.0) wrapped in a Node worker; KTX2
via `KTX-Software`. Both run on the same Next.js host (since Payload is
in-process). For very large jobs we can offload to a queue (BullMQ +
Redis) in Phase 4 if needed.

Editors see this pipeline as a single button: **"Optimize for web."** The
result is a clear before/after card with file size, polycount, and a
side-by-side `<model-viewer>` preview so they can verify nothing visual
broke.

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

### 7.1 Editor changes the price of "Aurora" from $4,200 to $4,400

1. Login → Dashboard.
2. Catalog → Quick price editor.
3. Search "Aurora" → click base price cell → type `4400` → Enter.
4. Confirmation modal: "Change Aurora base price from $4,200 to $4,400?"
   → Confirm.
5. Inline toast: "Price updated. Reverted in 5 min if needed."
6. Audit log + price history written. ISR revalidates `/products/aurora`
   and `/products` and `/`.

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
2. Name, slug, headline, description.
3. Cover image + gallery (alt text enforced).
4. Address (street/city/region/postal/country) → geo lat/lng auto-resolves
   from address (with manual override).
5. Hours, holiday hours, parking, transit.
6. Optional: Google Business Profile URL, manager assignment.
7. Save → preview → publish.
8. ISR revalidates `/showrooms` and `/showrooms/[slug]`. `LocalBusiness`
   JSON-LD is emitted on the slug page; the index page emits an
   `ItemList` of all showrooms.

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

- Email on: new contact form submission, new trade application, new
  appointment request, scheduled publish failure.
- Slack (optional, configured in integrations) on: publish, price change,
  new submission, CWV regression.
- Daily digest email at 8am to `editor` and `admin` summarizing yesterday.

---

## 10. Integrations

- **Klaviyo** — newsletter signups, transactional sends.
- **Resend** — admin transactional email (form confirmations, password
  resets).
- **Google Search Console** — embedded dashboard via API.
- **GA4** — embedded dashboard via API.
- **Stripe** (optional, Phase 5) — checkout if e-commerce is added.
- **Akismet** (or similar) — spam filtering on form submissions.
- **Slack** — notifications.

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

1. Do we need a "client preview" link that exposes a draft to a single
   external reviewer (e.g. PR / press), without logging them in?
2. Multi-region: any chance the admin needs to be reachable from outside
   the US? (Affects hosting / latency.)
3. Do we need a public-facing "newsroom" RSS feed in addition to the
   journal?

Resolved (carried into the spec above):

- **Co-editor role?** No new role. Multiple users may hold the existing
  `editor` role; `siteSettings.primaryEditor` designates the default
  reviewer for accountability. See §2 "Editorial team."
- **In-admin glTF compressor?** Yes — pipeline documented in §5.2b.
- **Payload hosting?** Same Next.js process at `/admin`. One deploy.
