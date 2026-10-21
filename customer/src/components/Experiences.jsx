import React, { useState } from 'react';
import { Clock, Thermometer, Check } from 'lucide-react';
import { motion } from 'motion/react';
import { EXPERIENCES_DATA } from '../data/hotelData';

export default function Experiences() {
  // Default to first experience (Rooftop Pool)
  const [activeIndex, setActiveIndex] = useState(0);

  const activeExp = EXPERIENCES_DATA[activeIndex] || EXPERIENCES_DATA[0];

  return (
    <section id="experience" className="section-spacing section-dark relative overflow-hidden">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8 mb-16">
          <div>
            <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl font-light uppercase leading-[0.95] tracking-tight text-[#FFFFFF]">
              The city outside. <br />
              <span className="italic font-normal text-[#E8E2D7]">The calm within.</span>
            </h2>
          </div>

          <p className="text-sm font-sans text-[#B8B3AA] max-w-sm md:text-right">
            Curated spaces dedicated to restoration, movement, and perspective high above the city canopy.
          </p>
        </div>

        {/* Interactive Experience Grid / Split Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-stretch">
          {/* Left Column: Interactive Nav Cards */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              {EXPERIENCES_DATA.map((exp, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <motion.div
                    key={exp.id || idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onFocus={() => setActiveIndex(idx)}
                    onClick={() => setActiveIndex(idx)}
                    whileHover={{ x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActiveIndex(idx);
                      }
                    }}
                    className={`experience-card group cursor-pointer ${isActive ? 'is-active' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                            isActive
                              ? 'bg-[#B69A68] scale-100 opacity-100 shadow-[0_0_8px_rgba(182,154,104,0.6)]'
                              : 'bg-transparent scale-0 opacity-0'
                          }`}
                        />
                        <h3 className="experience-card-title">
                          <span className="title-text">{exp.title}</span>
                        </h3>
                      </div>
                      <span className="experience-card-arrow">
                        →
                      </span>
                    </div>

                    <p className="experience-card-subtitle">
                      {exp.subtitle}
                    </p>

                    <div
                      className={`overflow-hidden transition-all duration-500 ease-out ${
                        isActive
                          ? 'max-h-48 opacity-100 mt-3 pt-3 border-t border-white/10'
                          : 'max-h-0 opacity-0 mt-0 pt-0 border-t-0'
                      }`}
                    >
                      <p className="experience-card-desc">
                        {exp.description}
                      </p>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Quick concierge notice */}
            <div className="p-4 bg-[#141414] border border-white/10 text-xs font-mono text-[#B8B3AA] flex items-center justify-between">
              <span>Private Sessions Available</span>
              <span className="text-[#B69A68]">Dial Concierge (Ext. 0)</span>
            </div>
          </div>

          {/* Right Column: Immersive Full Showcase with Cinematic Image Crossfade */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="relative aspect-[16/11] lg:aspect-auto lg:h-full min-h-[460px] overflow-hidden border border-white/10 bg-[#0B0B0B] group">
              {/* Stacked Images for Smooth Opacity & Scale Transition */}
              {EXPERIENCES_DATA.map((exp, idx) => {
                const isActive = idx === activeIndex;
                return (
                  <div
                    key={exp.id || idx}
                    className={`absolute inset-0 transition-all duration-700 ease-out will-change-transform ${
                      isActive
                        ? 'opacity-100 scale-100 z-10'
                        : 'opacity-0 scale-[1.04] pointer-events-none z-0'
                    }`}
                  >
                    <img
                      src={exp.image}
                      alt={exp.title}
                      loading={idx === 0 ? 'eager' : 'lazy'}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                    />
                  </div>
                );
              })}

              {/* Cinematic Vignette Overlay */}
              <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-[#0B0B0B] via-black/25 to-transparent" />

              {/* Bottom Details Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-30 pointer-events-none bg-gradient-to-t from-[#0B0B0B] via-[#0B0B0B]/90 to-transparent">
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#B8B3AA] mb-4">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 border border-white/10">
                    <Clock size={13} className="text-[#B69A68]" />
                    <span>{activeExp.hours}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 border border-white/10">
                    <Thermometer size={13} className="text-[#B69A68]" />
                    <span>{activeExp.temp}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#F5F2EA]/90">
                  {activeExp.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check size={13} className="text-[#B69A68] shrink-0" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
