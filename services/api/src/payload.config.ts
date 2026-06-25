import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { buildConfig } from 'payload'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { s3Storage } from '@payloadcms/storage-s3'
import sharp from 'sharp'

// Collections
import { Users } from './collections/Users'
import { Designs } from './collections/Designs'
import { Products } from './collections/Products'
import { ProductVariants } from './collections/ProductVariants'
import { Showrooms } from './collections/Showrooms'
import { Articles } from './collections/Articles'
import { Authors } from './collections/Authors'
import { JournalCategories } from './collections/JournalCategories'
import { Categories } from './collections/Categories'
import { Rooms } from './collections/Rooms'
import { Tags } from './collections/Tags'
import { Materials } from './collections/Materials'
import { Collections } from './collections/Collections'
import { Media } from './collections/Media'
import { Inquiries } from './collections/Inquiries'
import { Subscribers } from './collections/Subscribers'
import { BedroomSetHubs } from './collections/BedroomSetHubs'

// Globals
import { Home } from './globals/Home'
import { About } from './globals/About'
import { Atelier } from './globals/Atelier'
import { Contact } from './globals/Contact'
import { Faq } from './globals/Faq'
import { Care } from './globals/Care'
import { Events } from './globals/Events'
import { Privacy } from './globals/Privacy'
import { Returns } from './globals/Returns'
import { Shipping } from './globals/Shipping'
import { SiteConfig } from './globals/SiteConfig'
import { Terms } from './globals/Terms'
import { BedroomSet } from './globals/BedroomSet'
import { BedroomFurniture } from './globals/BedroomFurniture'
import { Journal } from './globals/Journal'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

// Origins allowed to use the admin panel / authenticated API. Payload's
// CSRF + CORS checks reject authenticated requests whose Origin isn't listed
// (returns 403). serverURL (the storefront origin) is always allowed; the
// review VPS additionally serves the API+admin directly on :3001, so that
// origin must be whitelisted too. Extra origins via PAYLOAD_ADMIN_ORIGINS
// (comma-separated).
const adminOrigins = [
  process.env.NEXT_PUBLIC_SERVER_URL,
  ...(process.env.PAYLOAD_ADMIN_ORIGINS?.split(',').map((s) => s.trim()) ?? []),
].filter(Boolean) as string[]

export default buildConfig({
  admin: {
    // Pin theme to a deterministic value. Default 'all' uses Sec-CH-Prefers-Color-Scheme
    // which is unreliable across VPN/proxy paths and causes React #418 hydration mismatch.
    theme: 'light',
    // Browser extensions that inject FOUC-prevention <style> tags into <head>
    // shift Payload's `@layer` style by one slot, breaking React's text-node
    // hydration check on the <style>. We extend the suppression (via a pnpm
    // patch on @payloadcms/next) to <head>, <body>, and the <style> itself.
    suppressHydrationWarning: true,
    meta: {
      titleSuffix: ' — ژیک ادمین',
    },
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },

  collections: [
    Users,
    Designs,
    Products,
    ProductVariants,
    Showrooms,
    Articles,
    Authors,
    JournalCategories,
    Categories,
    Rooms,
    Tags,
    Materials,
    Collections,
    Media,
    Inquiries,
    Subscribers,
    BedroomSetHubs,
  ],

  globals: [
    Home,
    About,
    Atelier,
    Contact,
    Faq,
    Care,
    Events,
    Privacy,
    Returns,
    Shipping,
    SiteConfig,
    Terms,
    BedroomSet,
    BedroomFurniture,
    Journal,
  ],

  editor: lexicalEditor(),

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
    // Migrations-only — `push: true` is interactive (drizzle-kit asks
    // about renames) and hangs under pm2 (no TTY), which left this DB
    // in a partially-synced state until 2026-05-19. Schema changes go
    // through `pnpm migrate:create <name>` from services/api/.
    push: false,
  }),

  plugins: [
    // S3 storage is optional in dev — falls back to local disk if no credentials
    ...(process.env.S3_ACCESS_KEY
      ? [
          s3Storage({
            collections: {
              media: {
                // Tier-aware prefix — review/, prod/, or empty for workspace.
                prefix: process.env.S3_PREFIX || '',
              },
            },
            bucket: process.env.S3_BUCKET!,
            config: {
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY!,
                secretAccessKey: process.env.S3_SECRET_KEY!,
              },
              region: process.env.S3_REGION!,
              endpoint: process.env.S3_ENDPOINT!,
              forcePathStyle: true, // required for Abr Arvan (non-AWS S3-compatible)
            },
          }),
        ]
      : []),
  ],

  secret: process.env.PAYLOAD_SECRET || 'dev-secret-change-me-in-production',

  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },

  serverURL: process.env.NEXT_PUBLIC_SERVER_URL,
  cors: adminOrigins,
  csrf: adminOrigins,

  sharp,
})
