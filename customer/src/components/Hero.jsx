import React, { useEffect, useRef } from 'react';
import { ArrowDown, ArrowUpRight, Compass } from 'lucide-react';
import { motion } from 'motion/react';
import { HOTEL_INFO } from '../data/hotelData';
import {
  animateHeroEntrance,
  buttonPrimaryGlow,
  buttonSecondaryTactile,
} from '../utils/animations';

export default function Hero({ onOpenBooking, onExplore }) {
  const badgeRef = useRef(null);
  const headlineLine1Ref = useRef(null);
  const headlineLine2Ref = useRef(null);
  const accentLineRef = useRef(null);
  const subheadRef = useRef(null);
  const cta1Ref = useRef(null);
  const cta2Ref = useRef(null);
  const footerRef = useRef(null);

  useEffect(() => {
    const anim = animateHeroEntrance({
      badge: badgeRef.current,
      headlineLines: [headlineLine1Ref.current, headlineLine2Ref.current].filter(Boolean),
      accentLine: accentLineRef.current,
      subhead: subheadRef.current,
      ctaButtons: [cta1Ref.current, cta2Ref.current].filter(Boolean),
      footerMeta: footerRef.current,
    });

    return () => {
      if (anim && typeof anim.pause === 'function') anim.pause();
    };
  }, []);

  const scrollToExplore = (e) => {
    e.preventDefault();
    if (onExplore) {
      onExplore();
    } else {
      const el = document.querySelector('#intro');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section className="hero-section" id="hero">
      {/* Background Architectural Photograph with Balanced Editorial Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=2400&q=90"
          alt="NOVA HOUSE Architecture and Courtyard"
          className="w-full h-full object-cover object-center"
          style={{
            filter: 'brightness(0.78) contrast(1.05)',
            transform: 'scale(1.02)',
            transition: 'transform 10s ease-out',
          }}
        />
        {/* Soft targeted scrim overlay for high headline readability while preserving photo clarity */}
        <div className="hero-overlay-scrim" />
      </div>

      <div className="container-luxury relative z-10 w-full h-full flex flex-col justify-between">
        {/* Spacer for navbar breathing room */}
        <div className="w-full pt-4" />

        {/* Core Hero Editorial Hierarchy */}
        <div className="my-auto py-6 sm:py-8 max-w-4xl">
          {/* 1. Small Location & Status Eyebrow */}
          <div
            ref={badgeRef}
            className="inline-flex items-center gap-2.5 mb-5 px-3 py-1 bg-black/40 backdrop-blur-md border border-white/15 rounded-full"
            style={{ opacity: 0 }}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#B69A68] animate-pulse" />
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.24em] uppercase text-[#F5F2EA]">
              MODERN LUXURY · RICHMOND ROAD
            </span>
          </div>

          {/* 2. Main Headline with High Contrast Display Typography */}
          <h1 className="hero-headline mb-4 sm:mb-6">
            <span ref={headlineLine1Ref} className="block" style={{ opacity: 0 }}>
              A PLACE
            </span>
            <span ref={headlineLine2Ref} className="hero-headline-sub block" style={{ opacity: 0 }}>
              TO PAUSE.
            </span>
          </h1>

          {/* Decorative Gold Accent Line */}
          <div
            ref={accentLineRef}
            className="w-24 h-[2px] bg-[#B69A68] mb-6 sm:mb-8 origin-left"
            style={{ opacity: 0, transform: 'scaleX(0)' }}
          />

          {/* 3. Supporting Description */}
          <p
            ref={subheadRef}
            className="font-sans text-base sm:text-lg md:text-xl font-light text-[#E2DDD5] max-w-xl leading-relaxed mb-8 sm:mb-10"
            style={{ opacity: 0 }}
          >
            Modern hospitality in the heart of Bengaluru.
          </p>

          {/* 4. Primary & Secondary CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            <div ref={cta1Ref} style={{ opacity: 0 }}>
              <motion.button
                onClick={onOpenBooking}
                {...buttonPrimaryGlow}
                className="btn-luxury-primary !py-3.5 sm:!py-4 !px-7 sm:!px-8 text-xs tracking-[0.2em] rounded-none shadow-md cursor-pointer"
                style={{
                  backgroundColor: '#B69A68',
                  borderColor: '#B69A68',
                  color: '#111111',
                }}
              >
                <span>BOOK YOUR STAY</span>
                <ArrowUpRight size={14} />
              </motion.button>
            </div>

            <div ref={cta2Ref} style={{ opacity: 0 }}>
              <motion.button
                onClick={scrollToExplore}
                {...buttonSecondaryTactile}
                className="btn-luxury-secondary on-dark !py-3.5 sm:!py-4 !px-7 sm:!px-8 text-xs tracking-[0.2em] rounded-none backdrop-blur-sm cursor-pointer"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  borderColor: 'rgba(244, 241, 235, 0.25)',
                }}
              >
                <span>EXPLORE NOVA HOUSE</span>
                <ArrowDown size={13} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* Bottom Metadata & Scroll Prompt */}
        <div
          ref={footerRef}
          className="flex items-center justify-between border-t border-white/15 pt-5 pb-2 text-xs text-[#F5F2EA]/80"
          style={{ opacity: 0 }}
        >
          <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.16em] uppercase text-[#B8B3AA] hidden md:block">
            DESIGNED FOR BUSINESS TRAVELLERS, COUPLES & GUESTS
          </div>

          <motion.a
            href="#intro"
            onClick={scrollToExplore}
            whileHover={{ x: 3 }}
            className="flex items-center gap-2.5 text-inherit no-underline group hover:text-[#B69A68] transition-colors ml-auto md:ml-0"
          >
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase">
              EXPLORE
            </span>
            <ArrowDown size={13} className="group-hover:translate-y-0.5 transition-transform text-[#B69A68]" />
          </motion.a>
        </div>
      </div>
    </section>
  );
}
