import { describe, expect, it } from 'vitest';
import { ZWNJ, hasZwnj, insertZwnj } from '../src/zwnj';

describe('ZWNJ constant', () => {
  it('is U+200C', () => {
    expect(ZWNJ).toBe('\u200C');
    expect(ZWNJ.charCodeAt(0)).toBe(0x200c);
  });
});

describe('insertZwnj', () => {
  it('inserts a ZWNJ between adjacent substrings', () => {
    expect(insertZwnj('میخواهید', ['می', 'خواهید'])).toBe('می\u200Cخواهید');
  });

  it('leaves text unchanged when the pair is not adjacent', () => {
    expect(insertZwnj('سلام', ['می', 'خواهید'])).toBe('سلام');
  });

  it('inserts on all occurrences', () => {
    expect(insertZwnj('میخواهید میخواهید', ['می', 'خواهید']))
      .toBe('می\u200Cخواهید می\u200Cخواهید');
  });
});

describe('hasZwnj', () => {
  it('detects ZWNJ presence', () => {
    expect(hasZwnj('می\u200Cخواهید')).toBe(true);
    expect(hasZwnj('میخواهید')).toBe(false);
    expect(hasZwnj('')).toBe(false);
  });
});
