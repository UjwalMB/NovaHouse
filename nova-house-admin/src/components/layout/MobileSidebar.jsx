import React from 'react';
import { X } from 'lucide-react';
import Sidebar from './Sidebar';

export default function MobileSidebar({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 left-0 w-[280px] bg-[#111111] z-10 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
        <div className="absolute top-4 right-4 z-20">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            aria-label="Close mobile sidebar"
          >
            <X size={16} />
          </button>
        </div>
        <Sidebar onCloseMobile={onClose} />
      </div>
    </div>
  );
}
