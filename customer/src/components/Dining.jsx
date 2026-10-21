import React, { useState } from 'react';
import { ArrowRight, Utensils, Wine, Clock, Sparkles } from 'lucide-react';
import { motion } from 'motion/react';
import { DINING_DATA } from '../data/hotelData';
import { buttonPrimaryGlow } from '../utils/animations';

export default function Dining({ onOpenDiningMenu }) {
  const [selectedPeriod, setSelectedPeriod] = useState(DINING_DATA.periods[2]); // Default Dinner

  return (
    <section id="dining" className="section-spacing section-dark relative overflow-hidden">
      {/* Background Ambience Subtle Glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[#B69A68]/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="container-luxury relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8 mb-16">
          <div>
            <div className="flex items-center gap-4">
              <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl font-light uppercase leading-[0.95] tracking-tight text-[#FFFFFF]">
                Good food. <br />
                <span className="italic font-normal text-[#E8E2D7]">Good company.</span>
              </h2>
            </div>
          </div>

          <div className="flex flex-col md:items-end gap-4">
            <span className="font-serif text-2xl tracking-[0.2em] text-[#B69A68] uppercase font-light">
              {DINING_DATA.restaurantName}
            </span>
            <p className="text-sm font-sans text-[#B8B3AA] max-w-md md:text-right">
              {DINING_DATA.description}
            </p>
          </div>
        </div>

        {/* Visual Showcase: Asymmetric Editorial Columns */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center mb-16">
          {/* Main Dining Room Feature */}
          <div className="lg:col-span-7">
            <div className="relative aspect-[16/10] overflow-hidden border border-white/10 group bg-[#0B0B0B]">
              <img
                src={DINING_DATA.imageMain}
                alt="EMBER Dining Room"
                className="w-full h-full object-cover transform scale-100 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0B0B0B] via-transparent to-transparent opacity-85" />
              <div className="absolute bottom-6 left-6 right-6 flex items-end justify-between">
                <div>
                  <span className="font-mono text-[10px] tracking-widest text-[#B69A68] uppercase block mb-1">
                    The Hearth Salon
                  </span>
                  <h4 className="font-serif text-2xl sm:text-3xl font-light text-[#FFFFFF]">Charcoal & Brass Interior</h4>
                </div>
                <span className="font-mono text-xs text-[#B8B3AA] hidden sm:inline">
                  {DINING_DATA.chef}
                </span>
              </div>
            </div>
          </div>

          {/* Secondary Gastronomy Images */}
          <div className="lg:col-span-5 grid grid-cols-2 gap-4">
            <div className="relative aspect-square overflow-hidden border border-white/10 group bg-[#0B0B0B]">
              <img
                src={DINING_DATA.imageFood}
                alt="Culinary Creation at EMBER"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              />
              <div className="absolute bottom-3 left-3 bg-[#0B0B0B]/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-[#B8B3AA] border border-white/10">
                Seasonal Plating
              </div>
            </div>

            <div className="relative aspect-square overflow-hidden border border-white/10 group bg-[#0B0B0B]">
              <img
                src={DINING_DATA.imageCocktail}
                alt="Botanical Cocktail Alchemy"
                className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-700 ease-out"
              />
              <div className="absolute bottom-3 left-3 bg-[#0B0B0B]/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-[#B8B3AA] border border-white/10">
                Apothecary Bar
              </div>
            </div>

            <div className="col-span-2 p-6 bg-[#141414] border border-white/10 flex items-center justify-between">
              <div>
                <span className="font-mono text-[11px] text-[#B69A68] uppercase tracking-widest block mb-1">
                  Private Cellar
                </span>
                <p className="text-xs text-[#B8B3AA]">
                  400 biodynamic labels from the Old World & nascent Indian vineyards.
                </p>
              </div>
              <Wine size={20} className="text-[#B69A68] shrink-0 ml-4" />
            </div>
          </div>
        </div>

        {/* Interactive Meal Period Tabs & Highlights */}
        <div className="border border-white/10 bg-[#141414] p-6 sm:p-10 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-6">
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              {DINING_DATA.periods.map((period) => (
                <motion.button
                  key={period.id}
                  onClick={() => setSelectedPeriod(period)}
                  whileTap={{ scale: 0.95 }}
                  whileHover={{ y: -1 }}
                  transition={{ duration: 0.15 }}
                  className={`px-4 py-2.5 text-xs font-mono tracking-widest uppercase transition-colors cursor-pointer ${
                    selectedPeriod.id === period.id
                      ? 'bg-[#B69A68] text-[#111111] font-semibold shadow-sm'
                      : 'bg-[#1C1C1A] text-[#B8B3AA] hover:text-[#F5F2EA] hover:bg-[#252522]'
                  }`}
                >
                  {period.name}
                </motion.button>
              ))}
            </div>

            <div className="flex items-center gap-2 text-xs font-mono text-[#B69A68]">
              <Clock size={14} />
              <span>{selectedPeriod.hours}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
            <div className="md:col-span-7 space-y-3">
              <span className="font-mono text-xs uppercase tracking-widest text-[#B69A68]">
                {selectedPeriod.name} Philosophy
              </span>
              <h3 className="font-serif text-3xl font-light text-[#F5F2EA]">
                {selectedPeriod.highlight}
              </h3>
              <p className="text-sm text-[#B8B3AA] font-sans leading-relaxed">
                {selectedPeriod.description}
              </p>
            </div>

            <div className="md:col-span-5 flex flex-col sm:flex-row md:flex-col justify-end gap-4">
              <motion.button
                onClick={onOpenDiningMenu}
                {...buttonPrimaryGlow}
                className="btn-luxury-primary !py-4 text-xs tracking-widest w-full cursor-pointer"
                style={{ backgroundColor: '#B69A68', borderColor: '#B69A68', color: '#111111' }}
              >
                <span>Explore Dining →</span>
                <ArrowRight size={14} />
              </motion.button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
