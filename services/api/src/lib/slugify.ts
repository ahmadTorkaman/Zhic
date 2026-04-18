/**
 * Convert a string (Persian or Latin) to a URL-safe ASCII slug.
 * - Lowercases
 * - Replaces spaces, ZWNJ (U+200C), and common separators with hyphens
 * - Strips non-ASCII-alphanumeric characters (except hyphens)
 * - Collapses consecutive hyphens
 * - Trims leading/trailing hyphens
 */
export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/(?:[\s_]|\u200C|\u200D)+/g, '-') // spaces, underscores, ZWNJ, ZWJ → hyphen
    .replace(/[^a-z0-9-]/g, '')           // strip non-ASCII-alphanumeric
    .replace(/-{2,}/g, '-')               // collapse multiple hyphens
    .replace(/^-|-$/g, '')                // trim leading/trailing hyphens
}
