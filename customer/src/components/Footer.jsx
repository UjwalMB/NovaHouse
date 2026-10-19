import React, { useState, useEffect } from 'react';
import { ArrowUp, Compass } from 'lucide-react';
import { HOTEL_INFO } from '../data/hotelData';
import { fetchHotelConfig, subscribeToHotelConfig } from '../services/hotelService';

export default function Footer() {
  const [bengaluruTime, setBengaluruTime] = useState('');
  const [hotelConfig, setHotelConfig] = useState(null);

  useEffect(() => {
    let isMounted = true;
    fetchHotelConfig().then((cfg) => {
      if (isMounted && cfg) setHotelConfig(cfg);
    });

    const unsubscribe = subscribeToHotelConfig((updated) => {
      if (isMounted && updated) setHotelConfig(updated);
    });

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
    };
  }, []);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Format time in Asia/Kolkata timezone
      const timeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Kolkata',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      });
      setBengaluruTime(timeStr);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navLinks = [
    { label: 'Stay', href: '#stay' },
    { label: 'Experience', href: '#experience' },
    { label: 'Dining', href: '#dining' },
    { label: 'Gallery', href: '#gallery' },
    { label: 'About', href: '#intro' },
  ];

  const handleLinkClick = (e, href) => {
    e.preventDefault();
    const target = document.querySelector(href);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <footer
      className="site-footer section-dark"
      style={{
        backgroundColor: '#111111',
        color: '#F5F2EA',
      }}
    >
      <div className="container-luxury">
        {/* Main Footer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 pb-16 border-b border-white/10">
          {/* Brand & Address */}
          <div className="md:col-span-5 space-y-4">
            <h3 className="font-serif text-3xl font-light tracking-[0.16em] uppercase text-[#F5F2EA]">
              NOVA HOUSE
            </h3>
            <p className="font-mono text-xs uppercase tracking-widest text-[#B69A68] font-medium">
              Bengaluru · India
            </p>
            <p className="text-xs text-[#B8B3AA] font-sans max-w-sm leading-relaxed pt-2">
              Modern hospitality in the heart of Bengaluru. Designed for business travellers, couples, and guests seeking quiet architectural luxury.
            </p>

            <div className="flex items-center gap-3 pt-3 font-mono text-xs text-[#B8B3AA]">
              <span className="live-indicator" />
              <span>Bengaluru Local Time (IST): <strong className="text-[#F5F2EA]">{bengaluruTime || 'Live'}</strong></span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="md:col-span-3 space-y-4">
            <span className="font-mono text-xs uppercase tracking-widest text-[#B69A68] block font-medium">
              Navigation
            </span>
            <ul
              className="space-y-3 font-mono text-xs uppercase tracking-wider"
              style={{ listStyle: 'none', padding: 0, margin: 0 }}
            >
              {navLinks.map((link) => (
                <li key={link.label} style={{ listStyle: 'none' }}>
                  <a
                    href={link.href}
                    onClick={(e) => handleLinkClick(e, link.href)}
                    className="transition-colors hover:text-[#B69A68]"
                    style={{ color: '#B8B3AA', textDecoration: 'none' }}
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact & Inquiries */}
          <div className="md:col-span-4 space-y-4">
            <span className="font-mono text-xs uppercase tracking-widest text-[#B69A68] block font-medium">
              Contact & Inquiries
            </span>
            <div className="space-y-2.5 text-xs font-mono">
              <p>
                <a
                  href={`mailto:${hotelConfig?.email || 'concierge@novahouse.com'}`}
                  className="transition-colors hover:text-[#B69A68]"
                  style={{ color: '#B8B3AA', textDecoration: 'none' }}
                >
                  {hotelConfig?.email || 'concierge@novahouse.com'}
                </a>
              </p>
              <p>
                <a
                  href={`tel:${hotelConfig?.phone || '+918049658800'}`}
                  className="transition-colors hover:text-[#B69A68]"
                  style={{ color: '#B8B3AA', textDecoration: 'none' }}
                >
                  {hotelConfig?.phone || '+91 80 4965 8800'}
                </a>
              </p>
              <p className="text-[#B8B3AA]/80 pt-2">
                {hotelConfig?.location || 'Richmond Town, Bengaluru 560025, India'}
              </p>
            </div>

            <div className="pt-2">
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#B8B3AA]/80 block mb-2 font-medium">
                Social
              </span>
              <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-wider">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-[#B69A68]"
                  style={{ color: '#B8B3AA', textDecoration: 'none' }}
                >
                  Instagram
                </a>
                <span className="text-white/20">·</span>
                <a
                  href="https://linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="transition-colors hover:text-[#B69A68]"
                  style={{ color: '#B8B3AA', textDecoration: 'none' }}
                >
                  LinkedIn
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar: Copyright & Back to Top */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-[#B8B3AA]/80">
          <div>
            © 2026 Nova House. All rights reserved.
          </div>

          <button
            onClick={scrollToTop}
            className="back-to-top-btn"
            aria-label="Back to top"
          >
            <span>Back to top</span>
            <ArrowUp size={13} />
          </button>
        </div>
      </div>
    </footer>
  );
}
