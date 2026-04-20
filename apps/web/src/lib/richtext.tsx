import type { ReactNode } from 'react';
import type { LexicalNode, LexicalRoot, PayloadMedia, PayloadProduct, PayloadMaterial } from './payload';
import { mediaUrl } from './payload';

const FORMAT_BOLD = 1;
const FORMAT_ITALIC = 2;
const FORMAT_UNDERLINE = 8;

function hasFormat(raw: number | string | undefined, bit: number): boolean {
  if (typeof raw !== 'number') return false;
  return (raw & bit) === bit;
}

function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\p{L}\p{N}-]/gu, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

function collectNodeText(nodes: LexicalNode[] | undefined): string {
  if (!nodes) return '';
  return nodes
    .map((n) => {
      if (n.type === 'text' && typeof n.text === 'string') return n.text;
      if (n.children) return collectNodeText(n.children);
      return '';
    })
    .join('');
}

export type HeadingEntry = { id: string; text: string; level: 2 | 3 };

export function extractHeadings(value: LexicalRoot | null | undefined): HeadingEntry[] {
  if (!value?.root?.children) return [];
  const headings: HeadingEntry[] = [];
  for (const node of value.root.children) {
    if (node.type === 'heading' && (node.tag === 'h2' || node.tag === 'h3')) {
      const text = collectNodeText(node.children);
      if (text) {
        headings.push({
          id: slugifyHeading(text),
          text,
          level: node.tag === 'h2' ? 2 : 3,
        });
      }
    }
  }
  return headings;
}

export type EmbedContext = {
  products?: Map<string | number, PayloadProduct>;
  materials?: Map<string | number, PayloadMaterial>;
};

export function extractEmbeddedIds(value: LexicalRoot | null | undefined): {
  productIds: (string | number)[];
  materialIds: (string | number)[];
} {
  const productIds: (string | number)[] = [];
  const materialIds: (string | number)[] = [];
  if (!value?.root?.children) return { productIds, materialIds };

  const walk = (nodes: LexicalNode[]) => {
    for (const n of nodes) {
      if (n.type === 'block') {
        const blockType = (n as Record<string, unknown>).blockType as string | undefined;
        const fields = (n as Record<string, unknown>).fields as Record<string, unknown> | undefined;
        if (blockType === 'product-embed' && fields?.product) {
          const id = typeof fields.product === 'object'
            ? (fields.product as { id?: string | number }).id
            : fields.product;
          if (id != null) productIds.push(id as string | number);
        }
        if (blockType === 'material-ref' && fields?.material) {
          const id = typeof fields.material === 'object'
            ? (fields.material as { id?: string | number }).id
            : fields.material;
          if (id != null) materialIds.push(id as string | number);
        }
      }
      if (n.children) walk(n.children);
    }
  };
  walk(value.root.children);
  return { productIds, materialIds };
}

// --- Block renderers -------------------------------------------------------

function PullQuote({ fields }: { fields: Record<string, unknown> }) {
  const quote = fields.quote as string | undefined;
  const attribution = fields.attribution as string | undefined;
  if (!quote) return null;
  return (
    <figure className="my-8 border-s-4 border-gold ps-6">
      <blockquote className="text-h4 font-bold text-charcoal italic">
        {quote}
      </blockquote>
      {attribution ? (
        <figcaption className="mt-2 text-small text-stone">— {attribution}</figcaption>
      ) : null}
    </figure>
  );
}

function ImageGrid({ fields }: { fields: Record<string, unknown> }) {
  const images = fields.images as Array<{ image?: PayloadMedia; caption?: string }> | undefined;
  const columns = fields.columns as string | undefined;
  if (!images?.length) return null;
  const cols = columns === '3' ? 'grid-cols-3' : 'grid-cols-2';
  return (
    <div className={`my-8 grid ${cols} gap-4`}>
      {images.map((item, idx) => {
        const src = mediaUrl(item.image ?? null);
        return (
          <figure key={idx}>
            {src ? (
              <img src={src} alt={item.image?.alt ?? ''} className="w-full rounded-md object-cover" />
            ) : (
              <div className="flex aspect-[3/2] items-center justify-center rounded-md bg-cream text-small text-stone">
                بدون تصویر
              </div>
            )}
            {item.caption ? (
              <figcaption className="mt-1 text-small text-stone">{item.caption}</figcaption>
            ) : null}
          </figure>
        );
      })}
    </div>
  );
}

