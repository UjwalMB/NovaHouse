import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Users,
  BedDouble,
  ArrowUpRight,
  Check,
  Shield,
  CreditCard,
  Loader2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  Smartphone,
  Building2,
  Lock,
  ShieldCheck,
  Mail,
  Phone,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ROOMS_DATA } from '../data/hotelData';
import {
  createRazorpayOrder,
  verifyPaymentOnServer,
  retryPaymentOrder,
  authorizeTestPayment,
  launchRazorpayCheckout,
} from '../services/paymentService';
import { checkAvailability } from '../services/bookingApi';

/**
 * Format a YYYY-MM-DD date into "18 Oct 2026"
 */
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  try {
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const year = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const d = new Date(year, month, day);
      return d.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    }
  } catch (e) {
    // fallback to original string
  }
  return dateStr;
}

/**
 * Mask email for customer privacy (e.g. uj***@novahouse.com)
 */
function maskEmail(email) {
  if (!email || !email.includes('@')) return 'guest@novahouse.com';
  const [user, domain] = email.split('@');
  if (user.length <= 2) return `${user}***@${domain}`;
  return `${user.slice(0, 2)}***@${domain}`;
}

/**
 * Mask phone number for customer privacy (e.g. ******5529)
 */
function maskPhone(phone) {
  if (!phone) return '******5529';
  const clean = phone.replace(/[\s\-\(\)]/g, '');
  if (clean.length >= 4) return `******${clean.slice(-4)}`;
  return '******5529';
}

