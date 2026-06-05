import type { WritingContent } from './placeholder-data';

export function WritingSection({
  content,
  onOpenFeatured,
}: {
  content: WritingContent;
  onOpenFeatured: () => void;
}) {
  return (
    <section className="zh-bs-writing">
      <div className="zh-bs-wpanel">
        <h2 className="zh-bs-weyebrow">{content.heading}</h2>
        <p className="zh-bs-wbody">{content.body}</p>
      </div>
      <button className="zh-bs-upcue" type="button" aria-label="پرفروش‌ترین محصولات" onClick={onOpenFeatured}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M6 15 L12 9 L18 15" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <span>پرفروش‌ترین محصولات</span>
      </button>
    </section>
  );
}
