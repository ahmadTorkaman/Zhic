import { NAV_LINKS } from '@/lib/constants';

export default function Footer() {
  return (
    <footer className="relative bg-charcoal text-ivory/60 overflow-hidden">
      {/* Top glow line */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[50%] max-w-lg h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 md:px-10 pt-20 pb-12 md:pt-28 md:pb-16">
        {/* Main footer */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8">
          {/* Brand — 5 cols */}
          <div className="md:col-span-5">
            <h3 className="font-serif text-2xl tracking-[0.35em] text-ivory mb-5">
              ZHIC
            </h3>
            <p className="text-sm font-light leading-relaxed max-w-xs text-ivory/40">
              Luxury bedroom design crafted for those who understand that rest is
              the ultimate indulgence.
            </p>
          </div>

          {/* Links — 3 cols */}
          <div className="md:col-span-3">
            <h4 className="text-[10px] tracking-[0.25em] uppercase mb-5 text-accent font-medium">
              Navigate
            </h4>
            <ul className="space-y-3">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm font-light text-ivory/40 hover:text-ivory/80 transition-colors duration-300"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact — 4 cols */}
          <div className="md:col-span-4">
            <h4 className="text-[10px] tracking-[0.25em] uppercase mb-5 text-accent font-medium">
              Get in Touch
            </h4>
            <ul className="space-y-3 text-sm font-light text-ivory/40">
              <li>hello@zhic.com</li>
              <li>+1 (555) 000-0000</li>
              <li>New York, NY</li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-16 pt-6 border-t border-ivory/[0.06] flex flex-col sm:flex-row items-center justify-between gap-3">
          <span className="text-[11px] text-ivory/25 tracking-wide">
            &copy; {new Date().getFullYear()} Zhic. All rights reserved.
          </span>
          <span className="text-[11px] text-ivory/20 font-light tracking-wide">
            Designed with intention
          </span>
        </div>
      </div>
    </footer>
  );
}
