# Vercel storefront deploy — zhicwood.store (temporary HTTPS preview)

The storefront (`apps/web`) goes on Vercel for HTTPS at **zhicwood.store**. The
**VPS (`45.140.42.57`) stays as the HTTP backend** — Payload API (:3001), DB, and
media. Vercel serves the frontend; everything else still runs on the box.

## Why this works (no mixed-content)
The app now emits **same-origin relative** media URLs (`/api/media/...`), and the
`next.config.ts` rewrite proxies `/api/media/*` to the API origin set by
`MEDIA_ORIGIN`. So on Vercel the browser only talks to `https://zhicwood.store`;
Vercel fetches the VPS over HTTP server-side. SSR data fetches use `API_URL`
(server-side only). Verified: 0 hardcoded `http://45.140…` refs in rendered HTML.

## What you must do (I can't access your Vercel account)

### 1. Create the Vercel project
- New Project → import GitHub repo **`ahmadTorkaman/Zhic`**, branch
  **`feat/journal-rebuild`** (or merge to `main` and deploy that).
- **Root Directory = `apps/web`**. Framework auto-detects **Next.js**.
- Vercel detects the pnpm workspace + Turborepo and builds the workspace deps;
  leave Build/Install commands on default. If the build can't find workspace
  packages, set Install = `pnpm install` and Build = `cd ../.. && pnpm turbo build --filter=@zhic/web`.
- Set **Node.js 22.x** (Project Settings → General) to match the box.

### 2. Environment variables (Project → Settings → Environment Variables)
| Key | Value |
| --- | --- |
| `API_URL` | `http://45.140.42.57:3001` |
| `MEDIA_ORIGIN` | `http://45.140.42.57:3001` |
| `SITE_URL` | `https://zhicwood.store` |
| `NEXT_PUBLIC_SITE_URL` | `https://zhicwood.store` |
| `NEXT_PUBLIC_API_URL` | `https://zhicwood.store` |
| `NOINDEX` | `true`  ← keep the preview out of search engines |

### 3. Domain
- Project → Settings → Domains → add **`zhicwood.store`** (and `www` if you want).
- Vercel shows the exact DNS record (an `A` to Vercel, or a `CNAME`). Add it at
  your registrar. TLS is automatic once DNS resolves.

## VPS side (already true / quick checks)
- API is public on `0.0.0.0:3001` (reachable from Vercel) — keep `@zhic/api`
  running on the box. Don't firewall :3001 off.
- Media served from `services/api/media/` via the API — unchanged.
- Optional: add `https://zhicwood.store` to `PAYLOAD_ADMIN_ORIGINS` in
  `services/api/.env` (not required — browser traffic is same-origin/proxied).

## Residual risk to validate after first deploy
- **Vercel → Iran reachability.** Vercel's servers fetching the Pars Pack VPS
  over HTTP is the one thing we can't test until it's live. If SSR/media time out,
  the fix is to move media to Abr Arvan S3 (already wired in `payload.config.ts`)
  and/or expose the API via a reachable proxy.
- **Per-image proxying** through Vercel is fine for a preview; for real traffic,
  move media to S3/CDN.

## Want me to drive it instead?
If you create a Vercel token (Account → Settings → Tokens) and paste it, I can run
the deploy from the box via the Vercel CLI (`vercel --token …`). Otherwise the
dashboard flow above is ~5 minutes.
