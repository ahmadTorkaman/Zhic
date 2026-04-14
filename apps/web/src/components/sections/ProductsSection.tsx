'use client';

import { products } from '@/data/products';
import ProductCard from '@/components/ui/ProductCard';
import SectionHeading from '@/components/ui/SectionHeading';
import ScrollReveal from '@/components/ui/ScrollReveal';

export default function ProductsSection() {
  return (
    <section id="products" className="relative py-28 md:py-40 px-6 md:px-10 overflow-hidden">
      {/* Background layers */}
      <div className="absolute inset-0 bg-gradient-to-b from-ivory via-cream/50 to-ivory" />
      <div className="absolute inset-0 dot-pattern opacity-[0.08]" />

      {/* Decorative glows */}
      <div className="absolute top-[10%] right-[5%] w-[350px] h-[350px] rounded-full bg-accent/[0.05] blur-[100px]" />
      <div className="absolute bottom-[10%] left-[5%] w-[250px] h-[250px] rounded-full bg-sand/[0.1] blur-[80px]" />

      <div className="max-w-7xl mx-auto relative">
        <ScrollReveal>
          <SectionHeading
            label="Curated"
            title="The Collection"
            subtitle="Each piece is crafted to transform your bedroom into a sanctuary of calm."
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-7">
          {products.map((product, i) => (
            <ScrollReveal key={product.id} delay={i * 0.06}>
              <ProductCard product={product} />
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
