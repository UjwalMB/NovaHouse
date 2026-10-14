import React from 'react';
import { ArrowDown, ArrowUpRight, Compass } from 'lucide-react';
import { HOTEL_INFO } from '../data/hotelData';

export default function Hero({ onOpenBooking, onExplore }) {
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
          <div className="inline-flex items-center gap-2.5 mb-5 px-3 py-1 bg-black/40 backdrop-blur-md border border-white/15 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#A58A5C]" />
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.24em] uppercase text-[#F4F1EB]">
              MODERN LUXURY · RICHMOND ROAD
            </span>
          </div>

          {/* 2. Main Headline with High Contrast Display Typography */}
          <h1 className="hero-headline mb-6 sm:mb-8">
            <span>A PLACE</span>
            <span className="hero-headline-sub">TO PAUSE.</span>
          </h1>

          {/* 3. Supporting Description */}
          <p className="font-sans text-base sm:text-lg md:text-xl font-light text-[#E2DDD5] max-w-xl leading-relaxed mb-8 sm:mb-10">
            Modern hospitality in the heart of Bengaluru.
          </p>

          {/* 4. Primary & Secondary CTA Buttons */}
          <div className="flex flex-wrap items-center gap-4 sm:gap-5">
            <button
              onClick={onOpenBooking}
              className="btn-luxury-primary !py-3.5 sm:!py-4 !px-7 sm:!px-8 text-xs tracking-[0.2em] rounded-none shadow-md"
              style={{
                backgroundColor: '#A58A5C',
                borderColor: '#A58A5C',
                color: '#111111',
              }}
            >
              <span>BOOK YOUR STAY</span>
              <ArrowUpRight size={14} />
            </button>

            <button
              onClick={scrollToExplore}
              className="btn-luxury-secondary on-dark !py-3.5 sm:!py-4 !px-7 sm:!px-8 text-xs tracking-[0.2em] rounded-none backdrop-blur-sm"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                borderColor: 'rgba(244, 241, 235, 0.25)',
              }}
            >
              <span>EXPLORE NOVA HOUSE</span>
              <ArrowDown size={13} />
            </button>
          </div>
        </div>

        {/* Bottom Metadata & Scroll Prompt */}
        <div className="flex items-center justify-between border-t border-white/15 pt-5 pb-2 text-xs text-[#F4F1EB]/80">
          <div className="font-mono text-[10px] sm:text-[11px] tracking-[0.16em] uppercase text-[#D8D0C3]/90 hidden md:block">
            DESIGNED FOR BUSINESS TRAVELLERS, COUPLES & GUESTS
          </div>

          <a
            href="#intro"
            onClick={scrollToExplore}
            className="flex items-center gap-2.5 text-inherit no-underline group hover:text-[#A58A5C] transition-colors ml-auto md:ml-0"
          >
            <span className="font-mono text-[10px] sm:text-[11px] tracking-[0.2em] uppercase">
              SCROLL TO DISCOVER
            </span>
            <ArrowDown size={13} className="group-hover:translate-y-0.5 transition-transform text-[#A58A5C]" />
          </a>
        </div>
      </div>
    </section>
  );
}
