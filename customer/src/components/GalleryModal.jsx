import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, Maximize2 } from 'lucide-react';

export default function GalleryModal({ item, allItems, onClose, onSelectNext, onSelectPrev }) {
  if (!item) return null;

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') onSelectNext();
      if (e.key === 'ArrowLeft') onSelectPrev();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose, onSelectNext, onSelectPrev]);

  const currentIndex = allItems.findIndex((it) => it.id === item.id);

  return (
    <div
      className="modal-overlay !bg-black/90"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Gallery Lightbox"
      data-lenis-prevent="true"
    >
      <div
        className="relative max-w-6xl w-full max-h-[92vh] flex flex-col items-center justify-center p-4"
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
      >
        {/* Top Control Bar */}
        <div className="w-full flex items-center justify-between text-[#F4F1EB] pb-4 border-b border-white/10 font-mono text-xs">
          <div className="flex items-center gap-3">
            <span className="text-[#A58A5C] uppercase tracking-widest">{item.category}</span>
            <span className="text-white/40">/</span>
            <span className="font-serif text-base tracking-wide">{item.title}</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-white/60">
              0{currentIndex + 1} / 0{allItems.length}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close lightbox"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Image Frame */}
        <div className="relative w-full flex items-center justify-center my-4 overflow-hidden max-h-[75vh]">
          <img
            src={item.image}
            alt={item.title}
            className="max-w-full max-h-[75vh] object-contain shadow-2xl transition-all duration-300"
          />

          {/* Navigation Arrows */}
          <button
            onClick={onSelectPrev}
            className="absolute left-3 p-3 bg-black/60 hover:bg-[#A58A5C] hover:text-[#111111] text-white transition-all backdrop-blur-md"
            aria-label="Previous image"
          >
            <ChevronLeft size={22} />
          </button>

          <button
            onClick={onSelectNext}
            className="absolute right-3 p-3 bg-black/60 hover:bg-[#A58A5C] hover:text-[#111111] text-white transition-all backdrop-blur-md"
            aria-label="Next image"
          >
            <ChevronRight size={22} />
          </button>
        </div>

        {/* Footer info */}
        <div className="w-full text-center text-xs font-mono text-[#D8D0C3]/60 tracking-wider">
          Use ← and → arrow keys to navigate · Press ESC to close
        </div>
      </div>
    </div>
  );
}
