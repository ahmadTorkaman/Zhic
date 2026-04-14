import type { Product } from '@/data/products';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group cursor-pointer glass-card glass-card-hover rounded-2xl overflow-hidden">
      {/* Image area */}
      <div className="relative aspect-[4/5] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-cream via-sand/20 to-cream" />
        <div className="relative w-full h-full flex items-center justify-center transition-transform duration-700 ease-out group-hover:scale-[1.03]">
          <span className="font-serif text-4xl text-stone/20 select-none">{product.name}</span>
        </div>
        {/* Hover overlay */}
        <div className="absolute inset-0 bg-charcoal/0 group-hover:bg-charcoal/[0.03] transition-colors duration-500" />
      </div>

      {/* Info */}
      <div className="p-5 md:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h3 className="font-serif text-lg text-charcoal tracking-wide">{product.name}</h3>
          <span className="text-[11px] text-accent tracking-wider font-medium shrink-0">{product.price}</span>
        </div>
        <p className="mt-2 text-xs text-stone/80 font-light leading-relaxed line-clamp-2">
          {product.description}
        </p>
        <div className="mt-4 flex items-center gap-2 text-[10px] tracking-[0.15em] uppercase text-accent font-medium opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <span>View Details</span>
          <span className="text-accent/60">&rarr;</span>
        </div>
      </div>
    </div>
  );
}
