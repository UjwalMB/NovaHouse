import React, { useState, useEffect } from 'react';
import { X, Check, Utensils, Wine, Clock, Sparkles, Calendar, Users } from 'lucide-react';
import { DINING_DATA } from '../data/hotelData';
import { fetchLiveDiningMenu, subscribeToDiningMenu } from '../services/diningService';

export default function DiningModal({ onClose, onTableReserved }) {
  const [activeTab, setActiveTab] = useState('menu'); // 'menu' | 'reserve'
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [menuItems, setMenuItems] = useState([]);
  const [isLoadingMenu, setIsLoadingMenu] = useState(true);

  // Table reservation state
  const [guestCount, setGuestCount] = useState('2 Guests');
  const [timeSlot, setTimeSlot] = useState('20:00 (Dinner)');
  const [mealPeriod, setMealPeriod] = useState('Dinner');
  const [reservedSuccess, setReservedSuccess] = useState(false);

  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // Fetch live dining menu from Supabase/admin cache
  useEffect(() => {
    let isMounted = true;
    async function loadMenu() {
      try {
        const items = await fetchLiveDiningMenu();
        if (isMounted && items) {
          setMenuItems(items);
        }
      } catch (err) {
        console.warn('Failed to load live dining menu:', err);
      } finally {
        if (isMounted) setIsLoadingMenu(false);
      }
    }

    loadMenu();

    // Supabase Realtime WebSocket subscription
    const unsubscribe = subscribeToDiningMenu((updated) => {
      if (isMounted && updated) {
        setMenuItems(updated);
      }
    });

    const handleStorage = (e) => {
      if (!e.key || e.key.includes('dining') || e.key.includes('nova_admin')) {
        loadMenu();
      }
    };
    window.addEventListener('storage', handleStorage);
    const interval = setInterval(loadMenu, 4000);

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const sampleTastingMenu = [
    { course: "Amuse-Bouche", title: "Charred Curry Leaf & Jackfruit Crisp", note: "Kodagu wildflower honey emulsion" },
    { course: "First Course", title: "Malabar Rock Lobster Tartare", note: "Kokum dashi, fermented coconut milk pearls" },
    { course: "Second Course", title: "Charcoal-Roasted Morel Mushroom Dumplings", note: "Black garlic ghee, aged Coorg cheese broth" },
    { course: "Main Course", title: "Slow-Braised Nilgiri Lamb Loin", note: "Stone-ground heirloom millet, smoked tamarind jus" },
    { course: "Dessert", title: "Chikmagalur Single-Estate Dark Chocolate Ganache", note: "Spiced cardamom reduction, roasted arabica crunch" },
  ];

  const categories = ['All', 'Breakfast', 'Starters', 'Main Course', 'Desserts', 'Beverages'];

  const filteredItems = selectedCategory === 'All'
    ? menuItems
    : menuItems.filter((item) => item.category === selectedCategory);

  const handleReserve = (e) => {
    e.preventDefault();
    setReservedSuccess(true);
    setTimeout(() => {
      if (onTableReserved) onTableReserved();
      onClose();
    }, 2200);
  };

  return (
    <div
      className="modal-overlay"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Ember Restaurant Live Menu & Table Reservation"
      data-lenis-prevent="true"
    >
      <div
        className="modal-dialog-content bg-[#111111] text-[#F4F1EB] w-full max-w-4xl shadow-2xl border border-white/15 relative animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
        style={{
          maxHeight: '90vh',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {/* Sticky Header with Navigation Tabs */}
        <div className="sticky top-0 z-20 bg-[#111111]/95 backdrop-blur-md px-6 py-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="editorial-tag text-[#A58A5C]">EMBER · Gastronomy</span>
            <div className="flex items-center bg-[#1F1F1F] rounded p-1">
              <button
                type="button"
                onClick={() => setActiveTab('menu')}
                className={`px-3 py-1 text-xs font-mono tracking-widest uppercase transition-colors ${
                  activeTab === 'menu' ? 'bg-[#A58A5C] text-[#111111] font-semibold' : 'text-[#D8D0C3]/70 hover:text-white'
                }`}
              >
                A La Carte Menu
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('reserve')}
                className={`px-3 py-1 text-xs font-mono tracking-widest uppercase transition-colors ${
                  activeTab === 'reserve' ? 'bg-[#A58A5C] text-[#111111] font-semibold' : 'text-[#D8D0C3]/70 hover:text-white'
                }`}
              >
                Table & Tasting
              </button>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-[#F4F1EB] transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 sm:p-8 md:p-10 space-y-8">
          {/* Top Headline */}
          <div>
            <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-2">
              Contemporary Indian Gastronomy
            </span>
            <h2 className="font-serif text-3xl sm:text-4xl font-light uppercase tracking-tight">
              EMBER · Curated Cuisine & Bar
            </h2>
            <p className="text-xs sm:text-sm text-[#D8D0C3]/80 font-sans mt-2 max-w-2xl leading-relaxed">
              Dishes blistered over local coconut charcoal and wood-fired hearths. Real-time menu synced with our culinary kitchen.
            </p>
          </div>

          {activeTab === 'menu' ? (
            /* Tab 1: Live A La Carte Menu */
            <div className="space-y-6">
              {/* Category Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2 border-b border-white/10 pb-4">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3.5 py-1.5 text-xs font-mono tracking-wider uppercase transition-all ${
                      selectedCategory === cat
                        ? 'bg-[#A58A5C] text-[#111111] font-semibold'
                        : 'bg-[#1A1A1A] text-[#D8D0C3]/80 hover:bg-[#252525] hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

              {/* Dishes Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredItems.map((dish) => (
                  <div
                    key={dish.id}
                    className="p-5 bg-[#161616] border border-white/10 flex flex-col justify-between space-y-3 hover:border-[#A58A5C]/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-1.5">
                        <h4 className="font-serif text-lg text-[#F4F1EB] font-light leading-snug">
                          {dish.name}
                        </h4>
                        <span className="font-mono text-sm text-[#A58A5C] font-semibold shrink-0">
                          ₹ {dish.price.toLocaleString('en-IN')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-[#252525] text-[#D8D0C3]">
                          {dish.category}
                        </span>
                        {dish.isChefSpecial && (
                          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-[#A58A5C]/20 border border-[#A58A5C]/50 text-[#A58A5C]">
                            Chef Special
                          </span>
                        )}
                        {dish.availability && dish.availability !== 'Available' && (
                          <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 bg-red-900/30 border border-red-500/40 text-red-300">
                            {dish.availability}
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-[#D8D0C3]/70 font-sans leading-relaxed">
                        {dish.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {filteredItems.length === 0 && (
                <div className="text-center py-12 text-sm text-[#77736C] font-mono">
                  No dishes found in this category.
                </div>
              )}

              {/* Callout to Reserve Table */}
              <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#161616] p-6">
                <div>
                  <h4 className="font-serif text-xl text-[#F4F1EB]">Join Us at the Hearth Counter</h4>
                  <p className="text-xs text-[#D8D0C3]/70 mt-1">Priority table bookings reserved for hotel residents.</p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('reserve')}
                  className="btn-luxury-primary !py-3 !px-6 text-xs tracking-widest shrink-0"
                  style={{ backgroundColor: '#A58A5C', borderColor: '#A58A5C', color: '#111111' }}
                >
                  Reserve Priority Table →
                </button>
              </div>
            </div>
          ) : (
            /* Tab 2: Curated Tasting Menu & Priority Table Reservation */
            <div className="space-y-8">
              {/* Tasting Menu Courses */}
              <div className="border border-white/10 bg-[#161616] p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C]">
                    Seasonal 5-Course Repertoire
                  </span>
                  <span className="font-serif text-lg text-[#F4F1EB]">₹ 4,800 / Guest</span>
                </div>

                <div className="space-y-5">
                  {sampleTastingMenu.map((item, index) => (
                    <div key={index} className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-white/5 pb-3">
                      <div>
                        <span className="font-mono text-[10px] text-[#A58A5C] uppercase tracking-wider block">
                          {item.course}
                        </span>
                        <h4 className="font-serif text-lg text-[#F4F1EB]">{item.title}</h4>
                        <p className="text-xs text-[#D8D0C3]/60 italic">{item.note}</p>
                      </div>
                      <span className="font-mono text-[10px] text-[#77736C] shrink-0">Included</span>
                    </div>
                  ))}
                </div>

                <div className="text-[11px] font-mono text-[#D8D0C3]/60 pt-2 flex items-center justify-between">
                  <span>* Sommelier Biodynamic Wine Pairing available (+ ₹ 3,200)</span>
                  <span>Dietary Accommodations Honored</span>
                </div>
              </div>

              {/* Interactive Reservation Form */}
              <div className="border border-[#A58A5C]/40 bg-[#191919] p-6 sm:p-8">
                <h3 className="font-serif text-2xl font-light uppercase mb-2">
                  Reserve a Table at EMBER
                </h3>
                <p className="text-xs text-[#D8D0C3]/70 font-sans mb-6">
                  Hotel guests enjoy priority seating at both dining tables and the open hearth chef counter.
                </p>

                {reservedSuccess ? (
                  <div className="p-6 bg-[#A58A5C]/20 border border-[#A58A5C] text-center space-y-2 animate-fade-in">
                    <div className="w-10 h-10 rounded-full bg-[#A58A5C] text-[#111111] flex items-center justify-center mx-auto mb-2">
                      <Check size={20} />
                    </div>
                    <h4 className="font-serif text-xl">Table Confirmed</h4>
                    <p className="text-xs text-[#D8D0C3]">
                      Your reservation for {guestCount} at {timeSlot} has been registered with our maître d'. We look forward to welcoming you to EMBER.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleReserve} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-[#D8D0C3] mb-1.5">
                        Dining Period
                      </label>
                      <select
                        value={mealPeriod}
                        onChange={(e) => setMealPeriod(e.target.value)}
                        className="w-full bg-[#111111] border border-white/20 text-[#F4F1EB] text-xs p-3 outline-none focus:border-[#A58A5C]"
                      >
                        <option value="Breakfast">Breakfast (06:30 — 10:30)</option>
                        <option value="Lunch">Lunch (12:00 — 15:30)</option>
                        <option value="Dinner">Dinner (19:00 — 23:30)</option>
                        <option value="Bar">The Bar (17:00 — 01:00)</option>
                        <option value="Private">Private Dining Room</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-[#D8D0C3] mb-1.5">
                        Party Size
                      </label>
                      <select
                        value={guestCount}
                        onChange={(e) => setGuestCount(e.target.value)}
                        className="w-full bg-[#111111] border border-white/20 text-[#F4F1EB] text-xs p-3 outline-none focus:border-[#A58A5C]"
                      >
                        <option>1 Guest</option>
                        <option>2 Guests</option>
                        <option>3 Guests</option>
                        <option>4 Guests</option>
                        <option>5+ Guests (Private Salon)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono uppercase tracking-widest text-[#D8D0C3] mb-1.5">
                        Preferred Time
                      </label>
                      <select
                        value={timeSlot}
                        onChange={(e) => setTimeSlot(e.target.value)}
                        className="w-full bg-[#111111] border border-white/20 text-[#F4F1EB] text-xs p-3 outline-none focus:border-[#A58A5C]"
                      >
                        <option>19:00 (Evening First Seating)</option>
                        <option>19:45 (Main Room)</option>
                        <option>20:30 (Chef's Counter)</option>
                        <option>21:15 (Late Seating)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-3 pt-4">
                      <button
                        type="submit"
                        className="w-full btn-luxury-primary !py-4 text-xs tracking-widest"
                        style={{ backgroundColor: '#A58A5C', borderColor: '#A58A5C', color: '#111111' }}
                      >
                        <span>Confirm Priority Table Reservation</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
