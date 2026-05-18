/**
 * A piece of split text — either a word (any non-whitespace run) or a
 * whitespace run. ZWNJ (U+200C) is treated as part of a word so Persian
 * compound words like «می‌خواهید» stay intact and render as a single
 * shaped run.
 */
export type TextPiece = { type: 'word' | 'whitespace'; value: string };

const WHITESPACE_RE = /(\s+)/;
const IS_WHITESPACE_RE = /^\s+$/;

export function splitIntoWords(text: string): TextPiece[] {
  if (text === '') return [];
  // String.split with a capturing group keeps the separators in the result.
  const parts = text.split(WHITESPACE_RE).filter((p) => p !== '');
  return parts.map((p) => (IS_WHITESPACE_RE.test(p) ? { type: 'whitespace' as const, value: p } : { type: 'word' as const, value: p }));
}
