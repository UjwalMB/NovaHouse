import React, { useState, useEffect } from 'react';
import { ArrowUpRight, BedDouble, Maximize2, Sparkles, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ROOMS_DATA } from '../data/hotelData';
import { fetchLiveRoomsCatalog, subscribeToLiveRooms } from '../services/roomsService';
import { buttonTactile, cardInteractive } from '../utils/animations';

export default function Rooms({ onViewRoom, onBookRoom }) {
  const [activeFilter, setActiveFilter] = useState('All');
  const [roomsList, setRoomsList] = useState(ROOMS_DATA);

  useEffect(() => {
    let isMounted = true;
    async function loadLiveRooms() {
      try {
        const live = await fetchLiveRoomsCatalog();
        if (isMounted && live) {
          setRoomsList(live);
        }
      } catch (e) {
        console.warn('Error loading live rooms:', e);
      }
    }

    loadLiveRooms();

    // Supabase Realtime WebSocket subscription
    const unsubscribe = subscribeToLiveRooms((updated) => {
      if (isMounted && updated) {
        setRoomsList(updated);
      }
    });

    // Listen to storage events for instant updates from admin tab
    const handleStorage = (e) => {
      if (
        !e.key ||
        e.key.includes('rooms') ||
        e.key.includes('pricing') ||
        e.key.includes('nova_admin')
      ) {
        loadLiveRooms();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Regular interval refresh
    const interval = setInterval(loadLiveRooms, 4000);

    return () => {
      isMounted = false;
      if (unsubscribe) unsubscribe();
      window.removeEventListener('storage', handleStorage);
      clearInterval(interval);
    };
  }, []);

  const filteredRooms = activeFilter === 'All'
    ? roomsList
    : roomsList.filter((r) => r.category === activeFilter);

  return (
    <section id="stay" className="section-spacing bg-[#EFEBE2] text-[#181818] relative">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#181818]/10 pb-8 mb-16">
          <div>
            <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl font-light uppercase leading-[0.95] tracking-tight">
              Rooms made for <br />
              <span className="italic font-normal text-[#B69A68]">slow mornings.</span>
            </h2>
          </div>

          <div className="flex flex-col md:items-end gap-4">
            <p className="text-sm font-sans text-[#77736B] max-w-sm md:text-right">
              Four distinct architectural expressions of quiet luxury, crafted with acoustic insulation and honest natural textures.
            </p>

            {/* Filter Pills with Tactile Luxury Tabs */}
            <div className="filter-tabs-container shadow-sm">
              {['All', 'Rooms', 'Suites'].map((filter) => {
                const isActive = activeFilter === filter;
                return (
                  <motion.button
                    key={filter}
                    type="button"
                    onClick={() => setActiveFilter(filter)}
                    className={`filter-tab-btn ${isActive ? 'is-active' : ''}`}
                    aria-pressed={isActive}
                    whileTap={{ scale: 0.96 }}
                  >
                    {filter}
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Editorial Rooms Grid */}
        <motion.div layout className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          <AnimatePresence mode="popLayout">
            {filteredRooms.map((room, index) => (
              <motion.div
                key={room.id}
                layout
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
                {...cardInteractive}
                className="group flex flex-col bg-[#FBFAF6] border border-[#181818]/10 overflow-hidden hover:border-[#B69A68]/50 transition-all duration-300 shadow-xs hover:shadow-lg"
              >
              {/* Room Image Container with High Contrast Badges */}
              <div className="relative aspect-[16/10] overflow-hidden bg-[#E8E2D7]">
                <img
                  src={room.images.primary}
                  alt={room.title}
                  className="w-full h-full object-cover transform scale-100 group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                />

                {/* Permanent subtle gradient vignette so badges and text pop */}
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: 'linear-gradient(to top, rgba(17, 17, 17, 0.75) 0%, rgba(17, 17, 17, 0.2) 35%, transparent 70%)',
                  }}
                />

                {/* Top Floating Badge with High Contrast */}
                <div className="absolute top-4 left-4 flex items-center gap-2">
                  <span
                    className="text-[10px] font-mono uppercase tracking-[0.2em] px-3 py-1 font-medium shadow-sm"
                    style={{
                      backgroundColor: 'rgba(17, 17, 17, 0.92)',
                      color: '#F5F2EA',
                      border: '1px solid rgba(245, 242, 234, 0.25)',
                    }}
                  >
                    {room.tag}
                  </span>

                  {room.status && room.status !== 'Available' && (
                    <span
                      className="text-[10px] font-mono uppercase tracking-[0.2em] px-2.5 py-1 font-semibold shadow-sm bg-[#B69A68] text-[#111111]"
                    >
                      {room.status}
                    </span>
                  )}
                </div>

                {/* Price pill with Guaranteed High Contrast */}
                <div
                  className="absolute bottom-4 left-4 flex items-baseline gap-1 px-3 py-1.5 shadow-md"
                  style={{
                    backgroundColor: 'rgba(17, 17, 17, 0.92)',
                    color: '#FFFFFF',
                    border: '1px solid rgba(245, 242, 234, 0.25)',
                  }}
                >
                  <span className="font-serif text-lg font-light text-[#FFFFFF]">{room.pricePerNight}</span>
                  <span className="font-mono text-[10px] text-[#B8B3AA]">/ night</span>
                </div>
              </div>

              {/* Room Content */}
              <div className="p-6 sm:p-8 flex flex-col flex-grow justify-between space-y-6">
                <div>
                  <div className="flex items-center justify-between text-xs font-mono text-[#77736B] mb-2">
                    <span>{room.category}</span>
                    <div className="flex items-center gap-3">
                      <span>{room.size}</span>
                      <span>·</span>
                      <span>{room.bed}</span>
                    </div>
                  </div>

                  <h3 className="font-serif text-3xl font-light uppercase tracking-tight text-[#181818] group-hover:text-[#B69A68] transition-colors">
                    {room.title}
                  </h3>

                  <p className="text-sm text-[#77736B] font-sans mt-2 line-clamp-2">
                    {room.description}
                  </p>

                  {/* Highlights Bullet List */}
                  <ul className="mt-4 space-y-1.5 text-xs text-[#181818]/85 border-t border-[#181818]/10 pt-4">
                    {room.highlights.slice(0, 3).map((hl, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#B69A68]" />
                        <span>{hl}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Actions Bar */}
                <div className="flex items-center justify-between pt-6 border-t border-[#181818]/10">
                  <motion.button
                    onClick={() => onViewRoom(room)}
                    className="editorial-link text-xs font-mono tracking-widest cursor-pointer"
                    whileHover={{ x: 4 }}
                  >
                    <span>View Room</span>
                    <ArrowRight size={14} />
                  </motion.button>

                  <motion.button
                    onClick={() => room.isAvailable !== false && onBookRoom(room.id)}
                    disabled={room.isAvailable === false}
                    {...buttonTactile}
                    className={`btn-luxury-primary !py-2.5 !px-5 text-[11px] cursor-pointer ${
                      room.isAvailable === false ? 'opacity-50 cursor-not-allowed' : ''
                    }`}
                    style={{
                      backgroundColor: room.isAvailable === false ? '#77736B' : '#181818',
                      color: '#F5F2EA',
                      borderColor: room.isAvailable === false ? '#77736B' : '#181818',
                    }}
                  >
                    <span>{room.isAvailable === false ? (room.status || 'Unavailable') : 'Reserve'}</span>
                    <ArrowUpRight size={13} />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </section>
  );
}
