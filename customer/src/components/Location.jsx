import React, { useState } from 'react';
import { MapPin, Navigation, Compass, ExternalLink, ArrowRight, Car, Clock } from 'lucide-react';
import { LOCATION_DATA, HOTEL_INFO } from '../data/hotelData';

export default function Location() {
  const [selectedAttraction, setSelectedAttraction] = useState(LOCATION_DATA.attractions[0]);

  return (
    <section id="location" className="section-spacing section-dark relative overflow-hidden">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/10 pb-8 mb-16">
          <div>
            <span className="editorial-tag text-[#A58A5C] mb-4">Location & Neighborhood</span>
            <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl font-light uppercase leading-[0.95] tracking-tight text-[#FFFFFF]">
              Bengaluru, <br />
              <span className="italic font-normal text-[#E8E2D8]">at your doorstep.</span>
            </h2>
          </div>

          <div className="flex flex-col md:items-end gap-3">
            <div className="flex items-center gap-2 font-mono text-xs text-[#A58A5C] uppercase tracking-widest">
              <Compass size={14} />
              <span>Richmond Town · Central Bengaluru</span>
            </div>
            <p className="text-sm font-sans text-[#D8D0C3] max-w-sm md:text-right">
              {LOCATION_DATA.subheadline}
            </p>
          </div>
        </div>

        {/* Grid: Interactive Attractions + Styled Architectural Map View */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          {/* Left Column: Nearby Attractions Cards */}
          <div className="lg:col-span-5 space-y-3">
            <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-2 font-medium">
              Key Destinations & Drive Times
            </span>

            {LOCATION_DATA.attractions.map((attraction, idx) => {
              const isSelected = selectedAttraction.name === attraction.name;
              return (
                <div
                  key={attraction.name}
                  onClick={() => setSelectedAttraction(attraction)}
                  className={`p-5 border cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'border-[#A58A5C] translate-x-2 shadow-md'
                      : 'border-white/10 hover:border-white/25'
                  }`}
                  style={{
                    backgroundColor: isSelected ? '#1E1E1E' : '#141414',
                    color: '#F4F1EB',
                  }}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-serif text-xl font-light text-[#FFFFFF]">
                      {attraction.name}
                    </span>
                    <div className="flex items-center gap-2 font-mono text-xs text-[#A58A5C]">
                      <span>{attraction.distance}</span>
                      <span className="text-white/20">·</span>
                      <span className="flex items-center gap-1">
                        <Clock size={11} /> {attraction.driveTime}
                      </span>
                    </div>
                  </div>

                  <span className="font-mono text-[10px] uppercase tracking-wider text-[#A39F97] block mb-2 font-medium">
                    {attraction.type}
                  </span>

                  <p className="text-xs text-[#D8D0C3] font-sans leading-relaxed">
                    {attraction.note}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Right Column: Architectural Cartographic Canvas & Map UI */}
          <div className="lg:col-span-7 space-y-6">
            <div className="relative aspect-[16/11] w-full border border-white/15 bg-[#171717] overflow-hidden p-8 flex flex-col justify-between">
              {/* Architectural Grid Lines & Map Geometry */}
              <div
                className="absolute inset-0 pointer-events-none opacity-20"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 50% 50%, rgba(165,138,92,0.15) 0%, transparent 60%),
                    linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px),
                    linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)
                  `,
                  backgroundSize: '100% 100%, 48px 48px, 48px 48px',
                }}
              />

              {/* Decorative Concentric Radar Rings around Nova House */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-[#A58A5C]/20 rounded-full pointer-events-none" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-[#A58A5C]/10 rounded-full pointer-events-none" />

              {/* Top Map Bar */}
              <div className="relative z-10 flex items-center justify-between font-mono text-xs">
                <div className="flex items-center gap-2 bg-[#111111]/80 backdrop-blur-md px-3 py-1.5 border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-[#A58A5C] animate-ping" />
                  <span className="text-[#F4F1EB] uppercase tracking-wider">
                    NOVA HOUSE PINPOINT
                  </span>
                </div>
                <span className="text-[#D8D0C3]/60 hidden sm:inline">
                  {HOTEL_INFO.coordinates}
                </span>
              </div>

              {/* Central Marker Display */}
              <div className="relative z-10 my-auto text-center py-6">
                <div className="w-16 h-16 rounded-full bg-[#111111] border-2 border-[#A58A5C] mx-auto flex items-center justify-center text-[#A58A5C] shadow-2xl relative mb-4">
                  <MapPin size={26} />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-[#A58A5C] rounded-full animate-pulse" />
                </div>
                <h3 className="font-serif text-3xl font-light tracking-wide text-[#F4F1EB]">
                  NOVA HOUSE
                </h3>
                <p className="font-mono text-xs text-[#A58A5C] tracking-widest uppercase mt-1">
                  84 Residency Road, Richmond Town
                </p>
                <p className="text-xs text-[#D8D0C3]/70 font-sans mt-2 max-w-sm mx-auto">
                  Direct arterial proximity to MG Road, Lavelle Road luxury dining, and Kempegowda International Airport transit corridor.
                </p>
              </div>

              {/* Bottom Active Attraction Distance Callout */}
              <div className="relative z-10 bg-[#111111]/90 backdrop-blur-md p-4 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 font-mono text-xs">
                <div>
                  <span className="text-[#A58A5C] uppercase tracking-wider block">
                    Selected Destination:
                  </span>
                  <span className="font-serif text-base text-[#F4F1EB]">
                    {selectedAttraction.name} ({selectedAttraction.distance})
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[#D8D0C3]/70 flex items-center gap-1.5">
                    <Car size={13} className="text-[#A58A5C]" />
                    {selectedAttraction.driveTime} via Richmond Cir
                  </span>
                </div>
              </div>
            </div>

            {/* Action Bar with Direct Directions Link */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-[#161616] border border-white/10">
              <div>
                <h4 className="font-serif text-lg text-[#F4F1EB]">Chauffeur & Private Transfer</h4>
                <p className="text-xs text-[#D8D0C3]/70">
                  Complimentary airport transfer is extended for guests staying in our Penthouse Suites.
                </p>
              </div>

              <a
                href="https://maps.google.com/?q=Residency+Road+Richmond+Town+Bengaluru"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-luxury-primary !py-3.5 !px-6 text-xs whitespace-nowrap tracking-widest shrink-0"
                style={{ backgroundColor: '#A58A5C', borderColor: '#A58A5C', color: '#111111' }}
              >
                <span>Get Directions →</span>
                <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
