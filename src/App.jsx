import React, { useState, useEffect } from 'react';
import Lenis from 'lenis';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Intro from './components/Intro';
import Rooms from './components/Rooms';
import RoomModal from './components/RoomModal';
import Experiences from './components/Experiences';
import Dining from './components/Dining';
import DiningModal from './components/DiningModal';
import Gallery from './components/Gallery';
import GalleryModal from './components/GalleryModal';
import Location from './components/Location';
import Booking from './components/Booking';
import BookingDrawer from './components/BookingDrawer';
import FinalCTA from './components/FinalCTA';
import Footer from './components/Footer';

export default function App() {
  // Modal / Drawer States
  const [selectedRoomForModal, setSelectedRoomForModal] = useState(null);
  const [isDiningModalOpen, setIsDiningModalOpen] = useState(false);
  const [lightboxState, setLightboxState] = useState({ isOpen: false, item: null, allItems: [] });
  const [isBookingDrawerOpen, setIsBookingDrawerOpen] = useState(false);
  const [preselectedBookingRoomId, setPreselectedBookingRoomId] = useState('deluxe-room');

  // Initialize Lenis Smooth Scrolling for award-winning scroll feel
  useEffect(() => {
    let lenis;
    try {
      lenis = new Lenis({
        duration: 1.2,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1.0,
      });

      function raf(time) {
        lenis.raf(time);
        requestAnimationFrame(raf);
      }

      requestAnimationFrame(raf);
    } catch (e) {
      console.warn('Lenis smooth scrolling not active:', e);
    }

    return () => {
      if (lenis) lenis.destroy();
    };
  }, []);

  // Handlers
  const handleOpenBooking = (roomId = 'deluxe-room') => {
    setPreselectedBookingRoomId(roomId);
    setIsBookingDrawerOpen(true);
  };

  const handleBookRoomDirect = (roomId) => {
    setPreselectedBookingRoomId(roomId);
    const bookingSection = document.querySelector('#booking');
    if (bookingSection) {
      bookingSection.scrollIntoView({ behavior: 'smooth' });
    } else {
      setIsBookingDrawerOpen(true);
    }
  };

  const handleExploreClick = () => {
    const introSection = document.querySelector('#intro');
    if (introSection) {
      introSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleOpenLightbox = (item, allItems) => {
    setLightboxState({ isOpen: true, item, allItems });
  };

  const handleLightboxNext = () => {
    if (!lightboxState.item || !lightboxState.allItems.length) return;
    const currentIndex = lightboxState.allItems.findIndex((it) => it.id === lightboxState.item.id);
    const nextIndex = (currentIndex + 1) % lightboxState.allItems.length;
    setLightboxState((prev) => ({ ...prev, item: prev.allItems[nextIndex] }));
  };

  const handleLightboxPrev = () => {
    if (!lightboxState.item || !lightboxState.allItems.length) return;
    const currentIndex = lightboxState.allItems.findIndex((it) => it.id === lightboxState.item.id);
    const prevIndex = (currentIndex - 1 + lightboxState.allItems.length) % lightboxState.allItems.length;
    setLightboxState((prev) => ({ ...prev, item: prev.allItems[prevIndex] }));
  };

  return (
    <div className="min-h-screen bg-[#F4F1EB] text-[#171717] selection:bg-[#A58A5C] selection:text-white">
      {/* Primary Sticky Header */}
      <Navbar onOpenBooking={() => handleOpenBooking('deluxe-room')} />

      <main>
        {/* 1. Hero Section */}
        <Hero
          onOpenBooking={() => handleOpenBooking('deluxe-room')}
          onExplore={handleExploreClick}
        />

        {/* 2. Intro Section */}
        <Intro />

        {/* 3. Stay / Rooms Section */}
        <Rooms
          onViewRoom={(room) => setSelectedRoomForModal(room)}
          onBookRoom={handleBookRoomDirect}
        />

        {/* 4. Experience Section */}
        <Experiences />

        {/* 5. Dining Section */}
        <Dining onOpenDiningMenu={() => setIsDiningModalOpen(true)} />

        {/* 6. Gallery Section */}
        <Gallery onOpenLightbox={handleOpenLightbox} />

        {/* 7. Location Section */}
        <Location />

        {/* 8. Booking Section */}
        <Booking
          preselectedRoomId={preselectedBookingRoomId}
          onBookingSuccess={() => {}}
        />

        {/* 9. Final CTA */}
        <FinalCTA onOpenBooking={() => handleOpenBooking('signature-suite')} />
      </main>

      {/* 10. Footer */}
      <Footer />

      {/* Interactive Overlays & Modals */}
      {selectedRoomForModal && (
        <RoomModal
          room={selectedRoomForModal}
          onClose={() => setSelectedRoomForModal(null)}
          onSelectRoomForBooking={(roomId) => {
            setSelectedRoomForModal(null);
            handleBookRoomDirect(roomId);
          }}
        />
      )}

      {isDiningModalOpen && (
        <DiningModal
          onClose={() => setIsDiningModalOpen(false)}
          onTableReserved={() => {}}
        />
      )}

      {lightboxState.isOpen && (
        <GalleryModal
          item={lightboxState.item}
          allItems={lightboxState.allItems}
          onClose={() => setLightboxState({ isOpen: false, item: null, allItems: [] })}
          onSelectNext={handleLightboxNext}
          onSelectPrev={handleLightboxPrev}
        />
      )}

      <BookingDrawer
        isOpen={isBookingDrawerOpen}
        onClose={() => setIsBookingDrawerOpen(false)}
        defaultRoomId={preselectedBookingRoomId}
      />
    </div>
  );
}
