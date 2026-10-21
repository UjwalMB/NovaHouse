import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowUpRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { HOTEL_INFO } from '../data/hotelData';
import { buttonPrimaryGlow, buttonTactile } from '../utils/animations';

export default function Navbar({ onOpenBooking }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Stay', href: '#stay' },
    { label: 'Experience', href: '#experience' },
    { label: 'Offers', href: '#offers' },
    { label: 'Dining', href: '#dining' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'Location', href: '#location' },
    { label: 'About', href: '#intro' },
  ];

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    setMobileMenuOpen(false);
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <>
      <header className={`site-header ${scrolled ? 'is-scrolled' : 'is-hero'}`}>
        <div className="container-luxury flex items-center justify-between">
          {/* LEFT: Brand & Subline */}
          <div className="flex items-center gap-6">
            <a
              href="#"
              className="group flex flex-col no-underline text-inherit"
              aria-label="Nova House Home"
            >
              <span className="font-serif text-xl sm:text-2xl tracking-[0.2em] font-light leading-none group-hover:text-[#B69A68] transition-colors">
                NOVA HOUSE
              </span>
              <span className="font-mono text-[9px] tracking-[0.28em] text-[#B69A68] uppercase mt-1">
                BENGALURU · INDIA
              </span>
            </a>
          </div>

          {/* CENTER: Navigation Links with Guaranteed Spacing */}
          <nav className="desktop-nav-menu">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="nav-link-item"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* RIGHT: Book a Stay CTA & Toggle Button */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Book A Stay CTA */}
            <motion.button
              onClick={onOpenBooking}
              {...buttonPrimaryGlow}
              className="navbar-cta-btn hidden sm:inline-flex cursor-pointer"
            >
              <span>Book a Stay</span>
              <ArrowUpRight size={13} />
            </motion.button>

            {/* Mobile / Tablet Menu Toggle Button */}
            <motion.button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              whileTap={{ scale: 0.9 }}
              className="nav-toggle-btn cursor-pointer"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Solid Luxury Mobile / Tablet Navigation Drawer */}
      <div
        className={`mobile-nav-drawer ${mobileMenuOpen ? 'is-open' : ''}`}
        style={{
          backgroundColor: '#111111',
          color: '#F5F2EA',
        }}
      >
        <div className="flex items-center justify-between pb-6 border-b border-white/10">
          <div className="flex flex-col">
            <span className="font-serif text-xl sm:text-2xl tracking-[0.2em] font-light text-[#F5F2EA]">
              NOVA HOUSE
            </span>
            <span className="font-mono text-[9px] tracking-[0.28em] text-[#B69A68] uppercase mt-1">
              BENGALURU · INDIA
            </span>
          </div>
          <motion.button
            onClick={() => setMobileMenuOpen(false)}
            whileTap={{ scale: 0.9 }}
            className="w-10 h-10 rounded-full flex items-center justify-center border border-white/20 text-[#F5F2EA] hover:text-[#B69A68] hover:border-[#B69A68] transition-colors cursor-pointer"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}
            aria-label="Close menu"
          >
            <X size={20} />
          </motion.button>
        </div>

        <div className="py-8">
          <div className="flex flex-col gap-3">
            {navLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => handleLinkClick(e, link.href)}
                className="mobile-nav-link"
              >
                <span>{link.label}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="space-y-5 pt-6 border-t border-white/10">
          <motion.button
            onClick={() => {
              setMobileMenuOpen(false);
              onOpenBooking();
            }}
            {...buttonPrimaryGlow}
            className="w-full btn-luxury-primary !py-4 text-xs tracking-widest font-semibold cursor-pointer"
            style={{ backgroundColor: '#B69A68', borderColor: '#B69A68', color: '#111111' }}
          >
            <span>Book Your Stay</span>
            <ArrowUpRight size={15} />
          </motion.button>
          <div className="flex items-center justify-between text-xs text-[#B8B3AA] font-mono">
            <span>Bengaluru · 12° 58' N</span>
            <span>+91 80 4920 8800</span>
          </div>
        </div>
      </div>
    </>
  );
}
