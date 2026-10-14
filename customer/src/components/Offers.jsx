import React, { useState, useEffect } from 'react';
import { Tag, Sparkles, ArrowUpRight, Copy, Check, Clock, Gift } from 'lucide-react';
import { fetchActiveOffers, subscribeToOffers } from '../services/offersService';

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
    <section id="offers" className="section-spacing bg-[#ECE8E0] text-[#171717] relative border-t border-[#D8D0C3]">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#171717]/10 pb-8 mb-16">
          <div>
            <span className="editorial-tag mb-4">03 / Privileges</span>
            <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl font-light uppercase leading-[0.95] tracking-tight">
              Curated <br />
              <span className="italic font-normal text-[#A58A5C]">promotions & offers.</span>
            </h2>
          </div>

          <div className="flex flex-col md:items-end gap-3">
            <p className="text-sm font-sans text-[#77736C] max-w-sm md:text-right">
              Exclusive seasonal privileges and direct booking benefits synchronized from our reservations desk.
            </p>
            <span className="text-[11px] font-mono tracking-widest text-[#A58A5C] uppercase flex items-center gap-1.5">
              <Sparkles size={13} />
              <span>Direct Booking Advantage</span>
            </span>
          </div>
        </div>

        {/* Offers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
          {offers.map((offer, index) => (
            <div
              key={offer.id || index}
              className="bg-[#F4F1EB] border border-[#D8D0C3] p-6 sm:p-8 flex flex-col justify-between hover:border-[#111111] transition-all duration-300 shadow-sm group"
            >
              <div>
                {/* Discount Badge */}
                <div className="flex items-center justify-between gap-2 mb-6">
                  <span className="text-[10px] font-mono uppercase tracking-[0.2em] px-3 py-1 font-semibold bg-[#111111] text-[#F4F1EB]">
                    {offer.discount}
                  </span>
                  <span className="font-mono text-[10px] text-[#77736C]">
                    0{index + 1}
                  </span>
                </div>

                {/* Offer Name */}
                <h3 className="font-serif text-2xl font-light uppercase tracking-tight text-[#111111] group-hover:text-[#A58A5C] transition-colors mb-3">
                  {offer.name}
                </h3>

                {/* Tagline / Description */}
                <p className="text-xs text-[#77736C] font-sans leading-relaxed mb-6">
                  {offer.tagline || offer.description}
                </p>
              </div>

              <div className="space-y-4 pt-6 border-t border-[#171717]/10">
                {/* Promo Code Box */}
                <div className="flex items-center justify-between bg-[#ECE8E0] px-3 py-2 border border-[#D8D0C3]">
                  <div className="flex items-center gap-2">
                    <Tag size={13} className="text-[#A58A5C]" />
                    <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#111111]">
                      {offer.code}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleCopyCode(offer.code, e)}
                    className="p-1 text-[#77736C] hover:text-[#111111] transition-colors"
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
                  </button>
                </div>

                {/* Action Button */}
                <button
                  type="button"
                  onClick={() => onClaimOffer && onClaimOffer(offer)}
                  className="w-full btn-luxury-primary !py-3 text-[11px] tracking-widest flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#111111', color: '#F4F1EB', borderColor: '#111111' }}
                >
                  <span>Book with this Offer</span>
                  <ArrowUpRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
