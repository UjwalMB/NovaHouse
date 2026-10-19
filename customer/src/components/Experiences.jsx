import React, { useState } from 'react';
import { Clock, Thermometer, Check } from 'lucide-react';
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
            <span className="editorial-tag text-[#A58A5C] mb-4">Experience</span>
            <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl font-light uppercase leading-[0.95] tracking-tight text-[#FFFFFF]">
              The city outside. <br />
              <span className="italic font-normal text-[#E8E2D8]">The calm within.</span>
            </h2>
          </div>

          <p className="text-sm font-sans text-[#D8D0C3] max-w-sm md:text-right">
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
                  <div
                    key={exp.id || idx}
                    onMouseEnter={() => setActiveIndex(idx)}
                    onFocus={() => setActiveIndex(idx)}
                    onClick={() => setActiveIndex(idx)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        setActiveIndex(idx);
                      }
                    }}
                    className={`cursor-pointer p-6 border transition-all duration-300 outline-none ${
                      isActive
                        ? 'border-[#A58A5C] translate-x-1 sm:translate-x-2 shadow-lg bg-[#1F1E1C]'
                        : 'border-white/10 hover:border-white/25 bg-[#141414] hover:bg-[#181817]'
                    }`}
                    style={{ color: '#F4F1EB' }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className={`font-mono text-[10px] tracking-[0.2em] uppercase font-medium transition-colors ${
                        isActive ? 'text-[#A58A5C]' : 'text-[#A58A5C]/70'
                      }`}>
                        0{idx + 1} / {exp.category}
                      </span>
                      <span
                        className={`w-2 h-2 rounded-full transition-all duration-300 ${
                          isActive ? 'bg-[#A58A5C] scale-100 opacity-100' : 'bg-transparent scale-50 opacity-0'
                        }`}
                      />
                    </div>

                    <h3 className="font-serif text-2xl font-light uppercase tracking-wide text-[#FFFFFF] transition-colors">
                      {exp.title}
                    </h3>

                    <p className="font-mono text-xs text-[#D8D0C3] uppercase tracking-wider mt-1">
                      {exp.subtitle}
                    </p>

                    <div
                      className={`overflow-hidden transition-all duration-500 ease-out ${
                        isActive
                          ? 'max-h-48 opacity-100 mt-3 pt-3 border-t border-white/10'
                          : 'max-h-0 opacity-0 mt-0 pt-0 border-t-0'
                      }`}
                    >
                      <p className="text-xs text-[#D8D0C3] font-sans leading-relaxed">
                        {exp.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Quick concierge notice */}
            <div className="p-4 bg-[#191919] border border-white/10 text-xs font-mono text-[#D8D0C3]/70 flex items-center justify-between">
              <span>Private Sessions Available</span>
              <span className="text-[#A58A5C]">Dial Concierge (Ext. 0)</span>
            </div>
          </div>

          {/* Right Column: Immersive Full Showcase with Cinematic Image Crossfade */}
          <div className="lg:col-span-7 flex flex-col">
            <div className="relative aspect-[16/11] lg:aspect-auto lg:h-full min-h-[460px] overflow-hidden border border-white/10 bg-[#141414] group">
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
                      className="w-full h-full object-cover transition-transform duration-1000 ease-out group-hover:scale-105"
                    />
                  </div>
                );
              })}

              {/* Cinematic Vignette Overlay */}
              <div className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-t from-[#111111] via-black/20 to-transparent" />

              {/* Bottom Details Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 z-30 pointer-events-none bg-gradient-to-t from-[#111111] via-[#111111]/90 to-transparent">
                <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-[#D8D0C3] mb-4">
                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1">
                    <Clock size={13} className="text-[#A58A5C]" />
                    <span>{activeExp.hours}</span>
                  </div>

                  <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1">
                    <Thermometer size={13} className="text-[#A58A5C]" />
                    <span>{activeExp.temp}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-[#F4F1EB]/90">
                  {activeExp.features.map((feat, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Check size={13} className="text-[#A58A5C] shrink-0" />
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
