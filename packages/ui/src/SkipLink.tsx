export type SkipLinkProps = {
  /** Target id (without #). Defaults to "main". */
  target?: string;
  children?: React.ReactNode;
};

export function SkipLink({ target = 'main', children = 'پرش به محتوا' }: SkipLinkProps) {
  return (
    <a
      href={`#${target}`}
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:start-3 focus:z-[var(--z-toast)] focus:inline-flex focus:items-center focus:rounded-md focus:bg-charcoal focus:px-4 focus:py-2 focus:text-small focus:text-ivory focus:shadow-modal focus:outline-none focus-ring-invert focus-visible:outline-none"
    >
      {children}
    </a>
  );
}
