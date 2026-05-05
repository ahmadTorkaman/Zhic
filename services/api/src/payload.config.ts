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
import { Showrooms } from './collections/Showrooms'
import { Articles } from './collections/Articles'
import { Authors } from './collections/Authors'
import { JournalCategories } from './collections/JournalCategories'
import { Categories } from './collections/Categories'
import { Tags } from './collections/Tags'
import { Materials } from './collections/Materials'
import { Collections } from './collections/Collections'
import { Media } from './collections/Media'
import { Inquiries } from './collections/Inquiries'

// Globals
import { Home } from './globals/Home'
import { About } from './globals/About'
import { Atelier } from './globals/Atelier'
import { Contact } from './globals/Contact'
import { Faq } from './globals/Faq'
import { Care } from './globals/Care'
import { Events } from './globals/Events'
import { Privacy } from './globals/Privacy'
import { Terms } from './globals/Terms'
import { Returns } from './globals/Returns'
import { Shipping } from './globals/Shipping'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfig({
  admin: {
    // Pin theme to a deterministic value. Default 'all' uses Sec-CH-Prefers-Color-Scheme
    // which is unreliable across VPN/proxy paths and causes React #418 hydration mismatch.
    theme: 'light',
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
    Showrooms,
    Articles,
    Authors,
    JournalCategories,
    Categories,
    Tags,
    Materials,
    Collections,
    Media,
    Inquiries,
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
    Terms,
    Returns,
    Shipping,
  ],

  editor: lexicalEditor(),

  db: postgresAdapter({
    pool: {
      connectionString: process.env.DATABASE_URI,
    },
  }),

  plugins: [
    // S3 storage is optional in dev — falls back to local disk if no credentials
    ...(process.env.S3_ACCESS_KEY
      ? [
          s3Storage({
            collections: {
              media: { prefix: 'media' },
            },
            bucket: process.env.S3_BUCKET!,
            config: {
              credentials: {
                accessKeyId: process.env.S3_ACCESS_KEY,
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

  sharp,
})
