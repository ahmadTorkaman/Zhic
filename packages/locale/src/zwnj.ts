/**
 * Zero-width non-joiner (U+200C) helpers.
 *
 * ZWNJ is essential in Persian to break ligatures within a word
 * (e.g. "می‌خواهید" not "میخواهید"). Source strings in the codebase
 * should include real ZWNJ characters; these helpers exist for
 * programmatic stitching.
 */

export const ZWNJ = '\u200C';

/**
 * Insert a ZWNJ between two substrings when they appear adjacent in `text`.
 * Returns the text unchanged if the pair is not found.
 */
export function insertZwnj(text: string, between: [string, string]): string {
  const [left, right] = between;
  return text.replaceAll(left + right, left + ZWNJ + right);
}

export function hasZwnj(text: string): boolean {
  return text.includes(ZWNJ);
}
