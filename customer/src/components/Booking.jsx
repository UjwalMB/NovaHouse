import React, { useState, useEffect } from 'react';
import {
  Calendar,
  Users,
  BedDouble,
  ArrowUpRight,
  Check,
  Sparkles,
  Shield,
  Clock,
  CreditCard,
  Loader2,
  User,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  Printer,
  ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import confetti from 'canvas-confetti';
import { ROOMS_DATA } from '../data/hotelData';
import {
  createRazorpayOrder,
  verifyPaymentOnServer,
} from '../services/paymentService';
import { checkAvailability } from '../services/bookingApi';
import { fetchLiveRoomsCatalog } from '../services/roomsService';
import RazorpayModal from './RazorpayModal';
import AnimatedPrice from './AnimatedPrice';
import {
  buttonPrimaryGlow,
  buttonSecondaryTactile,
  chipInteractive,
  cardInteractive,
} from '../utils/animations';

export default function Booking({ preselectedRoomId, onBookingSuccess }) {
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultCheckOut = (() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  })();

  const [checkIn, setCheckIn] = useState(todayStr);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [guests, setGuests] = useState('2 Guests');
  const [roomsList, setRoomsList] = useState(ROOMS_DATA);
  const [selectedRoomId, setSelectedRoomId] = useState(preselectedRoomId || 'nova-suite');

  // Quick preset active tracker: null | '2N' | '3N' | '7N'
  const [activeDurationPreset, setActiveDurationPreset] = useState('3N');

  // Guest details state
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [specialRequests, setSpecialRequests] = useState('');
  const [formError, setFormError] = useState('');

  const [isChecking, setIsChecking] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeOrderData, setActiveOrderData] = useState(null);
  const [availabilityMessage, setAvailabilityMessage] = useState('');

  // Fetch live rooms catalog
  useEffect(() => {
    let isMounted = true;
    async function loadRooms() {
      try {
        const live = await fetchLiveRoomsCatalog();
        if (isMounted && live) {
          setRoomsList(live);
        }
      } catch (e) {}
    }
    loadRooms();

    const handleStorage = (e) => {
      if (!e.key || e.key.includes('rooms') || e.key.includes('pricing') || e.key.includes('nova_admin')) {
        loadRooms();
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => {
      isMounted = false;
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  // Update selected room when preselectedRoomId prop changes
  useEffect(() => {
    if (preselectedRoomId) {
      setSelectedRoomId(preselectedRoomId);
    }
  }, [preselectedRoomId]);

  const getMinCheckOut = (inDateStr) => {
    if (!inDateStr) return '';
    const d = new Date(inDateStr);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const handleCheckInChange = (newIn) => {
    setCheckIn(newIn);
    setActiveDurationPreset(null);
    const minOut = getMinCheckOut(newIn);
    if (!checkOut || checkOut <= newIn) {
      setCheckOut(minOut);
    }
  };

  const handleCheckOutChange = (newOut) => {
    setCheckOut(newOut);
    setActiveDurationPreset(null);
  };

  // Quick Stay Presets
  const applyDurationPreset = (days, label) => {
    const start = new Date(checkIn || todayStr);
    const end = new Date(start);
    end.setDate(end.getDate() + days);
    setCheckOut(end.toISOString().split('T')[0]);
    setActiveDurationPreset(label);
  };

  // Compute stay details
  const selectedRoom = roomsList.find((r) => r.id === selectedRoomId) || roomsList[0];

  const calculateNights = () => {
    try {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const diffTime = d2 - d1;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return isNaN(diffDays) || diffDays <= 0 ? 1 : diffDays;
    } catch {
      return 1;
    }
  };

  const nights = calculateNights();
  const roomSubtotal = (selectedRoom.numericPrice || 22000) * nights;
  const taxes = Math.round(roomSubtotal * 0.18);
  const totalPrice = roomSubtotal + taxes;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    // Guest details validation
    if (!guestName || guestName.trim().length < 2) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!guestEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail.trim())) {
      setFormError('Please enter a valid email address.');
      return;
    }
    const cleanPhone = guestPhone ? guestPhone.replace(/[^0-9]/g, '') : '';
    if (!cleanPhone || cleanPhone.length < 10) {
      setFormError('Please enter a valid 10-digit phone number.');
      return;
    }
    if (!checkIn) {
      setFormError('Please select check-in date.');
      return;
    }
    if (checkIn < todayStr) {
      setFormError('Check-in date cannot be in the past.');
      return;
    }
    if (!checkOut) {
      setFormError('Please select check-out date.');
      return;
    }
    if (checkOut <= checkIn) {
      setFormError('Check-out must be after check-in.');
      return;
    }

    setIsChecking(true);
    setAvailabilityMessage('');

    try {
      const actualRoomId = selectedRoom?.dbId || selectedRoom?.actualRoomId || selectedRoom?.roomNumber || selectedRoom?.id;

      // Step 2: Live Database Availability Check
      const avail = await checkAvailability({
        checkIn,
        checkOut,
        roomId: actualRoomId,
        guests: parseInt(guests) || 2,
      });

      if (avail && avail.available === false) {
        setIsChecking(false);
        setAvailabilityMessage('Selected suite is currently reserved for these dates in our registry. Please select alternate dates.');
        return;
      }

      // Step 5: Authoritative Server-Side Calculation & Order
      const orderPayload = {
        roomId: actualRoomId,
        roomNumber: selectedRoom.roomNumber || selectedRoom.id || '101',
        roomType: selectedRoom.title,
        baseRate: selectedRoom.numericPrice,
        nights,
        taxes,
        discount: 0,
        totalAmount: totalPrice,
        checkIn,
        checkOut,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
        guestCountry: 'India',
        guests: parseInt(guests) || 2,
        specialRequests: specialRequests.trim() || 'Direct website reservation via NOVA HOUSE',
      };

      const orderData = await createRazorpayOrder(orderPayload);
      setActiveOrderData(orderData);
      setIsChecking(false);
      setIsCheckoutOpen(true);
    } catch (err) {
      setIsChecking(false);
      alert(err.message || 'Payment could not be initialized.');
    }
  };

  const handlePaymentSuccess = async (verifyPayload) => {
    setIsCheckoutOpen(false);
    setIsChecking(true);
    try {
      const verifyResult = await verifyPaymentOnServer({
        ...verifyPayload,
        amount: activeOrderData?.amount || totalPrice,
        email: guestEmail.trim(),
        contact: guestPhone.trim(),
        method: verifyPayload?.method || 'Online / Razorpay',
      });

      setConfirmedReservation({
        room: selectedRoom,
        nights: activeOrderData?.nights || nights,
        checkIn,
        checkOut,
        guests,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
        specialRequests: specialRequests.trim(),
        total: activeOrderData?.amount || totalPrice,
        code: verifyResult.bookingId,
        paymentId: verifyResult.paymentId,
        paymentStatus: verifyResult.paymentStatus || 'PAID',
      });

      try {
        confetti({
          particleCount: 90,
          spread: 70,
          origin: { y: 0.65 },
          colors: ['#B69A68', '#111111', '#E8E2D7', '#FFFFFF'],
        });
      } catch (err) {}

      if (onBookingSuccess) onBookingSuccess();
    } catch (err) {
      alert(err.message || 'Signature verification failed.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <section id="booking" className="section-spacing bg-[#F7F5EF] text-[#181818] relative">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#181818]/15 pb-8 mb-12 sm:mb-16">
          <div>
            <span className="font-mono text-xs uppercase tracking-[0.25em] text-[#B69A68] block mb-2 font-semibold">
              Direct Online Reservations
            </span>
            <h2 className="font-serif text-4xl sm:text-6xl md:text-7xl font-light uppercase leading-[0.95] tracking-tight text-[#111111]">
              Your stay <br />
              <span className="italic font-normal text-[#B69A68]">starts here.</span>
            </h2>
          </div>

          <p className="text-sm font-sans text-[#2D2924] max-w-sm md:text-right leading-relaxed font-medium">
            Reserve directly with NOVA HOUSE for our guaranteed best direct tariff, complimentary daily breakfast, and flexible 48h cancellation.
          </p>
        </div>

        {/* Booking Container */}
        <div className="bg-[#EFEBE2] border border-[#181818]/15 p-5 sm:p-8 lg:p-12 shadow-sm rounded-none">
          {confirmedReservation ? (
            /* Confirmation Voucher View */
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="bg-[#FBFAF6] border-2 border-[#B69A68] p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 shadow-xl"
            >
              <div className="w-16 h-16 rounded-full bg-[#B69A68] text-[#111111] flex items-center justify-center mx-auto shadow-md">
                <Check size={32} />
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.28em] text-[#B69A68] block mb-1 font-bold">
                  NOVA HOUSE · BENGALURU
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl font-light uppercase text-[#111111]">
                  RESERVATION CONFIRMED
                </h3>
                <p className="font-serif italic text-base text-[#4A453E] mt-1">
                  "Your sanctuary is ready for your arrival."
                </p>
              </div>

              {/* Booking Dossier Details Table */}
              <div className="p-6 bg-[#FFFFFF] border border-[#D5CFC4] text-left space-y-3 font-sans text-xs shadow-xs">
                <div className="flex justify-between items-center pb-2.5 border-b border-[#EFEBE2]">
                  <span className="text-[#555047] font-semibold">Confirmation Code:</span>
                  <strong className="text-[#111111] font-mono font-bold tracking-wider" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {confirmedReservation.code}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#555047] font-semibold">Payment Status:</span>
                  <span className="px-2.5 py-0.5 bg-[#EDF7F0] text-[#1B4D29] border border-[#C8E8D1] font-sans font-bold text-[11px] uppercase tracking-wider">
                    PAID · GUARANTEED
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#555047] font-semibold">Guest Name:</span>
                  <span className="text-[#111111] font-sans font-medium">{confirmedReservation.guestName}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#555047] font-semibold">Contact:</span>
                  <span className="text-[#111111] font-sans">{confirmedReservation.guestPhone} · {confirmedReservation.guestEmail}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#555047] font-semibold">Sanctuary:</span>
                  <span className="text-[#111111] font-serif text-sm font-semibold">{confirmedReservation.room.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#555047] font-semibold">Stay Dates:</span>
                  <span className="text-[#111111] font-sans">
                    <span className="font-mono font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>{confirmedReservation.checkIn}</span> → <span className="font-mono font-semibold" style={{ fontVariantNumeric: 'tabular-nums' }}>{confirmedReservation.checkOut}</span> ({confirmedReservation.nights} Nights)
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#555047] font-semibold">Guests:</span>
                  <span className="text-[#111111] font-sans">{confirmedReservation.guests}</span>
                </div>
                {confirmedReservation.paymentId && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#555047] font-semibold">Transaction ID:</span>
                    <span className="text-[#111111] font-mono text-[11px] tracking-wide" style={{ fontVariantNumeric: 'tabular-nums' }}>{confirmedReservation.paymentId}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-3 border-t border-[#EFEBE2]">
                  <span className="text-[#555047] font-sans font-bold uppercase tracking-wider text-xs">Total Paid:</span>
                  <span className="font-mono text-2xl text-[#111111] font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    ₹ {confirmedReservation.total.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2 font-sans">
                <motion.button
                  type="button"
                  onClick={() => window.print()}
                  {...buttonSecondaryTactile}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#FFFFFF] border-2 border-[#111111] text-[#111111] font-sans text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  <Printer size={15} />
                  <span>PRINT VOUCHER</span>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => setConfirmedReservation(null)}
                  {...buttonPrimaryGlow}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-[#111111] text-[#F5F2EA] font-sans text-xs font-bold uppercase tracking-wider cursor-pointer"
                >
                  <span>BOOK ANOTHER SANCTUARY</span>
                </motion.button>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* STEP 1: Interactive Visual Room Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="luxury-form-label !mb-0">
                    <BedDouble size={16} className="label-icon" />
                    <span>STEP 1 · SELECT YOUR SANCTUARY</span>
                  </label>
                  <span className="font-mono text-xs text-[#2D2924] font-medium hidden sm:inline">
                    Click room to select
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {roomsList.map((room) => {
                    const isSelected = selectedRoomId === room.id;
                    const isAvail = room.isAvailable !== false;
                    return (
                      <motion.div
                        key={room.id}
                        onClick={() => isAvail && setSelectedRoomId(room.id)}
                        {...cardInteractive}
                        className={`group relative flex flex-col justify-between bg-[#FFFFFF] border-2 transition-all cursor-pointer overflow-hidden p-3.5 ${
                          isSelected
                            ? 'border-[#B69A68] ring-3 ring-[#B69A68]/35 shadow-md bg-[#FFFDF9]'
                            : 'border-[#D5CFC4] hover:border-[#B69A68]/70 shadow-xs'
                        } ${!isAvail ? 'opacity-55 cursor-not-allowed' : ''}`}
                      >
                        {/* Visual Image Banner */}
                        <div className="relative aspect-[16/10] overflow-hidden bg-[#E8E2D7] mb-3">
                          <img
                            src={room.images?.primary}
                            alt={room.title}
                            className="w-full h-full object-cover transform scale-100 group-hover:scale-105 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                          {/* Selected Checkmark Badge */}
                          {isSelected && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className="absolute top-2 right-2 w-6 h-6 rounded-full bg-[#B69A68] text-[#111111] flex items-center justify-center shadow-md font-bold"
                            >
                              <Check size={14} />
                            </motion.div>
                          )}

                          {/* Room Category Pill */}
                          <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-xs text-[10px] font-mono text-[#F5F2EA] uppercase tracking-wider">
                            {room.category}
                          </div>
                        </div>

                        {/* Card Info */}
                        <div className="space-y-1.5 flex-grow">
                          <h4 className="font-serif text-lg font-light uppercase text-[#111111] group-hover:text-[#B69A68] transition-colors leading-tight">
                            {room.title}
                          </h4>
                          <div className="flex items-center gap-2 text-[11px] font-mono text-[#555047]">
                            <span>{room.size}</span>
                            <span>·</span>
                            <span>{room.bed}</span>
                          </div>
                        </div>

                        {/* Rate footer */}
                        <div className="pt-3 mt-3 border-t border-[#EFEBE2] flex items-baseline justify-between">
                          <span className="font-serif text-base font-semibold text-[#111111]">
                            {room.pricePerNight}
                          </span>
                          <span className="font-mono text-[10px] text-[#555047]">/ night</span>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </div>

              {/* STEP 2: Dates, Quick Presets & Guest Details */}
              <div className="space-y-4 pt-4 border-t border-[#181818]/15">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <label className="luxury-form-label !mb-0">
                    <Calendar size={16} className="label-icon" />
                    <span>STEP 2 · STAY DATES & DURATION</span>
                  </label>

                  {/* Quick Preset Duration Chips */}
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[11px] text-[#555047] font-semibold mr-1">Quick:</span>
                    <motion.button
                      type="button"
                      {...chipInteractive}
                      onClick={() => applyDurationPreset(2, '2N')}
                      className={`quick-chip-btn ${activeDurationPreset === '2N' ? 'is-active' : ''}`}
                    >
                      Weekend (2N)
                    </motion.button>
                    <motion.button
                      type="button"
                      {...chipInteractive}
                      onClick={() => applyDurationPreset(3, '3N')}
                      className={`quick-chip-btn ${activeDurationPreset === '3N' ? 'is-active' : ''}`}
                    >
                      Retreat (3N)
                    </motion.button>
                    <motion.button
                      type="button"
                      {...chipInteractive}
                      onClick={() => applyDurationPreset(7, '7N')}
                      className={`quick-chip-btn ${activeDurationPreset === '7N' ? 'is-active' : ''}`}
                    >
                      Weekly (7N)
                    </motion.button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Check-In */}
                  <div>
                    <label className="luxury-form-label" htmlFor="booking-check-in">
                      Check-In Date
                    </label>
                    <input
                      id="booking-check-in"
                      type="date"
                      min={todayStr}
                      value={checkIn}
                      onChange={(e) => handleCheckInChange(e.target.value)}
                      className="luxury-form-input"
                      required
                    />
                  </div>

                  {/* Check-Out */}
                  <div>
                    <label className="luxury-form-label" htmlFor="booking-check-out">
                      Check-Out Date
                    </label>
                    <input
                      id="booking-check-out"
                      type="date"
                      value={checkOut}
                      min={getMinCheckOut(checkIn)}
                      onChange={(e) => handleCheckOutChange(e.target.value)}
                      className="luxury-form-input"
                      required
                    />
                  </div>

                  {/* Guests */}
                  <div>
                    <label className="luxury-form-label" htmlFor="booking-guests">
                      Party Size
                    </label>
                    <select
                      id="booking-guests"
                      value={guests}
                      onChange={(e) => setGuests(e.target.value)}
                      className="luxury-form-select"
                    >
                      <option>1 Adult</option>
                      <option>2 Adults</option>
                      <option>2 Adults, 1 Child</option>
                      <option>3 Adults (Suite required)</option>
                      <option>4 Adults (Signature Suite)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* STEP 3: Patron Guest Information */}
              <div className="space-y-4 pt-4 border-t border-[#181818]/15">
                <label className="luxury-form-label !mb-0">
                  <User size={16} className="label-icon" />
                  <span>STEP 3 · PATRON CONTACT INFORMATION</span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  {/* Guest Full Name */}
                  <div>
                    <label htmlFor="booking-guest-name" className="luxury-form-label">
                      Full Legal Name
                    </label>
                    <input
                      id="booking-guest-name"
                      type="text"
                      placeholder="e.g. Rohith Varma"
                      value={guestName}
                      onChange={(e) => {
                        setGuestName(e.target.value);
                        if (formError) setFormError('');
                      }}
                      className="luxury-form-input"
                      required
                    />
                  </div>

                  {/* Phone / WhatsApp */}
                  <div>
                    <label htmlFor="booking-guest-phone" className="luxury-form-label">
                      Phone Number (WhatsApp)
                    </label>
                    <input
                      id="booking-guest-phone"
                      type="tel"
                      placeholder="e.g. 9845012345"
                      value={guestPhone}
                      onChange={(e) => {
                        setGuestPhone(e.target.value);
                        if (formError) setFormError('');
                      }}
                      className="luxury-form-input"
                      required
                    />
                  </div>

                  {/* Email Address */}
                  <div>
                    <label htmlFor="booking-guest-email" className="luxury-form-label">
                      Email Address (for Voucher)
                    </label>
                    <input
                      id="booking-guest-email"
                      type="email"
                      placeholder="e.g. patron@novahouse.com"
                      value={guestEmail}
                      onChange={(e) => {
                        setGuestEmail(e.target.value);
                        if (formError) setFormError('');
                      }}
                      className="luxury-form-input"
                      required
                    />
                  </div>
                </div>

                {/* Special Requests */}
                <div>
                  <label htmlFor="booking-special-requests" className="luxury-form-label">
                    <FileText size={13} className="label-icon" />
                    <span>Special Accommodations or Arrival Time (Optional)</span>
                  </label>
                  <input
                    id="booking-special-requests"
                    type="text"
                    placeholder="e.g. Airport transfer, quiet courtyard floor, vegan breakfast..."
                    value={specialRequests}
                    onChange={(e) => setSpecialRequests(e.target.value)}
                    className="luxury-form-input"
                  />
                </div>
              </div>

              {/* Error Banners */}
              {formError && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-50 border-2 border-red-300 text-red-900 text-xs font-mono font-semibold flex items-center gap-3 shadow-xs"
                >
                  <AlertCircle size={18} className="shrink-0 text-red-600" />
                  <span>{formError}</span>
                </motion.div>
              )}

              {availabilityMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-amber-50 border-2 border-amber-300 text-amber-900 text-xs font-mono font-semibold flex items-center gap-3 shadow-xs"
                >
                  <AlertCircle size={18} className="shrink-0 text-amber-600" />
                  <span>{availabilityMessage}</span>
                </motion.div>
              )}

              {/* STEP 4: Real-time Rate Summary Card & Direct CTA */}
              <div className="bg-[#111111] text-[#F5F2EA] p-6 sm:p-8 border border-white/10 shadow-lg space-y-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-white/10">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-[#B69A68] animate-pulse" />
                      <span className="font-mono text-xs uppercase tracking-widest text-[#B69A68] font-bold">
                        Guaranteed Direct Rate
                      </span>
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="font-serif text-3xl sm:text-5xl font-light text-[#FFFFFF]">
                        <AnimatedPrice value={totalPrice} prefix="₹ " />
                      </span>
                      <span className="font-mono text-xs text-[#B8B3AA]">
                        total for {nights} night{nights > 1 ? 's' : ''} (incl. 18% GST)
                      </span>
                    </div>
                  </div>

                  {/* Summary Breakdown Pills */}
                  <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="bg-[#1C1C1A] px-3.5 py-2 border border-white/10">
                      <span className="text-[#B69A68] block text-[10px] uppercase font-sans font-semibold tracking-wider">Suite Rate</span>
                      <span className="text-[#F5F2EA] font-semibold font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ₹ {selectedRoom.numericPrice.toLocaleString('en-IN')} / night
                      </span>
                    </div>
                    <div className="bg-[#1C1C1A] px-3.5 py-2 border border-white/10">
                      <span className="text-[#B69A68] block text-[10px] uppercase font-sans font-semibold tracking-wider">Duration</span>
                      <span className="text-[#F5F2EA] font-semibold font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        {nights} Nights
                      </span>
                    </div>
                    <div className="bg-[#1C1C1A] px-3.5 py-2 border border-white/10">
                      <span className="text-[#B69A68] block text-[10px] uppercase font-sans font-semibold tracking-wider">GST (18%)</span>
                      <span className="text-[#F5F2EA] font-semibold font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                        ₹ {taxes.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Trust Inclusions */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs font-sans text-[#B8B3AA]">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-[#B69A68] shrink-0" />
                    <span>Best Price Guaranteed Direct</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-[#B69A68] shrink-0" />
                    <span>Instant Real-Time Confirmation</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sparkles size={14} className="text-[#B69A68] shrink-0" />
                    <span>Complimentary Artisan Breakfast</span>
                  </div>
                </div>

                {/* Primary CTA Button */}
                <div className="pt-2">
                  <motion.button
                    type="submit"
                    disabled={isChecking}
                    {...buttonPrimaryGlow}
                    className="w-full btn-luxury-primary !py-5 text-xs sm:text-sm tracking-[0.22em] font-bold uppercase cursor-pointer flex items-center justify-center gap-3"
                    style={{
                      backgroundColor: '#B69A68',
                      color: '#111111',
                      borderColor: '#B69A68',
                    }}
                  >
                    {isChecking ? (
                      <>
                        <Loader2 size={18} className="animate-spin text-[#111111]" />
                        <span>VERIFYING REGISTRY AVAILABILITY...</span>
                      </>
                    ) : (
                      <>
                        <span>PROCEED TO SECURE RESERVATION</span>
                        <ArrowUpRight size={16} />
                      </>
                    )}
                  </motion.button>
                </div>
              </div>
            </form>
          )}
        </div>
      </div>

      <RazorpayModal
        isOpen={isCheckoutOpen}
        orderData={activeOrderData}
        guestName={guestName.trim()}
        guestEmail={guestEmail.trim()}
        guestPhone={guestPhone.trim()}
        onSuccess={handlePaymentSuccess}
        onDismiss={() => setIsCheckoutOpen(false)}
        onError={(err) => {
          setIsCheckoutOpen(false);
          alert(err || 'Payment was declined.');
        }}
      />
    </section>
  );
}
