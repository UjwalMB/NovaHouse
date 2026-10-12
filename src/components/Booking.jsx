import React, { useState } from 'react';
import { Calendar, Users, BedDouble, ArrowUpRight, Check, Sparkles, Shield, Clock, CreditCard, Loader2 } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ROOMS_DATA } from '../data/hotelData';
import {
  createRazorpayOrder,
  verifyPaymentOnServer,
} from '../services/paymentService';
import { checkAvailability } from '../services/bookingApi';
import RazorpayModal from './RazorpayModal';

export default function Booking({ preselectedRoomId, onBookingSuccess }) {
  const [checkIn, setCheckIn] = useState('2026-10-18');
  const [checkOut, setCheckOut] = useState('2026-10-21');
  const [guests, setGuests] = useState('2 Guests');
  const [selectedRoomId, setSelectedRoomId] = useState(preselectedRoomId || 'nova-suite');
  const [isChecking, setIsChecking] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState(null);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeOrderData, setActiveOrderData] = useState(null);
  const [availabilityMessage, setAvailabilityMessage] = useState('');

  // Compute stay details
  const selectedRoom = ROOMS_DATA.find((r) => r.id === selectedRoomId) || ROOMS_DATA[0];

  const calculateNights = () => {
    try {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const diffTime = Math.abs(d2 - d1);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return isNaN(diffDays) || diffDays <= 0 ? 1 : diffDays;
    } catch {
      return 3;
    }
  };

  const nights = calculateNights();
  const roomSubtotal = selectedRoom.numericPrice * nights;
  const taxes = Math.round(roomSubtotal * 0.18);
  const totalPrice = roomSubtotal + taxes;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsChecking(true);
    setAvailabilityMessage('');

    try {
      // Step 2: Live Database Availability Check
      const avail = await checkAvailability({
        checkIn,
        checkOut,
        roomId: selectedRoom.id,
        guests: parseInt(guests) || 2,
      });

      if (avail && avail.available === false) {
        setIsChecking(false);
        setAvailabilityMessage('Selected suite is currently reserved for these dates in our registry. Please select alternate dates.');
        return;
      }

      // Step 5: Authoritative Server-Side Calculation & Order
      const orderPayload = {
        roomId: selectedRoom.id,
        checkIn,
        checkOut,
        guestName: 'Direct Web Guest',
        guestEmail: 'guest@novahouse.example',
        guestPhone: '+91 98450 12345',
        guestCountry: 'India',
        guests: parseInt(guests) || 2,
        specialRequests: 'Online reservation via NOVA HOUSE section',
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
      const verifyResult = await verifyPaymentOnServer(verifyPayload);

      setConfirmedReservation({
        room: selectedRoom,
        nights: activeOrderData?.nights || nights,
        checkIn,
        checkOut,
        guests,
        total: activeOrderData?.amount || totalPrice,
        code: verifyResult.bookingId,
        paymentId: verifyResult.paymentId,
        paymentStatus: verifyResult.paymentStatus || 'PAID',
      });

      try {
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
          colors: ['#A58A5C', '#111111', '#D8D0C3', '#F4F1EB'],
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
    <section id="booking" className="section-spacing bg-[#F4F1EB] text-[#171717] relative">
      <div className="container-luxury">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-[#171717]/10 pb-8 mb-16">
          <div>
            <span className="editorial-tag mb-4">07 / Reservations</span>
            <h2 className="font-serif text-5xl sm:text-6xl md:text-7xl font-light uppercase leading-[0.95] tracking-tight">
              Your stay <br />
              <span className="italic font-normal text-[#A58A5C]">starts here.</span>
            </h2>
          </div>

          <p className="text-sm font-sans text-[#77736C] max-w-sm md:text-right">
            Reserve directly with NOVA HOUSE for our guaranteed best tariff, complimentary daily breakfast, and flexible 48h cancellation.
          </p>
        </div>

        {/* Booking Interface Container */}
        <div className="bg-[#ECE8E0] border border-[#D8D0C3] p-6 sm:p-10 lg:p-12 shadow-sm">
          {confirmedReservation ? (
            <div className="bg-[#F4F1EB] border border-[#A58A5C] p-8 sm:p-12 text-center max-w-2xl mx-auto space-y-6 animate-fade-in shadow-lg">
              <div className="w-16 h-16 rounded-full bg-[#A58A5C] text-[#111111] flex items-center justify-center mx-auto shadow-md">
                <Check size={32} />
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#A58A5C] block mb-1">
                  NOVA HOUSE
                </span>
                <h3 className="font-serif text-3xl sm:text-4xl font-light uppercase text-[#111111]">
                  BOOKING CONFIRMED
                </h3>
                <p className="font-serif italic text-base text-[#77736C] mt-1">
                  "Your stay is reserved."
                </p>
              </div>

              {/* Booking Dossier Details Table */}
              <div className="p-6 bg-[#ECE8E0] border border-[#D8D0C3] rounded-xs space-y-3 font-mono text-xs text-left">
                <div className="flex justify-between items-center pb-2 border-b border-[#D8D0C3]">
                  <span className="text-[#77736C]">Booking ID:</span>
                  <strong className="text-[#111111] font-semibold">{confirmedReservation.code}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#77736C]">Payment Status:</span>
                  <span className="px-2.5 py-0.5 rounded-xs bg-[#EDF7F0] text-[#235C33] border border-[#C8E8D1] font-bold">
                    PAID
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#77736C]">Room Sanctuary:</span>
                  <span className="text-[#111111] font-medium">{confirmedReservation.room.title}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#77736C]">Check-in:</span>
                  <span className="text-[#111111]">{confirmedReservation.checkIn}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#77736C]">Check-out:</span>
                  <span className="text-[#111111]">{confirmedReservation.checkOut}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#77736C]">Guests:</span>
                  <span className="text-[#111111]">{confirmedReservation.guests}</span>
                </div>
                {confirmedReservation.paymentId && (
                  <div className="flex justify-between items-center">
                    <span className="text-[#77736C]">Razorpay Payment ID:</span>
                    <span className="text-[#111111] font-mono text-[11px]">{confirmedReservation.paymentId}</span>
                  </div>
                )}
                <div className="flex justify-between items-baseline pt-2 border-t border-[#D8D0C3]">
                  <span className="text-[#77736C]">Total Amount:</span>
                  <span className="font-serif text-2xl text-[#111111] font-semibold">
                    ₹ {confirmedReservation.total.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Action Buttons: PRINT VOUCHER / BACK TO NOVA HOUSE */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="btn-luxury-primary !py-3.5 !px-8 text-xs tracking-wider"
                  style={{ backgroundColor: '#111111', color: '#F4F1EB', borderColor: '#111111' }}
                >
                  <span>PRINT VOUCHER</span>
                </button>
                <button
                  type="button"
                  onClick={() => setConfirmedReservation(null)}
                  className="btn-luxury-secondary text-xs !py-3.5 !px-8"
                >
                  BACK TO NOVA HOUSE
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Form Input Fields Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Check In */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#77736C]">
                    <Calendar size={13} className="text-[#A58A5C]" />
                    <span>Check-in</span>
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => setCheckIn(e.target.value)}
                    className="w-full bg-[#F4F1EB] border border-[#D8D0C3] p-4 text-xs font-mono text-[#111111] outline-none focus:border-[#111111] transition-colors"
                    required
                  />
                </div>

                {/* Check Out */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#77736C]">
                    <Calendar size={13} className="text-[#A58A5C]" />
                    <span>Check-out</span>
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full bg-[#F4F1EB] border border-[#D8D0C3] p-4 text-xs font-mono text-[#111111] outline-none focus:border-[#111111] transition-colors"
                    required
                  />
                </div>

                {/* Guests */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#77736C]">
                    <Users size={13} className="text-[#A58A5C]" />
                    <span>Guests</span>
                  </label>
                  <select
                    value={guests}
                    onChange={(e) => setGuests(e.target.value)}
                    className="w-full bg-[#F4F1EB] border border-[#D8D0C3] p-4 text-xs font-mono text-[#111111] outline-none focus:border-[#111111] transition-colors"
                  >
                    <option>1 Adult</option>
                    <option>2 Adults</option>
                    <option>2 Adults, 1 Child</option>
                    <option>3 Adults (Suite required)</option>
                    <option>4 Adults (Signature Suite)</option>
                  </select>
                </div>

                {/* Room Preference */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[#77736C]">
                    <BedDouble size={13} className="text-[#A58A5C]" />
                    <span>Room Preference</span>
                  </label>
                  <select
                    value={selectedRoomId}
                    onChange={(e) => setSelectedRoomId(e.target.value)}
                    className="w-full bg-[#F4F1EB] border border-[#D8D0C3] p-4 text-xs font-mono text-[#111111] outline-none focus:border-[#111111] transition-colors"
                  >
                    {ROOMS_DATA.map((r) => (
                      <option key={r.id} value={r.id}>
                        {r.title} ({r.pricePerNight})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Real-time Rate Summary Bar */}
              <div className="p-6 bg-[#F4F1EB] border border-[#D8D0C3] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <span className="font-mono text-[10px] tracking-widest uppercase text-[#A58A5C] block">
                    Real-time Stay Estimation
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span className="font-serif text-3xl font-light text-[#111111]">
                      ₹ {totalPrice.toLocaleString()}
                    </span>
                    <span className="font-mono text-xs text-[#77736C]">
                      total for {nights} night{nights > 1 ? 's' : ''} (excl. local taxes)
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-xs font-mono text-[#77736C]">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-[#A58A5C]" />
                    <span>Best Direct Price Guaranteed</span>
                  </div>
                  <div className="hidden md:flex items-center gap-2">
                    <Clock size={14} className="text-[#A58A5C]" />
                    <span>Instant Confirmation</span>
                  </div>
                </div>
              </div>

              {/* Submit CTA Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isChecking}
                  className="w-full btn-luxury-primary !py-5 text-xs tracking-[0.2em] font-semibold"
                  style={{
                    backgroundColor: '#111111',
                    color: '#F4F1EB',
                    borderColor: '#111111',
                  }}
                >
                  <span>
                    {isChecking ? 'Checking Real-time Availability...' : 'Check Availability'}
                  </span>
                  <ArrowUpRight size={16} />
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      <RazorpayModal
        isOpen={isCheckoutOpen}
        orderData={activeOrderData}
        guestName="Direct Web Guest"
        guestEmail="guest@novahouse.example"
        guestPhone="+91 98450 12345"
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
