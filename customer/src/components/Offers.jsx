import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, ArrowUpRight, Copy, Check, Clock, Gift } from 'lucide-react';
import { motion } from 'motion/react';
import { fetchActiveOffers, subscribeToOffers } from '../services/offersService';
import { buttonTactile, cardInteractive } from '../utils/animations';

export default function Offers({ onClaimOffer }) {
  const [offers, setOffers] = useState([]);
  const [copiedCode, setCopiedCode] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    async function loadOffers() {
      try {
        const liveOffers = await fetchActiveOffers();
        if (isMounted && liveOffers) {
          setOffers(liveOffers);
        }
      } catch (e) {
        console.warn('Failed to load live offers:', e);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadOffers();

    // Supabase Realtime WebSocket subscription
    const unsubscribe = subscribeToOffers((updated) => {
      if (isMounted && updated) {
        setOffers(updated);
      }
    });

    const handleStorage = (e) => {
      if (!e.key || e.key.includes('offers') || e.key.includes('nova_admin')) {
        loadOffers();
      }
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(loadOffers, 4000);

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const handleCopyCode = (code, e) => {
    e.stopPropagation();
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  if (offers.length === 0 && !isLoading) {
    return null;
  }

  return (
    <section id="offers" className="section-spacing bg-[#E8E2D7] text-[#181818] relative border-t border-[#181818]/10">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#181818]/10 pb-8 mb-16">
          <div>
            <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl font-light uppercase leading-[0.95] tracking-tight">
              Curated <br />
              <span className="italic font-normal text-[#B69A68]">promotions & offers.</span>
            </h2>
          </div>

          <div className="flex flex-col md:items-end gap-3">
            <p className="text-sm font-sans text-[#77736B] max-w-sm md:text-right">
              Exclusive seasonal privileges and direct booking benefits synchronized from our reservations desk.
            </p>
            <span className="text-[11px] font-mono tracking-widest text-[#B69A68] uppercase flex items-center gap-1.5 font-medium">
              <Sparkles size={13} />
              <span>Direct Booking Advantage</span>
            </span>
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {offers.map((offer, index) => (
            <motion.div
              key={offer.id || index}
              {...cardInteractive}
              className="bg-[#FBFAF6] border border-[#181818]/10 p-6 sm:p-8 flex flex-col justify-between hover:border-[#B69A68]/50 transition-all duration-300 shadow-xs hover:shadow-lg group"
            >
              <div>
                {/* Discount Badge */}
                <div className="flex items-center justify-between gap-2 mb-6">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-3 py-1 font-semibold bg-[#181818] text-[#F5F2EA]">
                    {offer.discount}
                  </span>
                </div>

                {/* Offer Name */}
                <h3 className="font-serif text-2xl font-light uppercase tracking-tight text-[#181818] group-hover:text-[#B69A68] transition-colors mb-3">
                  {offer.name}
                </h3>

                {/* Tagline / Description */}
                <p className="text-xs text-[#77736B] font-sans leading-relaxed mb-6">
                  {offer.tagline || offer.description}
                </p>
              </div>

              <div className="space-y-4 pt-6 border-t border-[#181818]/10">
                {/* Promo Code Box */}
                <div className="flex items-center justify-between bg-[#EFEBE2] px-3 py-2 border border-[#181818]/10">
                  <div className="flex items-center gap-2">
                    <Tag size={13} className="text-[#B69A68]" />
                    <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#181818]">
                      {offer.code}
                    </span>
                  </div>

                  <motion.button
                    type="button"
                    onClick={(e) => handleCopyCode(offer.code, e)}
                    whileTap={{ scale: 0.9 }}
                    className="p-1 text-[#77736B] hover:text-[#181818] transition-colors cursor-pointer"
                    title="Copy Promo Code"
                    aria-label={`Copy code ${offer.code}`}
                  >
                    {copiedCode === offer.code ? (
                      <span className="text-[10px] font-mono text-green-700 flex items-center gap-1 font-bold">
                        <Check size={12} /> Copied
                      </span>
                    ) : (
                      <Copy size={13} />
                    )}
                  </motion.button>
                </div>

                {/* Action Button */}
                <motion.button
                  type="button"
                  onClick={() => onClaimOffer && onClaimOffer(offer)}
                  {...buttonTactile}
                  className="w-full btn-luxury-primary !py-3 text-[11px] tracking-widest flex items-center justify-center gap-2 cursor-pointer"
                  style={{ backgroundColor: '#181818', color: '#F5F2EA', borderColor: '#181818' }}
                >
                  <span>Book with this Offer</span>
                  <ArrowUpRight size={13} />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
