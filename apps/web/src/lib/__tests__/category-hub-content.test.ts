import { describe, expect, it } from 'vitest';
import { hubContentFromPayload } from '../category-hub-content';
import type { PayloadCategory } from '../payload';

function cat(partial: Partial<PayloadCategory> & { slug: string }): PayloadCategory {
  return { id: partial.slug, name: partial.slug, ...partial } as PayloadCategory;
}

describe('hubContentFromPayload — tile image fallback', () => {
  const parent = cat({ slug: 'bed', name: 'تخت' });

  it('prefers mosaicTileImage over cover and product photo', () => {
    const child = cat({
      slug: 'single',
      mosaicTileImage: { url: '/tile.jpg' } as PayloadCategory['mosaicTileImage'],
      cover: { url: '/cover.jpg' } as PayloadCategory['cover'],
    });
    const photos = new Map([['single', '/product.jpg']]);
    const { tiles } = hubContentFromPayload(parent, [child], photos, '/bedroom-furniture/bed');
    expect(tiles[0]!.img).toBe('/tile.jpg');
  });

  it('falls back to cover when mosaicTileImage is absent', () => {
    const child = cat({ slug: 'single', cover: { url: '/cover.jpg' } as PayloadCategory['cover'] });
    const photos = new Map([['single', '/product.jpg']]);
    const { tiles } = hubContentFromPayload(parent, [child], photos, '/bedroom-furniture/bed');
    expect(tiles[0]!.img).toBe('/cover.jpg');
  });

  it('falls back to the product photo when neither image is set', () => {
    const child = cat({ slug: 'single' });
    const photos = new Map([['single', '/product.jpg']]);
    const { tiles } = hubContentFromPayload(parent, [child], photos, '/bedroom-furniture/bed');
    expect(tiles[0]!.img).toBe('/product.jpg');
  });
});

describe('hubContentFromPayload — crop position', () => {
  const parent = cat({ slug: 'bed' });
  const photos = new Map<string, string>();

  it('maps top/center/bottom to object-position strings', () => {
    const children = [
      cat({ slug: 'a', mosaicTilePosition: 'top', cover: { url: '/a.jpg' } as PayloadCategory['cover'] }),
      cat({ slug: 'b', mosaicTilePosition: 'center', cover: { url: '/b.jpg' } as PayloadCategory['cover'] }),
      cat({ slug: 'c', mosaicTilePosition: 'bottom', cover: { url: '/c.jpg' } as PayloadCategory['cover'] }),
    ];
    const byKey = Object.fromEntries(
      hubContentFromPayload(parent, children, photos, '/x').tiles.map((t) => [t.key, t.pos]),
    );
    expect(byKey.a).toBe('50% 0%');
    expect(byKey.b).toBe('50% 50%');
    expect(byKey.c).toBe('50% 100%');
  });

  it('leaves pos undefined when no position is set (toTile defaults to center)', () => {
    const child = cat({ slug: 'a', cover: { url: '/a.jpg' } as PayloadCategory['cover'] });
    const { tiles } = hubContentFromPayload(parent, [child], photos, '/x');
    expect(tiles[0]!.pos).toBeUndefined();
  });
});
