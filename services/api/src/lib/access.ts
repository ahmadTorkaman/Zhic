/**
 * Shared access-control helpers for Payload collections.
 *
 * Role ladder (Package 1):
 *   admin > editor > marketing > viewer > (anonymous)
 *
 * Convention: `read` on published-content collections is anonymous
 * (the storefront uses the public REST API). `create`/`update`/`delete`
 * require at least the `marketing` role.
 *
 * Publishing — flipping status from 'draft' to 'published' — requires
 * at least `editor`. That's enforced per-collection via the status
 * field's access hook where applicable, not here.
 *
 * Inquiries are the exception: anonymous `create` (public form), but
 * only staff can read.
 */

import type { Access, FieldAccess } from 'payload'

type UserRole = 'admin' | 'editor' | 'marketing' | 'viewer' | 'customer'

function roleOf(req: { user?: unknown }): UserRole | null {
  const user = req.user as { role?: UserRole } | null | undefined
  return user?.role ?? null
}

// ─── Collection-level access (can return a Where filter) ──────────────

/** Any authenticated user regardless of role. */
export const isAuthenticated: Access = ({ req }) => Boolean(req.user)

/** Admin only. */
export const isAdmin: Access = ({ req }) => roleOf(req) === 'admin'

/** Admin + editor. */
export const isEditor: Access = ({ req }) => {
  const r = roleOf(req)
  return r === 'admin' || r === 'editor'
}

/** Admin + editor + marketing. */
export const isMarketingOrAbove: Access = ({ req }) => {
  const r = roleOf(req)
  return r === 'admin' || r === 'editor' || r === 'marketing'
}

/** Everyone — including anonymous. */
export const isPublic: Access = () => true

// ─── Field-level access (must return plain boolean) ───────────────────

export const isAdminField: FieldAccess = ({ req }) => roleOf(req) === 'admin'

export const isEditorField: FieldAccess = ({ req }) => {
  const r = roleOf(req)
  return r === 'admin' || r === 'editor'
}

/**
 * Standard bundle for published-content collections (products,
 * articles, categories, etc.): read = public, write = marketing+,
 * delete = admin.
 */
export const publishedContentAccess = {
  read: isPublic,
  create: isMarketingOrAbove,
  update: isMarketingOrAbove,
  delete: isAdmin,
} as const

/**
 * Staff-only bundle (Showrooms catalog, Users, Inquiries read):
 * read = authenticated, write = admin only.
 */
export const staffOnlyAccess = {
  read: isAuthenticated,
  create: isAdmin,
  update: isAdmin,
  delete: isAdmin,
} as const
