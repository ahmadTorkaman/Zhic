/**
 * @zhic/types — Hand-written consumer interfaces for Month 1.
 *
 * These are the display-oriented types that apps/web imports. They are
 * intentionally narrower than the full Payload schema. The authoritative
 * generated types live in services/api/src/payload-types.ts.
 *
 * Update these when collection fields change in services/api.
 */

export interface MediaRef {
  id: string
  url: string
  alt: string
  width?: number
  height?: number
}

export interface Category {
  id: string
  name: string
  slug: string
}

export interface Tag {
  id: string
  name: string
  slug: string
}

export interface Design {
  id: string
  name: string
  slug: string
  age_group: string | null
  description: unknown // Lexical JSON — rendered client-side
  gallery: MediaRef[]
  featured: boolean
}

export interface Product {
  id: string
  name: string
  slug: string
  design: Design | string // populated or id
  piece_type: string
  /** Integer rials. Use @zhic/money's formatMoney to display as toman. */
  basePriceRials: number
  dimensions: { width: number; height: number; depth: number }
  materials: { material: string }[]
  specs: unknown // Lexical JSON
  gallery: MediaRef[]
  inquiry_enabled: boolean
}

export interface Showroom {
  id: string
  name: string
  slug: string
  city: string
  address: string
  phone: string
  manager_phone: string // internal — for SMS routing in Session 5.1
  hours: string
  gallery: MediaRef[]
  coordinates: { lat: number; lng: number }
  is_central: boolean
}

export interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  cover: MediaRef | null
  category: Category | string | null
  tags: (Tag | string)[]
  published_at: string // ISO 8601
  author: string
  body: unknown // Lexical JSON
}

export interface Inquiry {
  id: string
  name: string
  phone: string
  city: string
  reason: 'price_inquiry' | 'showroom_visit'
  preferred_date?: string
  message?: string
  status: 'new' | 'contacted' | 'closed'
}
