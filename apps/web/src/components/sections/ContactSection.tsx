'use client';

import { FormEvent, useState } from 'react';
import SectionHeading from '@/components/ui/SectionHeading';
import ScrollReveal from '@/components/ui/ScrollReveal';
import Button from '@/components/ui/Button';

export default function ContactSection() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <section id="contact" className="relative py-28 md:py-40 px-6 md:px-10 overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-ivory via-cream/30 to-ivory" />
      <div className="absolute inset-0 dot-pattern opacity-[0.08]" />
      <div className="absolute bottom-[10%] right-[10%] w-[300px] h-[300px] rounded-full bg-accent/[0.05] blur-[100px]" />

      <div className="max-w-5xl mx-auto relative">
        <ScrollReveal>
          <SectionHeading
            label="Connect"
            title="Get in Touch"
            subtitle="Tell us about the sanctuary you envision."
          />
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-5 gap-8 md:gap-12">
          {/* Form — 3 cols */}
          <div className="md:col-span-3">
            <ScrollReveal>
              <div className="glass-card rounded-3xl p-7 md:p-10">
                {submitted ? (
                  <div className="flex items-center justify-center min-h-[350px]">
                    <div className="text-center">
                      <div className="w-14 h-14 mx-auto mb-5 rounded-full bg-accent/10 flex items-center justify-center">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <p className="font-serif text-2xl text-charcoal">Thank you</p>
                      <p className="mt-2 text-stone text-sm font-light">We&apos;ll be in touch soon.</p>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="name" className="block text-[10px] tracking-[0.2em] uppercase text-stone mb-2 font-medium">
                          Name
                        </label>
                        <input
                          id="name" name="name" type="text" required
                          className="w-full glass-input rounded-xl px-4 py-3 text-sm text-charcoal font-light placeholder:text-stone/30"
                          placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className="block text-[10px] tracking-[0.2em] uppercase text-stone mb-2 font-medium">
                          Email
                        </label>
                        <input
                          id="email" name="email" type="email" required
                          className="w-full glass-input rounded-xl px-4 py-3 text-sm text-charcoal font-light placeholder:text-stone/30"
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>
                    <div>
                      <label htmlFor="message" className="block text-[10px] tracking-[0.2em] uppercase text-stone mb-2 font-medium">
                        Message
                      </label>
                      <textarea
                        id="message" name="message" rows={5} required
                        className="w-full glass-input rounded-xl px-4 py-3 text-sm text-charcoal font-light resize-none placeholder:text-stone/30"
                        placeholder="Tell us about your vision..."
                      />
                    </div>
                    <Button type="submit" className="w-full sm:w-auto">
                      Send Message
                    </Button>
                  </form>
                )}
              </div>
            </ScrollReveal>
          </div>

          {/* Info — 2 cols */}
          <div className="md:col-span-2">
            <ScrollReveal delay={0.1}>
              <div className="space-y-5 md:pt-2">
                {[
                  { icon: 'M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z', icon2: 'M15 11a3 3 0 11-6 0 3 3 0 016 0z', title: 'Showroom', lines: ['123 Design District', 'New York, NY 10001'] },
                  { icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z', title: 'Hours', lines: ['Mon – Fri: 10am – 6pm', 'Sat: 11am – 5pm', 'Sun: By appointment'] },
                  { icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z', title: 'Inquiries', lines: ['hello@zhic.com', '+1 (555) 000-0000'] },
                ].map((item) => (
                  <div key={item.title} className="glass-card rounded-2xl p-5 flex gap-4">
                    <div className="w-9 h-9 shrink-0 rounded-full bg-accent/10 flex items-center justify-center">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-accent">
                        <path d={item.icon} />
                        {item.icon2 && <path d={item.icon2} />}
                      </svg>
                    </div>
                    <div>
                      <h4 className="text-[10px] tracking-[0.2em] uppercase text-accent mb-1.5 font-medium">
                        {item.title}
                      </h4>
                      {item.lines.map((line) => (
                        <p key={line} className="text-sm text-charcoal/80 font-light leading-relaxed">
                          {line}
                        </p>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollReveal>
          </div>
        </div>
      </div>
    </section>
  );
}
