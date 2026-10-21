import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import { motion } from 'motion/react';
import { buttonPrimaryGlow } from '../utils/animations';

export default function FinalCTA({ onOpenBooking }) {
  return (
    <section className="relative w-full py-28 md:py-40 bg-[#111111] text-[#F5F2EA] section-dark overflow-hidden flex items-center justify-center">
      {/* Background Cinematic Dusk Visual */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1576013551627-0cc20b96c2a7?auto=format&fit=crop&w=2400&q=90"
          alt="NOVA HOUSE Sunset Skyline View"
          className="w-full h-full object-cover object-center transform scale-105"
          style={{
            filter: 'brightness(0.45) contrast(1.15)',
          }}
        />
        {/* High contrast gradient scrim for guaranteed readability */}
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(180deg, rgba(11, 11, 11, 0.82) 0%, rgba(11, 11, 11, 0.48) 45%, rgba(11, 11, 11, 0.94) 100%)',
          }}
        />
        <div className="absolute inset-0 pointer-events-none opacity-10 architectural-grid-subtle" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="container-luxury relative z-10 text-center max-w-4xl space-y-8"
      >
        <h2
          className="font-serif text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-light uppercase tracking-tight leading-[0.9] text-[#FFFFFF]"
          style={{ textShadow: '0 4px 24px rgba(0, 0, 0, 0.7)' }}
        >
          See you <br />
          <span className="italic font-normal text-[#E8E2D7]">in Bengaluru.</span>
        </h2>

        <p
          className="font-sans text-base sm:text-lg md:text-xl font-light text-[#B8B3AA] max-w-xl mx-auto leading-relaxed"
          style={{ textShadow: '0 2px 10px rgba(0, 0, 0, 0.7)' }}
        >
          Where thoughtful architecture meets warm southern hospitality. Your personal sanctuary awaits.
        </p>

        <div className="pt-4">
          <motion.button
            onClick={onOpenBooking}
            {...buttonPrimaryGlow}
            className="btn-luxury-primary !py-5 !px-10 text-xs tracking-[0.22em] font-semibold shadow-lg cursor-pointer"
            style={{
              backgroundColor: '#B69A68',
              borderColor: '#B69A68',
              color: '#111111',
            }}
          >
            <span>Book Your Stay</span>
            <ArrowUpRight size={16} />
          </motion.button>
        </div>

        <div className="pt-6">
          <span
            className="inline-block px-4 py-2 text-xs font-mono tracking-widest uppercase shadow-md"
            style={{
              backgroundColor: 'rgba(11, 11, 11, 0.85)',
              color: '#F5F2EA',
              border: '1px solid rgba(245, 242, 234, 0.25)',
              backdropFilter: 'blur(8px)',
            }}
          >
            84 Residency Road · Richmond Town · Bengaluru 560025
          </span>
        </div>
      </motion.div>
    </section>
  );
}
