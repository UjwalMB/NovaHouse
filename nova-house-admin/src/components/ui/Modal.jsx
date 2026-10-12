import React, { useEffect } from 'react';
import { X } from 'lucide-react';

export default function Modal({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-xl',
  footer,
}) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className={`modal-content ${maxWidth}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-[#ECE8E0] flex items-center justify-between">
          <div>
            {subtitle && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block mb-0.5">
                {subtitle}
              </span>
            )}
            <h3 className="font-serif text-xl font-light uppercase text-[#111111]">
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-sm flex items-center justify-center text-[#77736C] hover:bg-[#F4F1EB] hover:text-[#111111] transition-colors"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6">{children}</div>

        {footer && (
          <div className="p-4 px-6 bg-[#FAF8F5] border-t border-[#ECE8E0] flex items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
