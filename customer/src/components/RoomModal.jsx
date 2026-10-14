import React, { useState, useEffect } from 'react';
import { X, Check, BedDouble, Maximize2, Eye, Coffee, Wifi, Sparkles, ArrowUpRight } from 'lucide-react';

export default function RoomModal({ room, onClose, onSelectRoomForBooking }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  useEffect(() => {
    // Lock body scroll while modal is open
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  if (!room) return null;

  const images = [
    room.images.primary,
    room.images.detail1,
    room.images.detail2,
  ].filter(Boolean);

  const handleBookNow = () => {
    onSelectRoomForBooking(room.id);
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={`${room.title} Details`}
      data-lenis-prevent="true"
    >
      <div
        className="modal-dialog-content bg-[#F4F1EB] text-[#171717] w-full max-w-5xl shadow-2xl border border-[#D8D0C3] relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
        style={{
          borderRadius: '2px',
          maxHeight: '90vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Sticky Header with Close Button */}
        <div className="sticky top-0 z-30 bg-[#F4F1EB]/95 backdrop-blur-md px-6 py-4 border-b border-[#171717]/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="editorial-tag">{room.category}</span>
            <span className="font-serif text-xl sm:text-2xl font-light uppercase">{room.title}</span>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[#111111] hover:text-[#F4F1EB] transition-colors border border-[#171717]/10"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 sm:p-8 md:p-10 space-y-8">
          {/* Main Visual Carousel / Gallery */}
          <div className="space-y-3">
            <div className="img-editorial-wrap aspect-[16/9] w-full bg-[#E5DFD4]">
              <img
                src={images[activeImageIndex]}
                alt={`${room.title} view ${activeImageIndex + 1}`}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Thumbnail selector */}
            <div className="flex items-center gap-3">
              {images.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative overflow-hidden w-24 h-16 border transition-all ${
                    activeImageIndex === idx ? 'border-[#A58A5C] scale-95 ring-2 ring-[#A58A5C]/40' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="Thumbnail" className="w-full h-full object-cover" />
                </button>
              ))}
              <span className="font-mono text-xs text-[#77736C] ml-auto">
                0{activeImageIndex + 1} / 0{images.length}
              </span>
            </div>
          </div>

          {/* Quick Specifications Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-[#171717]/10 font-mono text-xs text-[#171717]">
            <div className="flex items-center gap-2">
              <Maximize2 size={16} className="text-[#A58A5C]" />
              <span>{room.size}</span>
            </div>
            <div className="flex items-center gap-2">
              <BedDouble size={16} className="text-[#A58A5C]" />
              <span>{room.bed}</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye size={16} className="text-[#A58A5C]" />
              <span>{room.view}</span>
            </div>
            <div className="flex items-center gap-2">
              <Wifi size={16} className="text-[#A58A5C]" />
              <span>Gigabit Wi-Fi 6</span>
            </div>
          </div>

          {/* Description & Rate */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
            <div className="md:col-span-7 space-y-4">
              <h3 className="font-serif text-2xl font-light text-[#171717]">The Experience</h3>
              <p className="text-sm sm:text-base text-[#77736C] leading-relaxed">
                {room.description}
              </p>

              <div className="pt-4">
                <h4 className="font-mono text-xs uppercase tracking-widest text-[#171717] mb-3">
                  Signature Inclusions
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-[#171717]/85">
                  {room.highlights.map((h, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <Check size={14} className="text-[#A58A5C] shrink-0 mt-0.5" />
                      <span>{h}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Architectural Details */}
              <div className="pt-4 space-y-2 border-t border-[#171717]/10 text-xs text-[#77736C]">
                <p><strong className="text-[#171717]">Bath & Spa:</strong> {room.specs.bath}</p>
                <p><strong className="text-[#171717]">Acoustics & Tech:</strong> {room.specs.technology}</p>
                <p><strong className="text-[#171717]">Amenities:</strong> {room.specs.amenities}</p>
              </div>
            </div>

            {/* Price Box & Action */}
            <div className="md:col-span-5 p-6 bg-[#ECE8E0] border border-[#D8D0C3] space-y-6">
              <div>
                <span className="font-mono text-[11px] uppercase tracking-widest text-[#77736C] block">
                  Nightly Sanctuary Rate
                </span>
                <div className="flex items-baseline gap-2 mt-1">
                  <span className="font-serif text-3xl sm:text-4xl font-light text-[#111111]">
                    {room.pricePerNight}
                  </span>
                  <span className="font-mono text-xs text-[#77736C]">/ night</span>
                </div>
                <p className="text-[11px] text-[#77736C] mt-2">
                  Inclusive of luxury concierge services, botanical bath rituals, and high-speed Wi-Fi.
                </p>
              </div>

              <button
                onClick={handleBookNow}
                className="w-full btn-luxury-primary !py-4"
                style={{ backgroundColor: '#111111', color: '#F4F1EB', borderColor: '#111111' }}
              >
                <span>Reserve {room.title}</span>
                <ArrowUpRight size={15} />
              </button>

              <div className="text-[11px] text-center font-mono text-[#77736C]">
                Free cancellation up to 48h prior · Guaranteed Best Direct Rate
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
