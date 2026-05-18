import { describe, it, expect } from 'vitest';
import { splitIntoWords } from '../src/text-split';

describe('splitIntoWords', () => {
  it('returns a single word for a single-word string', () => {
    expect(splitIntoWords('Hello')).toEqual([{ type: 'word', value: 'Hello' }]);
  });

  it('separates words from whitespace as distinct pieces', () => {
    expect(splitIntoWords('a b')).toEqual([
      { type: 'word', value: 'a' },
      { type: 'whitespace', value: ' ' },
      { type: 'word', value: 'b' },
    ]);
  });

  it('preserves multi-character whitespace runs verbatim', () => {
    expect(splitIntoWords('a  b')).toEqual([
      { type: 'word', value: 'a' },
      { type: 'whitespace', value: '  ' },
      { type: 'word', value: 'b' },
    ]);
  });

  it('handles Persian text with ZWNJ inside words', () => {
    // می‌خواهید is ONE word (ZWNJ joins it). Should not split on ZWNJ.
    const pieces = splitIntoWords('می‌خواهید بروم');
    expect(pieces).toEqual([
      { type: 'word', value: 'می‌خواهید' },
      { type: 'whitespace', value: ' ' },
      { type: 'word', value: 'بروم' },
    ]);
  });

  it('handles leading and trailing whitespace', () => {
    expect(splitIntoWords('  a  ')).toEqual([
      { type: 'whitespace', value: '  ' },
      { type: 'word', value: 'a' },
      { type: 'whitespace', value: '  ' },
    ]);
  });

  it('returns an empty array for an empty string', () => {
    expect(splitIntoWords('')).toEqual([]);
  });
});