function VideoEmbed({ fields }: { fields: Record<string, unknown> }) {
  const url = fields.url as string | undefined;
  const caption = fields.caption as string | undefined;
  if (!url) return null;
  return (
    <figure className="my-8">
      <div className="relative aspect-video overflow-hidden rounded-md bg-charcoal">
        <iframe
          src={url}
          title={caption ?? 'ویدیو'}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
      {caption ? (
        <figcaption className="mt-2 text-small text-stone">{caption}</figcaption>
      ) : null}
    </figure>
  );
}

function ProductEmbed({ fields, embeds }: { fields: Record<string, unknown>; embeds?: EmbedContext }) {
  const ref = fields.product as { id?: string | number } | string | number | undefined;
  const id = typeof ref === 'object' && ref !== null ? ref.id : ref;
  if (id == null) return null;
  const product = embeds?.products?.get(id);
  if (!product) return null;
  return (
    <a
      href={`/products/${product.slug}`}
      className="my-6 flex items-center gap-4 rounded-lg border border-sand p-4 transition-colors hover:bg-sand/30"
    >
      <div className="flex-1">
        <p className="text-eyebrow font-bold tracking-[var(--tracking-eyebrow)] text-forest">محصول</p>
        <p className="text-h4 font-bold text-charcoal">{product.name}</p>
        {product.shortDescription ? (
          <p className="mt-1 text-small text-stone line-clamp-2">{product.shortDescription}</p>
        ) : null}
      </div>
    </a>
  );
}

function MaterialRef({ fields, embeds }: { fields: Record<string, unknown>; embeds?: EmbedContext }) {
  const ref = fields.material as { id?: string | number } | string | number | undefined;
  const id = typeof ref === 'object' && ref !== null ? ref.id : ref;
  if (id == null) return null;
  const material = embeds?.materials?.get(id);
  if (!material) return null;
  return (
    <aside className="my-6 rounded-lg border border-forest/20 bg-forest/5 p-4">
      <p className="text-eyebrow font-bold tracking-[var(--tracking-eyebrow)] text-forest">متریال</p>
      <p className="text-h4 font-bold text-charcoal">{material.name}</p>
      {material.origin ? (
        <p className="mt-1 text-small text-stone">منشأ: {material.origin}</p>
      ) : null}
    </aside>
  );
}

function renderBlock(node: LexicalNode, embeds?: EmbedContext): ReactNode {
  const blockType = (node as Record<string, unknown>).blockType as string | undefined;
  const fields = ((node as Record<string, unknown>).fields ?? {}) as Record<string, unknown>;
  switch (blockType) {
    case 'pull-quote':
      return <PullQuote fields={fields} />;
    case 'image-grid':
      return <ImageGrid fields={fields} />;
    case 'video-embed':
      return <VideoEmbed fields={fields} />;
    case 'product-embed':
      return <ProductEmbed fields={fields} embeds={embeds} />;
    case 'material-ref':
      return <MaterialRef fields={fields} embeds={embeds} />;
    default:
      return null;
  }
}

// --- Node renderer ---------------------------------------------------------

function renderChildren(nodes: LexicalNode[] | undefined, embeds?: EmbedContext): ReactNode[] {
  if (!nodes) return [];
  return nodes.map((n, i) => <RenderNode key={i} node={n} embeds={embeds} />);
}

