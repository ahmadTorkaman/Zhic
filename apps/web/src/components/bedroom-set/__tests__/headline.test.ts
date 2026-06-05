import { describe, expect, it } from 'vitest';
import { splitTitleWords } from '../headline';

describe('splitTitleWords', () => {
  it('splits on spaces, keeping intra-word ZWNJ intact', () => {
    expect(splitTitleWords('پرفروش‌ترین محصولات')).toEqual(['پرفروش‌ترین', 'محصولات']);
  });
  it('returns a single element for a one-word title', () => {
    expect(splitTitleWords('محصولات')).toEqual(['محصولات']);
  });
});
