import React from 'react';
import { Sparkles, Compass, ShieldCheck, Heart } from 'lucide-react';

export default function Intro() {
  return (
    <section id="intro" className="section-spacing bg-[#F4F1EB] text-[#171717] relative overflow-hidden">
      <div className="container-luxury">
        {/* Section Index Marker */}
        <div className="flex items-center justify-between border-b border-[#171717]/10 pb-5 mb-12 sm:mb-16">
          <span className="editorial-tag">01 / Introduction</span>
          <span className="font-mono text-xs uppercase tracking-widest text-[#77736C]">
            NOVA HOUSE · Philosophy
          </span>
        </div>

        {/* Asymmetric 58% / 42% Editorial Grid */}
        <div className="editorial-intro-grid">
          {/* LEFT COLUMN: 55-60% Editorial Content */}
          <div className="flex flex-col justify-between">
            <div>
              {/* Requested Editorial Eyebrow Stack */}
              <div className="space-y-2 mb-8">
                <span className="font-mono text-xs uppercase tracking-[0.22em] text-[#A58A5C] block font-medium">
                  Bengaluru.
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl md:text-5xl font-light uppercase tracking-tight leading-[1.05] text-[#111111]">
                  NOVA HOUSE
                </h2>
                <div className="font-mono text-[10px] sm:text-xs uppercase tracking-[0.25em] text-[#77736C]">
                  BENGALURU · INDIA
                </div>
              </div>

              {/* Editorial Introduction Paragraphs with Comfortable Reading Width */}
              <div className="space-y-5 mb-10 max-w-xl">
                <p className="font-serif text-2xl sm:text-3xl font-light text-[#171717] leading-snug">
                  More than a hotel. <span className="italic text-[#A58A5C]">A space to slow down.</span>
                </p>

                <p className="font-sans text-base sm:text-lg font-light text-[#171717]/90 leading-relaxed">
                  NOVA HOUSE brings together thoughtful architecture, refined interiors, exceptional dining and warm hospitality in the heart of Bengaluru.
                </p>

                <p className="editorial-body-text">
                  Amidst the kinetic hum of India's Silicon Valley, we engineered an architectural sanctuary of silence and light. Hand-finished travertine, monolithic timber millwork, and sound-insulated courtyards create an atmosphere where meetings give way to reflection, and travel feels effortless.
                </p>

                <p className="editorial-body-text">
                  Every detail is considered: from morning pour-overs prepared with regional single-origin beans, to evening dips in our rooftop infinity pool as twilight washes over Richmond Town.
                </p>
              </div>
            </div>

            {/* 10. The Three Feature Columns (Equal Spacing, Equal Weight) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-7 pt-8 border-t border-[#171717]/12 mt-4">
              <div className="space-y-2">
                <span className="font-mono text-[11px] text-[#A58A5C] tracking-[0.2em] block font-medium">01 / CALM</span>
                <h3 className="font-serif text-lg font-normal text-[#111111]">Acoustic Solitude</h3>
                <p className="font-sans text-xs text-[#77736C] leading-relaxed">
                  Dual-glazed structural envelopes buffering city velocity.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-[11px] text-[#A58A5C] tracking-[0.2em] block font-medium">02 / CRAFT</span>
                <h3 className="font-serif text-lg font-normal text-[#111111]">Tactile Modernism</h3>
                <p className="font-sans text-xs text-[#77736C] leading-relaxed">
                  Locally sourced Bidar stone, Karnataka teak, and brass.
                </p>
              </div>

              <div className="space-y-2">
                <span className="font-mono text-[11px] text-[#A58A5C] tracking-[0.2em] block font-medium">03 / CARE</span>
                <h3 className="font-serif text-lg font-normal text-[#111111]">Intuitive Service</h3>
                <p className="font-sans text-xs text-[#77736C] leading-relaxed">
                  Attentive yet unobtrusive hospitality tailored to each stay.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 40-45% Visual Composition & Aligned Location Card */}
          <div className="flex flex-col gap-6 sm:gap-8">
            {/* 9. About Image with Consistent Aspect Ratio & Caption */}
            <div className="img-editorial-wrap shadow-sm aspect-[4/5] w-full border border-[#171717]/10">
              <img
                src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=85"
                alt="NOVA HOUSE Interior Light and Architecture"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-[#111111]/85 text-[#F4F1EB] p-3 backdrop-blur-md flex items-center justify-between text-[11px] font-mono">
                <span>Natural Morning Light · 08:30 AM</span>
                <span className="text-[#A58A5C]">The Lobby Gallery</span>
              </div>
            </div>

            {/* 11. Curated Urban Orientation Card aligned cleanly below */}
            <div className="p-6 bg-[#ECE8E0] border border-[#D8D0C3] flex items-start gap-4 shadow-sm">
              <div className="p-2.5 bg-[#111111] text-[#F4F1EB] shrink-0">
                <Compass size={18} className="text-[#A58A5C]" />
              </div>
              <div>
                <h4 className="font-serif text-base font-medium text-[#111111] mb-1.5">
                  Curated Urban Orientation
                </h4>
                <p className="font-sans text-xs text-[#77736C] leading-relaxed">
                  Steps away from the lush canopy of Cubbon Park, the contemporary art pavilions of Lavelle Road, and the central financial district.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
