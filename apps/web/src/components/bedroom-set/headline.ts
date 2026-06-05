// Split a headline into whole words. Each word becomes one animated unit so
// Persian cursive joins (and intra-word ZWNJ) are never broken mid-glyph.
export const splitTitleWords = (title: string): string[] => title.split(' ');