function RenderNode({ node, embeds }: { node: LexicalNode; embeds?: EmbedContext }): ReactNode {
  switch (node.type) {
    case 'paragraph':
      return (
        <p className="text-body leading-relaxed text-stone mb-4 last:mb-0">
          {renderChildren(node.children, embeds)}
        </p>
      );
    case 'heading': {
      const tag = node.tag === 'h2' ? 'h2' : node.tag === 'h4' ? 'h4' : 'h3';
      const size =
        tag === 'h2' ? 'text-h2' : tag === 'h4' ? 'text-h4' : 'text-h3';
      const Tag = tag as 'h2' | 'h3' | 'h4';
      const headingText = collectNodeText(node.children);
      const id = slugifyHeading(headingText);
      return (
        <Tag id={id} className={`${size} font-bold text-charcoal mb-4 scroll-mt-24`}>
          {renderChildren(node.children, embeds)}
        </Tag>
      );
    }
    case 'text': {
      const isBold = hasFormat(node.format, FORMAT_BOLD);
      const isItalic = hasFormat(node.format, FORMAT_ITALIC);
      const isUnderline = hasFormat(node.format, FORMAT_UNDERLINE);
      const text = node.text ?? '';
      if (!isBold && !isItalic && !isUnderline) return text;
      const cls = [
        isBold ? 'font-bold' : null,
        isItalic ? 'italic' : null,
        isUnderline ? 'underline underline-offset-4' : null,
      ]
        .filter(Boolean)
        .join(' ');
      return <span className={cls}>{text}</span>;
    }
    case 'linebreak':
      return <br />;
    case 'link': {
      const url = node.fields?.url ?? node.url ?? '#';
      const newTab = node.fields?.newTab;
      return (
        <a
          href={url}
          target={newTab ? '_blank' : undefined}
          rel={newTab ? 'noreferrer' : undefined}
          className="text-charcoal underline underline-offset-4 decoration-1 hover:decoration-2 focus-visible:outline-none rounded-sm"
        >
          {renderChildren(node.children, embeds)}
        </a>
      );
    }
    case 'list': {
      const isOrdered = (node as Record<string, unknown>).listType === 'number';
      const Tag = isOrdered ? 'ol' : 'ul';
      const listStyle = isOrdered ? 'list-decimal' : 'list-disc';
      return (
        <Tag className={`${listStyle} ps-6 space-y-2 text-body text-stone mb-4`}>
          {renderChildren(node.children, embeds)}
        </Tag>
      );
    }
    case 'listitem':
      return <li>{renderChildren(node.children, embeds)}</li>;
    case 'quote':
      return (
        <blockquote className="my-6 border-s-4 border-gold ps-6 text-body italic text-stone">
          {renderChildren(node.children, embeds)}
        </blockquote>
      );
    case 'horizontalrule':
      return <hr className="my-8 border-sand" />;
    case 'block':
      return renderBlock(node, embeds);
    case 'upload': {
      const uploadValue = (node as Record<string, unknown>).value as PayloadMedia | undefined;
      const src = mediaUrl(uploadValue ?? null);
      if (!src) return null;
      return (
        <figure className="my-6">
          <img src={src} alt={uploadValue?.alt ?? ''} className="w-full rounded-md" />
        </figure>
      );
    }
    default:
      return <>{renderChildren(node.children, embeds)}</>;
  }
}

export function RichText({ value }: { value: LexicalRoot | null | undefined }) {
  if (!value?.root?.children) return null;
  return <div>{renderChildren(value.root.children)}</div>;
}

export function ArticleRichText({
  value,
  embeds,
}: {
  value: LexicalRoot | null | undefined;
  embeds?: EmbedContext;
}) {
  if (!value?.root?.children) return null;
  return <div>{renderChildren(value.root.children, embeds)}</div>;
}

export function plainTextFromRichText(
  value: LexicalRoot | null | undefined,
  limit = 160,
): string | null {
  if (!value?.root?.children) return null;
  const parts: string[] = [];
  const walk = (nodes: LexicalNode[]) => {
    for (const n of nodes) {
      if (parts.join(' ').length >= limit) return;
      if (n.type === 'text' && typeof n.text === 'string') {
        parts.push(n.text);
      }
      if (n.children) walk(n.children);
    }
  };
  walk(value.root.children);
  const joined = parts.join(' ').replace(/\s+/g, ' ').trim();
  if (!joined) return null;
  return joined.length > limit ? `${joined.slice(0, limit - 1)}…` : joined;
}
