import React from 'react';
import { Sparkles, Compass, ShieldCheck, Heart } from 'lucide-react';

export default function Intro() {
  return (
    <section id="intro" className="section-spacing bg-[#F7F5EF] text-[#181818] relative overflow-hidden">
      <div className="container-luxury">
        {/* Asymmetric 58% / 42% Editorial Grid */}
        <div className="editorial-intro-grid pt-2">
          {/* LEFT COLUMN: 55-60% Editorial Content */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="mb-6">
                <h2 className="font-serif text-4xl sm:text-5xl md:text-6xl font-light uppercase tracking-tight leading-[1.0] text-[#181818]">
                  NOVA HOUSE
                </h2>
              </div>

              {/* Editorial Introduction Paragraphs with Comfortable Reading Width */}
              <div className="space-y-5 mb-10 max-w-xl">
                <p className="font-serif text-2xl sm:text-3xl font-light text-[#181818] leading-snug">
                  More than a hotel. <span className="italic text-[#B69A68]">A space to slow down.</span>
                </p>

                <p className="font-sans text-base sm:text-lg font-light text-[#181818]/90 leading-relaxed">
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

            {/* The Three Feature Columns (Equal Spacing, Light Card Surface) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 pt-8 border-t border-[#181818]/10 mt-4">
              <div className="p-5 bg-[#FBFAF6] border border-[#181818]/10 space-y-2 shadow-xs hover:-translate-y-1 hover:border-[#B69A68]/40 hover:shadow-md transition-all duration-400 ease-out">
                <span className="font-mono text-[11px] text-[#B69A68] tracking-[0.2em] block font-medium">CALM</span>
                <h3 className="font-serif text-lg font-normal text-[#181818]">Acoustic Solitude</h3>
                <p className="font-sans text-xs text-[#77736B] leading-relaxed">
                  Dual-glazed structural envelopes buffering city velocity.
                </p>
              </div>

              <div className="p-5 bg-[#FBFAF6] border border-[#181818]/10 space-y-2 shadow-xs hover:-translate-y-1 hover:border-[#B69A68]/40 hover:shadow-md transition-all duration-400 ease-out">
                <span className="font-mono text-[11px] text-[#B69A68] tracking-[0.2em] block font-medium">CRAFT</span>
                <h3 className="font-serif text-lg font-normal text-[#181818]">Tactile Modernism</h3>
                <p className="font-sans text-xs text-[#77736B] leading-relaxed">
                  Locally sourced Bidar stone, Karnataka teak, and brass.
                </p>
              </div>

              <div className="p-5 bg-[#FBFAF6] border border-[#181818]/10 space-y-2 shadow-xs hover:-translate-y-1 hover:border-[#B69A68]/40 hover:shadow-md transition-all duration-400 ease-out">
                <span className="font-mono text-[11px] text-[#B69A68] tracking-[0.2em] block font-medium">CARE</span>
                <h3 className="font-serif text-lg font-normal text-[#181818]">Intuitive Service</h3>
                <p className="font-sans text-xs text-[#77736B] leading-relaxed">
                  Attentive yet unobtrusive hospitality tailored to each stay.
                </p>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: 40-45% Visual Composition & Aligned Location Card */}
          <div className="flex flex-col gap-6 sm:gap-8">
            {/* About Image with Consistent Aspect Ratio & Caption */}
            <div className="img-editorial-wrap shadow-sm aspect-[4/5] w-full border border-[#181818]/10">
              <img
                src="https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=85"
                alt="NOVA HOUSE Interior Light and Architecture"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-3 left-3 right-3 bg-[#0B0B0B]/85 text-[#F5F2EA] p-3 backdrop-blur-md flex items-center justify-between text-[11px] font-mono border border-white/10">
                <span>Natural Morning Light · 08:30 AM</span>
                <span className="text-[#B69A68]">The Lobby Gallery</span>
              </div>
            </div>

            {/* Curated Urban Orientation Card aligned cleanly below */}
            <div className="p-6 bg-[#FBFAF6] border border-[#181818]/10 flex items-start gap-4 shadow-sm">
              <div className="p-2.5 bg-[#181818] text-[#F5F2EA] shrink-0">
                <Compass size={18} className="text-[#B69A68]" />
              </div>
              <div>
                <h4 className="font-serif text-base font-medium text-[#181818] mb-1.5">
                  Curated Urban Orientation
                </h4>
                <p className="font-sans text-xs text-[#77736B] leading-relaxed">
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