export default function BookingDrawer({ isOpen, onClose, defaultRoomId }) {
  // Booking Form State
  const [checkIn, setCheckIn] = useState('2026-10-18');
  const [checkOut, setCheckOut] = useState('2026-10-19');
  const [guests, setGuests] = useState('2 Adults');
  const [roomId, setRoomId] = useState(defaultRoomId || 'deluxe-room');
  const [guestName, setGuestName] = useState('Ujwal');
  const [guestEmail, setGuestEmail] = useState('ujwal@novahouse.com');
  const [guestPhone, setGuestPhone] = useState('+91 98450 12345');

  // Dynamic Date Validation Helper
  const getMinCheckOut = (inDateStr) => {
    if (!inDateStr) return '';
    try {
      const d = new Date(inDateStr);
      d.setDate(d.getDate() + 1);
      return d.toISOString().split('T')[0];
    } catch {
      return '';
    }
  };

  const handleCheckInChange = (newIn) => {
    setCheckIn(newIn);
    const minOut = getMinCheckOut(newIn);
    if (!checkOut || checkOut <= newIn) {
      setCheckOut(minOut);
    }
    setInlineAvailabilityError('');
  };

  const handleCheckOutChange = (newOut) => {
    setCheckOut(newOut);
    setInlineAvailabilityError('');
  };

  // Button State Machine:
  // 'DEFAULT' | 'CHECKING' | 'CREATING_ORDER' | 'RAZORPAY_OPEN' | 'SUCCESS' | 'ERROR'
  const [buttonState, setButtonState] = useState('DEFAULT');

  // Payment View States:
  // 'idle' | 'checkout' | 'confirmed' | 'failed'
  const [paymentState, setPaymentState] = useState('idle');

  const [errorMessage, setErrorMessage] = useState('');
  const [inlineAvailabilityError, setInlineAvailabilityError] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [activeOrderData, setActiveOrderData] = useState(null);

  // Live Database Availability State for background badge
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);

  // In-drawer Razorpay Checkout fallback tab state
  const [checkoutTab, setCheckoutTab] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [testCardNumber, setTestCardNumber] = useState('4111 2222 3333 4444');
  const [testExpiry, setTestExpiry] = useState('12/28');
  const [testCvv, setTestCvv] = useState('789');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authProgress, setAuthProgress] = useState('');

  // Lock scroll when open
  useEffect(() => {
    if (isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [isOpen]);

  useEffect(() => {
    if (defaultRoomId) {
      setRoomId(defaultRoomId);
    }
  }, [defaultRoomId]);

  // Live Database Availability Background Verification
  useEffect(() => {
    let isCancelled = false;
    async function verifyLiveAvailability() {
      if (!checkIn || !checkOut || !roomId) return;
      setIsCheckingAvailability(true);
      try {
        const res = await checkAvailability({
          checkIn,
          checkOut,
          roomId,
          guests: parseInt(guests, 10) || 2,
        });
        if (!isCancelled) {
          setAvailabilityResult(res);
        }
      } catch (err) {
        if (!isCancelled) {
          setAvailabilityResult({ available: true });
        }
      } finally {
        if (!isCancelled) {
          setIsCheckingAvailability(false);
        }
      }
    }
    verifyLiveAvailability();
    return () => {
      isCancelled = true;
    };
  }, [checkIn, checkOut, roomId, guests]);

  if (!isOpen) return null;

  const selectedRoom = ROOMS_DATA.find((r) => r.id === roomId) || ROOMS_DATA[0];

  const calculateNights = () => {
    try {
      const d1 = new Date(checkIn);
      const d2 = new Date(checkOut);
      const diff = Math.ceil((d2 - d1) / (1000 * 60 * 60 * 24));
      return isNaN(diff) || diff <= 0 ? 1 : diff;
    } catch {
      return 1;
    }
  };

  const nights = calculateNights();
  const roomSubtotal = selectedRoom.numericPrice * nights;
  const estimatedTaxes = Math.round(roomSubtotal * 0.18);
  const estimatedTotal = roomSubtotal + estimatedTaxes;

  // Processing state disables button & prevents double clicks
  const isProcessing =
    buttonState === 'CHECKING' ||
    buttonState === 'CREATING_ORDER' ||
    buttonState === 'RAZORPAY_OPEN';

  // Dynamic Button Label per Section 2
  const getButtonText = () => {
    switch (buttonState) {
      case 'CHECKING':
        return 'CHECKING AVAILABILITY...';
      case 'CREATING_ORDER':
        return 'CREATING SECURE PAYMENT...';
      case 'RAZORPAY_OPEN':
        return 'PROCESSING PAYMENT...';
      case 'SUCCESS':
        return 'PAYMENT SUCCESSFUL';
      case 'ERROR':
        return 'PAYMENT FAILED — TRY AGAIN';
      case 'DEFAULT':
      default: {
        const payable = activeOrderData?.amount ?? estimatedTotal;
        return `PAY ₹${Number(payable).toLocaleString('en-IN')}`;
      }
    }
  };

  // Section 3: Before Payment Frontend Validation
  const validateForm = () => {
    if (!guestName || guestName.trim().length < 2) {
      return 'Please enter your full guest name.';
    }
    if (!guestEmail || !guestEmail.includes('@') || !guestEmail.includes('.')) {
      return 'Please enter a valid guest email address.';
    }
    const cleanPhone = guestPhone ? guestPhone.replace(/[^0-9]/g, '') : '';
    if (!cleanPhone || cleanPhone.length < 10) {
      return 'Please enter a valid 10-digit phone number.';
    }
    if (!roomId) {
      return 'Please select a room sanctuary.';
    }
    if (!checkIn) {
      return 'Please select a valid check-in date.';
    }
    if (!checkOut) {
      return 'Please select a valid check-out date.';
    }
    if (checkOut <= checkIn) {
      return 'Check-out date must be after check-in date.';
    }
    const numGuests = parseInt(guests, 10);
    if (isNaN(numGuests) || numGuests < 1) {
      return 'Please select at least 1 guest.';
    }
    return null;
  };

  // Section 7 & 8: Cryptographic Signature Verification Callback
  const handlePaymentVerification = async (payResponse, orderData) => {
    try {
      setButtonState('RAZORPAY_OPEN');

      const verifyPayload = {
        razorpay_order_id: payResponse.razorpay_order_id || orderData.orderId,
        razorpay_payment_id: payResponse.razorpay_payment_id,
        razorpay_signature: payResponse.razorpay_signature,
        booking_id: payResponse.booking_id || orderData.bookingId,
      };

      // Backend Cryptographically Verifies Payment (HMAC-SHA256)
      const verifyResult = await verifyPaymentOnServer(verifyPayload);

      // Section 9: Transition state only upon verified 200 OK
      setButtonState('SUCCESS');
      setPaymentState('confirmed');
      setConfirmedBooking({
        bookingId: verifyResult.bookingId || orderData.bookingId,
        paymentId: verifyResult.paymentId || payResponse.razorpay_payment_id,
        totalAmount: orderData.amount || estimatedTotal,
        roomTitle: orderData.roomTitle || selectedRoom.title,
        nights: orderData.nights || nights,
        checkIn,
        checkOut,
        guests: parseInt(guests, 10) || 2,
        paymentStatus: 'PAID',
        bookingStatus: 'Confirmed',
      });

      try {
        confetti({
          particleCount: 90,
          spread: 75,
          origin: { y: 0.6 },
          colors: ['#A58A5C', '#111111', '#D8D0C3', '#FFFFFF'],
        });
      } catch (err) {}
    } catch (verErr) {
      console.error('Cryptographic signature verification failed:', verErr);
      setButtonState('ERROR');
      setPaymentState('failed');
      setErrorMessage(
        verErr.message ||
          'Payment signature verification failed. Your reservation has not been confirmed.'
      );
    }
  };

  // Section 1 to 6: Core Primary Payment Trigger Flow
  const handleStartPayment = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    // Section 16: Duplicate payment protection - ignore if already processing
    if (isProcessing) return;

    setErrorMessage('');
    setInlineAvailabilityError('');

    // Section 3: Validate Form UX protection
    const validationError = validateForm();
    if (validationError) {
      setErrorMessage(validationError);
      setButtonState('DEFAULT');
      return;
    }

    try {
      // Section 4: Live Availability Check (React -> FastAPI -> PostgreSQL)
      setButtonState('CHECKING');
      const availRes = await checkAvailability({
        checkIn,
        checkOut,
        roomId,
        guests: parseInt(guests, 10) || 2,
      });

      if (availRes && availRes.available === false) {
        setInlineAvailabilityError(
          'This room is no longer available for the selected dates. Please choose different dates.'
        );
        setButtonState('DEFAULT');
        return;
      }

      // Section 5: Authoritative Server-Side Order Creation
      setButtonState('CREATING_ORDER');
      const orderPayload = {
        roomId,
        checkIn,
        checkOut,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
        guestCountry: 'India',
        guests: parseInt(guests, 10) || 2,
        specialRequests: 'Direct reservation via NOVA HOUSE booking drawer',
      };

      const orderData = await createRazorpayOrder(orderPayload);
      setActiveOrderData(orderData);

      // Section 6: Launch Razorpay TEST Checkout
      setButtonState('RAZORPAY_OPEN');

      await launchRazorpayCheckout({
        orderData,
        guestName: guestName.trim(),
        guestEmail: guestEmail.trim(),
        guestPhone: guestPhone.trim(),
        onSuccess: async (payResponse) => {
          await handlePaymentVerification(payResponse, orderData);
        },
        onDismiss: () => {
          // Section 11: Handle dismissal cleanly. Do not leave UI stuck in loading.
          setButtonState('DEFAULT');
          setErrorMessage('Payment window was closed. Click PAY to resume your reservation.');
        },
        onError: (errDesc) => {
          setButtonState('ERROR');
          setPaymentState('failed');
          setErrorMessage(errDesc || 'Payment was declined or cancelled.');
        },
      });
    } catch (err) {
      console.error('Payment initialization error:', err);
      setButtonState('ERROR');
      setPaymentState('failed');
      setErrorMessage(
        err.message && !err.message.includes('Internal')
          ? err.message
          : 'Unable to process your reservation. Please try again.'
      );
    }
  };

  // In-Drawer Checkout Tab: Authorize Test Payment
  const handleAuthorizeInDrawerPayment = async () => {
    if (!activeOrderData) return;
    setIsAuthorizing(true);
    setAuthProgress('Connecting to Razorpay gateway...');

    try {
      const authData = await authorizeTestPayment({
        bookingId: activeOrderData.bookingId,
        orderId: activeOrderData.orderId,
      });

      await handlePaymentVerification(authData, activeOrderData);
    } catch (authErr) {
      setButtonState('ERROR');
      setPaymentState('failed');
      setErrorMessage(authErr.message || 'Payment authorization failed.');
    } finally {
      setIsAuthorizing(false);
    }
  };

  // In-Drawer Checkout Tab: Bank Decline Simulation
  const handleSimulateDecline = () => {
    setButtonState('ERROR');
    setPaymentState('failed');
    setErrorMessage('Payment declined by issuing bank: Card restricted or daily test limit reached.');
  };

  // Section 11: Try Again Handler
  const handleRetryPayment = () => {
    setErrorMessage('');
    setInlineAvailabilityError('');
    setButtonState('DEFAULT');
    setPaymentState('idle');
  };

  // Reset and close drawer
  const handleResetAndClose = () => {
    setButtonState('DEFAULT');
    setPaymentState('idle');
    setErrorMessage('');
    setInlineAvailabilityError('');
    setConfirmedBooking(null);
    setActiveOrderData(null);
    onClose();
  };

  return (
    <div className="booking-drawer-overlay" onClick={onClose} data-lenis-prevent="true">
      <div
        className="booking-drawer-panel"
        style={{
          backgroundColor: '#F4F1EB',
          color: '#111111',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
        }}
        onClick={(e) => e.stopPropagation()}
        data-lenis-prevent="true"
      >
        {/* Top Header */}
        <div
          className="p-6 border-b border-[#171717]/10 flex items-center justify-between sticky top-0 z-20"
          style={{ backgroundColor: '#F4F1EB' }}
        >
          <div>
            <span className="editorial-tag text-[10px] mb-1">Direct Reservation & Payment</span>
            <h3 className="font-serif text-2xl font-light uppercase text-[#111111]">
              Reserve Sanctuary
            </h3>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center border border-[#171717]/15 rounded-full hover:bg-[#111111] hover:text-[#F4F1EB] transition-colors"
            aria-label="Close drawer"
            style={{ backgroundColor: '#ECE8E0', color: '#111111' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="p-6 sm:p-8 space-y-6 flex-grow" style={{ backgroundColor: '#F4F1EB' }}>
          {/* ==================================================================== */}
          {/* SECTION 10: PREMIUM PAYMENT SUCCESS UI                               */}
          {/* ==================================================================== */}
          {paymentState === 'confirmed' && confirmedBooking && (
            <div className="text-center py-6 space-y-6 animate-fade-in" id="booking-success-view">
              <div className="w-16 h-16 rounded-full bg-[#A58A5C] text-[#111111] flex items-center justify-center mx-auto shadow-md">
                <Check size={32} />
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#A58A5C] block mb-1">
                  NOVA HOUSE · BENGALURU
                </span>
                <h4 className="font-serif text-3xl font-light uppercase text-[#111111] tracking-wide">
                  BOOKING CONFIRMED
                </h4>
                <p className="font-serif italic text-sm text-[#77736C] mt-1.5">
                  Thank you, <strong className="text-[#111111] not-italic font-medium">{confirmedBooking.guestName || guestName}</strong>.<br />
                  Your reservation at NOVA HOUSE has been confirmed.
                </p>
              </div>

              {/* Authoritative Reservation Dossier */}
              <div
                className="p-5 border border-[#D8D0C3] space-y-3.5 text-left font-mono text-xs rounded-none shadow-xs"
                style={{ backgroundColor: '#ECE8E0' }}
              >
                <div className="flex justify-between items-center pb-2.5 border-b border-[#D8D0C3]">
                  <span className="text-[#77736C] uppercase tracking-wider text-[11px]">Reservation ID:</span>
                  <strong className="text-[#111111] font-semibold text-sm">
                    {confirmedBooking.bookingId}
                  </strong>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#77736C] uppercase tracking-wider text-[11px]">Room:</span>
                  <span className="text-[#111111] font-medium">{confirmedBooking.roomTitle}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#77736C] uppercase tracking-wider text-[11px]">Check-in:</span>
                  <span className="text-[#111111]">{formatDisplayDate(confirmedBooking.checkIn)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#77736C] uppercase tracking-wider text-[11px]">Check-out:</span>
                  <span className="text-[#111111]">{formatDisplayDate(confirmedBooking.checkOut)}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-[#77736C] uppercase tracking-wider text-[11px]">Amount Paid:</span>
                  <span className="font-serif text-xl text-[#111111] font-semibold">
                    ₹{Number(confirmedBooking.totalAmount).toLocaleString('en-IN')}
                  </span>
                </div>

                <div className="flex justify-between items-center pt-2.5 border-t border-[#D8D0C3]">
                  <span className="text-[#77736C] uppercase tracking-wider text-[11px]">Status:</span>
                  <span className="px-2.5 py-0.5 rounded-none bg-[#EDF7F0] text-[#235C33] border border-[#C8E8D1] font-bold tracking-wider text-[11px]">
                    CONFIRMED
                  </span>
                </div>
              </div>

              {/* Notification Dispatch Notice */}
              <div
                className="p-4 border border-[#D8D0C3] space-y-2.5 text-left font-mono text-xs rounded-none bg-[#FAF8F5]"
                id="booking-notification-notice"
              >
                <div className="flex items-center gap-2 text-[#77736C] text-[10px] uppercase tracking-wider font-semibold border-b border-[#ECE7DE] pb-1.5">
                  <ShieldCheck size={13} className="text-[#235C33]" />
                  <span>Confirmation sent to:</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1 text-[11px]">
                  <div className="flex items-center gap-2 text-[#111111]">
                    <Mail size={13} className="text-[#A58A5C] shrink-0" />
                    <span>{maskEmail(confirmedBooking.guestEmail || guestEmail)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-[#111111]">
                    <Phone size={13} className="text-[#A58A5C] shrink-0" />
                    <span>{maskPhone(confirmedBooking.guestPhone || guestPhone)}</span>
                  </div>
                </div>

                <p className="font-serif italic text-[11px] text-[#77736C] pt-1 border-t border-[#ECE7DE]">
                  Your booking confirmation has been sent to your email and phone.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  id="btn-view-reservation"
                  onClick={() => window.print()}
                  className="w-full py-4 px-6 text-xs font-mono uppercase tracking-widest font-semibold shadow-md flex items-center justify-center gap-2 transition-all rounded-none bg-[#111111] hover:bg-black text-[#F4F1EB]"
                >
                  <ArrowUpRight size={14} className="text-[#A58A5C]" />
                  <span>VIEW RESERVATION</span>
                </button>

                <button
                  type="button"
                  id="btn-done-reservation"
                  onClick={handleResetAndClose}
                  className="w-full py-3.5 px-6 text-xs font-mono uppercase tracking-widest text-[#77736C] hover:text-[#111111] border border-[#D8D0C3] hover:border-[#111111] transition-colors"
                >
                  <span>DONE</span>
                </button>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* SECTION 11: PAYMENT FAILURE UI                                       */}
          {/* ==================================================================== */}
          {paymentState === 'failed' && (
            <div className="py-8 text-center space-y-5 animate-fade-in" id="booking-failed-view">
              <div className="w-14 h-14 rounded-full bg-[#FDF0F0] text-[#962828] border border-[#F7C6C6] flex items-center justify-center mx-auto">
                <AlertCircle size={28} />
              </div>

              <div>
                <h4 className="font-serif text-2xl font-light text-[#111111] uppercase tracking-wide">
                  PAYMENT NOT COMPLETED
                </h4>
                <p className="font-serif italic text-sm text-[#77736C] mt-1.5">
                  Your reservation has not been confirmed.
                </p>
                <div className="text-xs font-mono text-[#962828] mt-3 p-3 bg-red-50 border border-red-200 text-left">
                  {errorMessage || 'Unable to complete transaction. Please try again.'}
                </div>
                <p className="font-mono text-[11px] text-[#A58A5C] mt-3">
                  Your room selection and guest details are preserved without duplicate bookings.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  type="button"
                  id="btn-try-again"
                  onClick={handleRetryPayment}
                  className="w-full py-4 text-xs font-mono uppercase tracking-widest font-semibold flex items-center justify-center gap-2 rounded-none bg-[#111111] hover:bg-black text-[#F4F1EB] transition-all"
                >
                  <RefreshCw size={14} className="text-[#A58A5C]" />
                  <span>TRY AGAIN</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentState('idle');
                    setButtonState('DEFAULT');
                  }}
                  className="w-full py-2.5 text-xs font-mono text-[#77736C] hover:text-[#111111]"
                >
                  Modify Reservation Details
                </button>
              </div>
            </div>
          )}

          {/* ==================================================================== */}
          {/* IN-DRAWER RAZORPAY TEST CHECKOUT MODAL (SEAMLESS TEST FALLBACK)      */}
          {/* ==================================================================== */}
          {paymentState === 'checkout' && activeOrderData && (
            <div className="space-y-5 animate-fade-in">
              {/* Header Badge */}
              <div className="bg-[#0C2340] text-white p-5 rounded-none relative shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] tracking-wider uppercase bg-[#143257] text-[#52A2FF] px-2 py-0.5 font-semibold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Razorpay Test Mode
                  </span>
                  <span className="text-[10px] text-white/60 font-mono">
                    Ref: {activeOrderData.orderId}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <div>
                    <h4 className="font-serif text-lg tracking-wide text-white uppercase font-normal">
                      NOVA HOUSE
                    </h4>
                    <p className="text-xs text-white/70 font-mono">
                      {activeOrderData.roomTitle} · {activeOrderData.nights} Night
                      {activeOrderData.nights > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/60 block uppercase font-mono">Total Due</span>
                    <span className="text-xl font-bold font-mono text-white">
                      ₹{Number(activeOrderData.amount || 0).toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>

              {isAuthorizing ? (
                <div className="py-14 text-center space-y-4 bg-[#ECE8E0] p-6 rounded-none border border-[#D8D0C3]">
                  <Loader2 size={34} className="animate-spin text-[#0C2340] mx-auto" />
                  <h4 className="font-serif text-lg font-normal text-[#111111]">
                    Authorizing Payment
                  </h4>
                  <p className="font-mono text-xs text-[#77736C]">{authProgress}</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Payment Method Selector Tabs */}
                  <div className="grid grid-cols-3 gap-2 bg-[#ECE8E0] p-1 rounded-none border border-[#D8D0C3]">
                    <button
                      type="button"
                      onClick={() => setCheckoutTab('upi')}
                      className={`py-2 text-xs font-mono font-medium rounded-none transition-all flex items-center justify-center gap-1.5 ${
                        checkoutTab === 'upi'
                          ? 'bg-[#111111] text-[#F4F1EB] shadow-xs'
                          : 'text-[#55514B] hover:text-[#111111]'
                      }`}
                    >
                      <Smartphone size={13} />
                      <span>UPI / QR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheckoutTab('card')}
                      className={`py-2 text-xs font-mono font-medium rounded-none transition-all flex items-center justify-center gap-1.5 ${
                        checkoutTab === 'card'
                          ? 'bg-[#111111] text-[#F4F1EB] shadow-xs'
                          : 'text-[#55514B] hover:text-[#111111]'
                      }`}
                    >
                      <CreditCard size={13} />
                      <span>Card</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setCheckoutTab('netbanking')}
                      className={`py-2 text-xs font-mono font-medium rounded-none transition-all flex items-center justify-center gap-1.5 ${
                        checkoutTab === 'netbanking'
                          ? 'bg-[#111111] text-[#F4F1EB] shadow-xs'
                          : 'text-[#55514B] hover:text-[#111111]'
                      }`}
                    >
                      <Building2 size={13} />
                      <span>Netbanking</span>
                    </button>
                  </div>

                  {checkoutTab === 'upi' && (
                    <div className="p-4 bg-white border border-[#D8D0C3] rounded-none space-y-3">
                      <span className="text-[11px] font-mono uppercase text-[#77736C] block">
                        Select Instant Test App:
                      </span>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { id: 'gpay', name: 'Google Pay', icon: '🟢' },
                          { id: 'phonepe', name: 'PhonePe', icon: '🟣' },
                          { id: 'paytm', name: 'Paytm', icon: '🔵' },
                        ].map((app) => (
                          <button
                            key={app.id}
                            type="button"
                            onClick={() => setSelectedUpiApp(app.id)}
                            className={`p-2.5 border rounded-none text-center transition-all ${
                              selectedUpiApp === app.id
                                ? 'border-[#0C2340] bg-[#F4F8FC] shadow-xs font-semibold'
                                : 'border-[#E2DDD5] hover:border-[#A58A5C]'
                            }`}
                          >
                            <div className="text-sm mb-0.5">{app.icon}</div>
                            <span className="text-[11px] font-mono block">{app.name}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {checkoutTab === 'card' && (
                    <div className="p-4 bg-white border border-[#D8D0C3] rounded-none space-y-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#77736C] block mb-1">
                          Test Card Number
                        </label>
                        <input
                          type="text"
                          value={testCardNumber}
                          onChange={(e) => setTestCardNumber(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono border border-[#D8D0C3] rounded-none outline-none focus:border-[#0C2340]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="text-[10px] font-mono uppercase text-[#77736C] block mb-1">
                            Expiry (MM/YY)
                          </label>
                          <input
                            type="text"
                            value={testExpiry}
                            onChange={(e) => setTestExpiry(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono border border-[#D8D0C3] rounded-none outline-none focus:border-[#0C2340]"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-mono uppercase text-[#77736C] block mb-1">
                            CVV
                          </label>
                          <input
                            type="password"
                            value={testCvv}
                            onChange={(e) => setTestCvv(e.target.value)}
                            className="w-full px-3 py-2 text-xs font-mono border border-[#D8D0C3] rounded-none outline-none focus:border-[#0C2340]"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {checkoutTab === 'netbanking' && (
                    <div className="p-4 bg-white border border-[#D8D0C3] rounded-none space-y-2">
                      <span className="text-[11px] font-mono uppercase text-[#77736C] block mb-2">
                        Supported Test Banks:
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((b, i) => (
                          <label
                            key={b}
                            className="flex items-center gap-2 p-2 border border-[#E2DDD5] rounded-none cursor-pointer hover:bg-[#FAF8F5]"
                          >
                            <input type="radio" name="drawer_bank" defaultChecked={i === 0} />
                            <span>{b}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={handleAuthorizeInDrawerPayment}
                      className="w-full py-4 bg-[#0C2340] hover:bg-[#07172C] text-white rounded-none font-mono text-xs uppercase tracking-wider font-semibold shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Lock size={14} className="text-emerald-400" />
                      <span>
                        Authorize & Pay ₹{Number(activeOrderData.amount || 0).toLocaleString('en-IN')}
                      </span>
                    </button>

                    <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                      <button
                        type="button"
                        onClick={handleSimulateDecline}
                        className="text-red-700 hover:underline"
                      >
                        Simulate Bank Decline
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentState('idle');
                          setButtonState('DEFAULT');
                        }}
                        className="text-[#77736C] hover:text-[#111111]"
                      >
                        Cancel & Edit Details
                      </button>
                    </div>
                  </div>

                  <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#77736C]">
                    <ShieldCheck size={13} className="text-emerald-600" />
                    <span>Official 256-Bit Razorpay Test Mode Verification</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ==================================================================== */}
          {/* PRIMARY BOOKING & PAYMENT FORM (IDLE STATE)                          */}
          {/* ==================================================================== */}
          {paymentState === 'idle' && (
            <form onSubmit={handleStartPayment} className="space-y-4">
              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#77736C] mb-1.5 font-medium">
                  Guest Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Vikramaditya Rao"
                  value={guestName}
                  onChange={(e) => {
                    setGuestName(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  className="w-full border border-[#D8D0C3] p-3 text-xs font-mono outline-none focus:border-[#111111] transition-colors rounded-none"
                  style={{ backgroundColor: '#FFFFFF', color: '#111111' }}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#77736C] mb-1.5 font-medium">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="guest@domain.com"
                    value={guestEmail}
                    onChange={(e) => {
                      setGuestEmail(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="w-full border border-[#D8D0C3] p-3 text-xs font-mono outline-none focus:border-[#111111] transition-colors rounded-none"
                    style={{ backgroundColor: '#FFFFFF', color: '#111111' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#77736C] mb-1.5 font-medium">
                    Phone / WhatsApp
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98450 12345"
                    value={guestPhone}
                    onChange={(e) => {
                      setGuestPhone(e.target.value);
                      if (errorMessage) setErrorMessage('');
                    }}
                    className="w-full border border-[#D8D0C3] p-3 text-xs font-mono outline-none focus:border-[#111111] transition-colors rounded-none"
                    style={{ backgroundColor: '#FFFFFF', color: '#111111' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#77736C] mb-1.5 font-medium">
                  Select Room Sanctuary
                </label>
                <select
                  value={roomId}
                  onChange={(e) => {
                    setRoomId(e.target.value);
                    setInlineAvailabilityError('');
                  }}
                  className="w-full border border-[#D8D0C3] p-3 text-xs font-mono outline-none focus:border-[#111111] transition-colors rounded-none"
                  style={{ backgroundColor: '#FFFFFF', color: '#111111' }}
                >
                  {ROOMS_DATA.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title} — {r.pricePerNight} / night
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#77736C] mb-1.5 font-medium">
                    Check-in Date
                  </label>
                  <input
                    type="date"
                    value={checkIn}
                    onChange={(e) => handleCheckInChange(e.target.value)}
                    className="w-full border border-[#D8D0C3] p-3 text-xs font-mono outline-none focus:border-[#111111] transition-colors rounded-none"
                    style={{ backgroundColor: '#FFFFFF', color: '#111111' }}
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-mono uppercase tracking-widest text-[#77736C] mb-1.5 font-medium">
                    Check-out Date
                  </label>
                  <input
                    type="date"
                    value={checkOut}
                    min={getMinCheckOut(checkIn)}
                    onChange={(e) => handleCheckOutChange(e.target.value)}
                    className="w-full border border-[#D8D0C3] p-3 text-xs font-mono outline-none focus:border-[#111111] transition-colors rounded-none"
                    style={{ backgroundColor: '#FFFFFF', color: '#111111' }}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#77736C] mb-1.5 font-medium">
                  Guests
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full border border-[#D8D0C3] p-3 text-xs font-mono outline-none focus:border-[#111111] transition-colors rounded-none"
                  style={{ backgroundColor: '#FFFFFF', color: '#111111' }}
                >
                  <option>1 Adult</option>
                  <option>2 Adults</option>
                  <option>2 Adults, 1 Child</option>
                  <option>3 Adults</option>
                  <option>4 Adults (Signature Suite)</option>
                </select>
              </div>

              {/* Background Availability Status Feedback */}
              <div className="text-[11px] font-mono flex items-center justify-between p-2.5 bg-[#FFFFFF] border border-[#D8D0C3] rounded-none">
                <span className="text-[#77736C]">Sanctuary Availability:</span>
                {isCheckingAvailability ? (
                  <span className="text-[#77736C] flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Checking database...
                  </span>
                ) : availabilityResult && !availabilityResult.available ? (
                  <span className="text-amber-700 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> Booked for dates · Change dates
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <Check size={12} /> Available for Selected Dates
                  </span>
                )}
              </div>

              {/* Section 4: Inline Unavailability Alert */}
              {inlineAvailabilityError && (
                <div
                  className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-mono rounded-none flex items-center gap-2 animate-fade-in"
                  id="availability-error-msg"
                >
                  <AlertCircle size={15} className="shrink-0 text-red-600" />
                  <span>{inlineAvailabilityError}</span>
                </div>
              )}

              {/* Section 19: Authoritative Pricing Display */}
              <div
                className="p-5 border border-[#D8D0C3] space-y-2.5 shadow-xs rounded-none"
                style={{ backgroundColor: '#ECE8E0' }}
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#111111]">
                  <span className="text-[#77736C]">Duration:</span>
                  <span className="font-semibold">{nights} {nights === 1 ? 'Night' : 'Nights'}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-[#111111]">
                  <span className="text-[#77736C]">Room Rate ({nights}x):</span>
                  <span>₹{roomSubtotal.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-[#111111]">
                  <span className="text-[#77736C]">Luxury GST (18%):</span>
                  <span>₹{estimatedTaxes.toLocaleString('en-IN')}</span>
                </div>
                <div className="pt-2.5 border-t border-[#171717]/10 flex items-baseline justify-between">
                  <span className="text-xs font-mono font-bold text-[#111111] uppercase tracking-wider">
                    Total Payable:
                  </span>
                  <span className="font-serif text-2xl text-[#111111] font-semibold">
                    ₹{estimatedTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>

              {/* Validation or General Error Banner */}
              {errorMessage && (
                <div
                  className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs font-mono rounded-none flex items-center gap-2"
                  id="booking-error-banner"
                >
                  <AlertCircle size={14} className="shrink-0 text-red-600" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {/* Razorpay Trust Assurance */}
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#77736C]">
                <Shield size={14} className="text-[#A58A5C]" />
                <span>256-Bit SSL Secured · Official Razorpay Checkout Gateway</span>
              </div>

              {/* ================================================================ */}
              {/* SECTION 1 & 2: PRIMARY ACTION BUTTON (PAY ₹{amount})              */}
              {/* ================================================================ */}
              <button
                type="button"
                id="booking-pay-cta"
                onClick={handleStartPayment}
                disabled={isProcessing}
                className={`w-full py-4 px-6 text-xs font-mono tracking-widest font-semibold shadow-md flex items-center justify-center gap-2.5 rounded-none uppercase transition-all duration-200 ${
                  isProcessing
                    ? 'bg-[#2A2A2A] text-[#D8D0C3] cursor-wait opacity-90'
                    : buttonState === 'ERROR'
                    ? 'bg-[#8B2020] hover:bg-[#6E1818] text-[#FFFFFF] cursor-pointer'
                    : 'bg-[#111111] hover:bg-[#000000] text-[#F4F1EB] active:scale-[0.99] cursor-pointer'
                }`}
                style={{ minHeight: '52px' }}
              >
                {isProcessing ? (
                  <Loader2 size={16} className="animate-spin text-[#A58A5C]" />
                ) : buttonState === 'SUCCESS' ? (
                  <Check size={16} className="text-emerald-400" />
                ) : buttonState === 'ERROR' ? (
                  <RefreshCw size={16} className="text-white" />
                ) : (
                  <CreditCard size={16} className="text-[#A58A5C]" />
                )}
                <span className="font-mono tracking-wider text-[12px]">{getButtonText()}</span>
              </button>
            </form>
          )}
        </div>

        {/* Bottom Gateway Badge */}
        <div
          className="p-4 border-t border-[#171717]/10 text-[10px] font-mono text-[#77736C] flex items-center justify-between"
          style={{ backgroundColor: '#ECE8E0' }}
        >
          <span>NOVA HOUSE · BENGALURU</span>
          <span className="text-[#A58A5C]">RAZORPAY TEST MODE ACTIVE</span>
        </div>
      </div>
    </div>
  );
}
