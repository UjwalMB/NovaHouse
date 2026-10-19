import React, { useState } from 'react';
import { Maximize2, Sparkles } from 'lucide-react';
import { GALLERY_DATA } from '../data/hotelData';

export default function Gallery({ onOpenLightbox }) {
  const [activeCategory, setActiveCategory] = useState('All');

  const categories = ['All', 'Architecture', 'Suites', 'Restaurant', 'Rooftop', 'Wellness'];

  const filteredItems = activeCategory === 'All'
    ? GALLERY_DATA
    : GALLERY_DATA.filter((item) => {
        if (activeCategory === 'Architecture') return item.category === 'Architecture' || item.category === 'Lobby';
        if (activeCategory === 'Restaurant') return item.category === 'Restaurant';
        if (activeCategory === 'Suites') return item.category === 'Suites' || item.category === 'Rooms';
        if (activeCategory === 'Rooftop') return item.category === 'Rooftop';
        if (activeCategory === 'Wellness') return item.category === 'Wellness';
        return true;
      });

  return (
    <section id="gallery" className="section-spacing bg-[#F7F5EF] text-[#181818] relative">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#181818]/10 pb-8 mb-16">
          <div>
            <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl font-light uppercase leading-[0.95] tracking-tight">
              An architectural <br />
              <span className="italic font-normal text-[#B69A68]">visual archive.</span>
            </h2>
          </div>

          <div className="flex flex-col md:items-end gap-4">
            <p className="text-sm font-sans text-[#77736B] max-w-sm md:text-right">
              Moments of light, crafted materials, and secluded tranquil corners captured across NOVA HOUSE.
            </p>

            {/* Category Filter Pills with Tactile Luxury Tabs */}
            <div className="filter-tabs-container flex-wrap shadow-sm">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`filter-tab-btn ${isActive ? 'is-active' : ''}`}
                    aria-pressed={isActive}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Editorial Asymmetric Masonry Layout */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {filteredItems.map((item, index) => {
            // Assign custom column spans for high-end editorial cadence
            let colSpan = 'md:col-span-4';
            let aspectClass = 'aspect-[4/3]';

            if (index % 5 === 0) {
              colSpan = 'md:col-span-8';
              aspectClass = 'aspect-[16/10]';
            } else if (index % 5 === 1) {
              colSpan = 'md:col-span-4';
              aspectClass = 'aspect-[3/4]';
            } else if (index % 5 === 2) {
              colSpan = 'md:col-span-4';
              aspectClass = 'aspect-[4/5]';
            } else if (index % 5 === 3) {
              colSpan = 'md:col-span-4';
              aspectClass = 'aspect-square';
            } else if (index % 5 === 4) {
              colSpan = 'md:col-span-4';
              aspectClass = 'aspect-[4/3]';
            }

            return (
              <div
                key={item.id}
                className={`${colSpan} group relative overflow-hidden bg-[#FBFAF6] border border-[#181818]/10 hover:border-[#B69A68]/50 hover:-translate-y-1 transition-all duration-500 ease-out cursor-pointer shadow-xs hover:shadow-md`}
                onClick={() => onOpenLightbox(item, filteredItems)}
              >
                <div className={`w-full ${aspectClass} overflow-hidden relative bg-[#E8E2D7]`}>
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transform scale-100 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  />

                  {/* High contrast gradient overlay so text is ALWAYS clearly legible */}
                  <div
                    className="absolute inset-0 pointer-events-none transition-opacity duration-300"
                    style={{
                      background: 'linear-gradient(to top, rgba(11, 11, 11, 0.88) 0%, rgba(11, 11, 11, 0.35) 45%, transparent 75%)',
                    }}
                  />

                  {/* Floating Content shown clearly over photo */}
                  <div className="absolute inset-0 p-5 sm:p-6 flex flex-col justify-between pointer-events-none z-10">
                    <div className="flex items-center justify-between">
                      <span
                        className="font-mono text-[10px] tracking-widest uppercase px-2.5 py-1 font-medium shadow-md"
                        style={{
                          backgroundColor: 'rgba(17, 17, 17, 0.92)',
                          color: '#F5F2EA',
                          border: '1px solid rgba(245, 242, 234, 0.25)',
                        }}
                      >
                        {item.category}
                      </span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-12"
                        style={{
                          backgroundColor: 'rgba(17, 17, 17, 0.92)',
                          border: '1px solid rgba(245, 242, 234, 0.25)',
                        }}
                      >
                        <Maximize2 size={13} className="text-[#B69A68]" />
                      </div>
                    </div>

                    <div>
                      <h4
                        className="font-serif text-xl sm:text-2xl font-light text-[#FFFFFF] transform transition-transform duration-500 ease-out group-hover:-translate-y-1"
                        style={{
                          textShadow: '0 2px 12px rgba(0, 0, 0, 0.85)',
                          color: '#FFFFFF',
                        }}
                      >
                        {item.title}
                      </h4>
                      <span
                        className="font-mono text-[11px] uppercase tracking-wider block mt-1 font-medium transition-colors duration-300 group-hover:text-[#FFFFFF]"
                        style={{
                          color: '#B69A68',
                          textShadow: '0 1px 6px rgba(0, 0, 0, 0.8)',
                        }}
                      >
                        View High-Resolution Image →
                      </span>
                    </div>
                  </div>
                </div>

                {/* Permanent baseline caption with category (no decorative numbers) */}
                <div
                  className="p-3.5 border-t border-[#181818]/10 flex items-center justify-between text-xs font-mono"
                  style={{ backgroundColor: '#FBFAF6', color: '#181818' }}
                >
                  <span className="truncate font-medium">{item.title}</span>
                  <span className="text-[10px] uppercase tracking-widest text-[#B69A68] font-semibold">{item.category}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
