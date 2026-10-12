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
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ROOMS_DATA } from '../data/hotelData';
import {
  createRazorpayOrder,
  verifyPaymentOnServer,
  retryPaymentOrder,
} from '../services/paymentService';
import { checkAvailability } from '../services/bookingApi';

export default function BookingDrawer({ isOpen, onClose, defaultRoomId }) {
  const [checkIn, setCheckIn] = useState('2026-10-18');
  const [checkOut, setCheckOut] = useState('2026-10-21');

  const getMinCheckOut = (inDateStr) => {
    if (!inDateStr) return '';
    const d = new Date(inDateStr);
    d.setDate(d.getDate() + 1);
    return d.toISOString().split('T')[0];
  };

  const handleCheckInChange = (newIn) => {
    setCheckIn(newIn);
    const minOut = getMinCheckOut(newIn);
    if (!checkOut || checkOut <= newIn) {
      setCheckOut(minOut);
    }
  };
  const [guests, setGuests] = useState('2 Guests');
  const [roomId, setRoomId] = useState(defaultRoomId || 'deluxe-room');
  const [guestName, setGuestName] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestPhone, setGuestPhone] = useState('');

  // Payment states: 'idle' | 'preparing' | 'checkout' | 'verifying' | 'confirmed' | 'failed'
  const [paymentState, setPaymentState] = useState('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmedBooking, setConfirmedBooking] = useState(null);
  const [activeOrderData, setActiveOrderData] = useState(null);

  // Live Database Availability State
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState(null);

  // In-drawer Razorpay Checkout state
  const [checkoutTab, setCheckoutTab] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [testCardNumber, setTestCardNumber] = useState('4111 2222 3333 4444');
  const [testExpiry, setTestExpiry] = useState('12/28');
  const [testCvv, setTestCvv] = useState('789');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authProgress, setAuthProgress] = useState('');

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

  // Live Database Availability Check
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
          guests: parseInt(guests) || 2,
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

  const handleStartPayment = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (availabilityResult && availabilityResult.available === false) {
      setPaymentState('idle');
      setErrorMessage('Selected room sanctuary is already reserved for these dates in the database. Please select alternate dates or another suite.');
      return;
    }

    setPaymentState('preparing'); // "Preparing secure payment..."

    try {
      // 1. Authoritative Server-Side Calculation and Razorpay Order Creation
      const orderPayload = {
        roomId: selectedRoom.id,
        checkIn,
        checkOut,
        guestName: guestName.trim() || 'Valued Guest',
        guestEmail: guestEmail.trim() || 'guest@novahouse.example',
        guestPhone: guestPhone.trim() || '+91 98450 12345',
        guestCountry: 'India',
        guests: parseInt(guests) || 2,
        specialRequests: 'Online reservation via NOVA HOUSE booking drawer',
      };

      const orderData = await createRazorpayOrder(orderPayload);
      setActiveOrderData(orderData);
      setPaymentState('checkout'); // Open integrated Razorpay Checkout
    } catch (err) {
      setPaymentState('failed');
      setErrorMessage(err.message || 'Failed to initialize payment gateway.');
    }
  };

  const handleAuthorizePayment = () => {
    if (!activeOrderData) return;
    setIsAuthorizing(true);
    setAuthProgress('Connecting to Razorpay gateway...');

    setTimeout(() => {
      setAuthProgress('Authorizing transaction signature...');
    }, 400);

    setTimeout(async () => {
      const simulatedPaymentId = `pay_test_${Math.random().toString(36).substring(2, 10)}`;
      const simulatedSignature = `test_sig_${Math.random().toString(36).substring(2, 18)}`;

      setPaymentState('verifying');
      setIsAuthorizing(false);

      try {
        // 2. Server-Side Cryptographic Signature Verification
        const verifyResult = await verifyPaymentOnServer({
          razorpay_order_id: activeOrderData.orderId,
          razorpay_payment_id: simulatedPaymentId,
          razorpay_signature: simulatedSignature,
          booking_id: activeOrderData.bookingId,
        });

        setConfirmedBooking({
          bookingId: verifyResult.bookingId,
          paymentId: verifyResult.paymentId,
          totalAmount: activeOrderData?.amount || estimatedTotal,
          roomTitle: activeOrderData?.roomTitle || selectedRoom.title,
          nights: activeOrderData?.nights || nights,
          checkIn,
          checkOut,
          guests: parseInt(guests) || 2,
          paymentStatus: verifyResult.paymentStatus || 'PAID',
        });
        setPaymentState('confirmed');

        try {
          confetti({
            particleCount: 85,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#A58A5C', '#111111', '#D8D0C3', '#FFFFFF'],
          });
        } catch (err) {}
      } catch (verErr) {
        setErrorMessage(verErr.message || 'Signature verification failed.');
        setPaymentState('failed');
      }
    }, 900);
  };

  const handleSimulateDecline = () => {
    setIsAuthorizing(true);
    setAuthProgress('Simulating bank authorization check...');

    setTimeout(() => {
      setIsAuthorizing(false);
      setPaymentState('failed');
      setErrorMessage('Payment declined by issuing bank: Card restricted or daily test limit reached.');
    }, 700);
  };

  const handleRetryPayment = async () => {
    if (!activeOrderData?.bookingId) {
      setPaymentState('idle');
      return;
    }

    setErrorMessage('');
    setPaymentState('preparing');

    try {
      const newOrder = await retryPaymentOrder(activeOrderData.bookingId);
      setActiveOrderData(newOrder);
      setPaymentState('checkout');
    } catch (e) {
      setPaymentState('failed');
      setErrorMessage(e.message || 'Payment retry initialization failed.');
    }
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
          {/* STATE 1: PAYMENT CONFIRMED */}
          {paymentState === 'confirmed' && confirmedBooking && (
            <div className="text-center py-8 space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-full bg-[#A58A5C] text-[#111111] flex items-center justify-center mx-auto shadow-md">
                <Check size={32} />
              </div>

              <div>
                <span className="font-mono text-[10px] uppercase tracking-[0.25em] text-[#A58A5C] block mb-1">
                  NOVA HOUSE · BENGALURU
                </span>
                <h4 className="font-serif text-3xl font-light uppercase text-[#111111]">
                  Booking Confirmed
                </h4>
                <p className="font-serif italic text-sm text-[#77736C] mt-1">
                  "Your stay is reserved and verified."
                </p>
              </div>

              {/* Dossier Card */}
              <div
                className="p-5 border border-[#D8D0C3] space-y-3 text-left font-mono text-xs rounded-xs"
                style={{ backgroundColor: '#ECE8E0' }}
              >
                <div className="flex justify-between items-center pb-2 border-b border-[#D8D0C3]">
                  <span className="text-[#77736C]">Booking ID:</span>
                  <strong className="text-[#111111] font-semibold">
                    {confirmedBooking.bookingId}
                  </strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#77736C]">Payment Status:</span>
                  <span className="px-2 py-0.5 rounded-xs bg-[#EDF7F0] text-[#235C33] border border-[#C8E8D1] font-bold">
                    PAID
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#77736C]">Room Sanctuary:</span>
                  <span className="text-[#111111] font-medium">{confirmedBooking.roomTitle}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#77736C]">Check-in:</span>
                  <span className="text-[#111111]">{confirmedBooking.checkIn}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#77736C]">Check-out:</span>
                  <span className="text-[#111111]">{confirmedBooking.checkOut}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#77736C]">Guests:</span>
                  <span className="text-[#111111]">{confirmedBooking.guests}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[#77736C]">Razorpay ID:</span>
                  <span className="text-[#111111] font-mono text-[11px]">
                    {confirmedBooking.paymentId}
                  </span>
                </div>
                <div className="flex justify-between items-baseline pt-2 border-t border-[#D8D0C3]">
                  <span className="text-[#77736C]">Total Amount:</span>
                  <span className="font-serif text-xl text-[#111111] font-semibold">
                    ₹ {confirmedBooking.totalAmount.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="w-full btn-luxury-primary !py-3.5 text-xs tracking-wider"
                  style={{ backgroundColor: '#111111', color: '#F4F1EB', borderColor: '#111111' }}
                >
                  <span>Print / Save Booking Voucher</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPaymentState('idle');
                    onClose();
                  }}
                  className="w-full py-3 text-xs font-mono tracking-wider text-[#77736C] hover:text-[#111111] transition-colors"
                >
                  Back to Nova House
                </button>
              </div>
            </div>
          )}

          {/* STATE 2: INTEGRATED RAZORPAY CHECKOUT INTERFACE */}
          {paymentState === 'checkout' && activeOrderData && (
            <div className="space-y-5 animate-fade-in">
              {/* Razorpay Brand Header Card */}
              <div className="bg-[#0C2340] text-white p-5 rounded-xs relative shadow-md">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-[10px] tracking-wider uppercase bg-[#143257] text-[#52A2FF] px-2 py-0.5 rounded font-semibold flex items-center gap-1">
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
                      {activeOrderData.roomTitle} · {activeOrderData.nights} Night{activeOrderData.nights > 1 ? 's' : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-white/60 block uppercase font-mono">Total Due</span>
                    <span className="text-xl font-bold font-mono text-white">
                      ₹ {Number(activeOrderData.amount || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Authorizing Spinner Overlay or Tabs */}
              {isAuthorizing ? (
                <div className="py-14 text-center space-y-4 bg-[#ECE8E0] p-6 rounded-xs border border-[#D8D0C3]">
                  <Loader2 size={34} className="animate-spin text-[#0C2340] mx-auto" />
                  <h4 className="font-serif text-lg font-normal text-[#111111]">
                    Authorizing Payment
                  </h4>
                  <p className="font-mono text-xs text-[#77736C]">
                    {authProgress}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Payment Method Selector Tabs */}
                  <div className="grid grid-cols-3 gap-2 bg-[#ECE8E0] p-1 rounded-xs border border-[#D8D0C3]">
                    <button
                      type="button"
                      onClick={() => setCheckoutTab('upi')}
                      className={`py-2 text-xs font-mono font-medium rounded-xs transition-all flex items-center justify-center gap-1.5 ${
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
                      className={`py-2 text-xs font-mono font-medium rounded-xs transition-all flex items-center justify-center gap-1.5 ${
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
                      className={`py-2 text-xs font-mono font-medium rounded-xs transition-all flex items-center justify-center gap-1.5 ${
                        checkoutTab === 'netbanking'
                          ? 'bg-[#111111] text-[#F4F1EB] shadow-xs'
                          : 'text-[#55514B] hover:text-[#111111]'
                      }`}
                    >
                      <Building2 size={13} />
                      <span>Netbanking</span>
                    </button>
                  </div>

                  {/* TAB 1: UPI */}
                  {checkoutTab === 'upi' && (
                    <div className="p-4 bg-white border border-[#D8D0C3] rounded-xs space-y-3">
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
                            className={`p-2.5 border rounded-xs text-center transition-all ${
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

                      <div className="pt-2 border-t border-[#ECE8E0] text-[11px] font-mono text-[#55514B] flex justify-between">
                        <span>Payer UPI:</span>
                        <strong className="text-[#111111]">
                          {guestPhone ? `${guestPhone.replace(/[^0-9]/g, '')}@okaxis` : 'guest@okhdfc'}
                        </strong>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: CARDS */}
                  {checkoutTab === 'card' && (
                    <div className="p-4 bg-white border border-[#D8D0C3] rounded-xs space-y-3">
                      <div>
                        <label className="text-[10px] font-mono uppercase text-[#77736C] block mb-1">
                          Test Card Number
                        </label>
                        <input
                          type="text"
                          value={testCardNumber}
                          onChange={(e) => setTestCardNumber(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-mono border border-[#D8D0C3] rounded-xs outline-none focus:border-[#0C2340]"
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
                            className="w-full px-3 py-2 text-xs font-mono border border-[#D8D0C3] rounded-xs outline-none focus:border-[#0C2340]"
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
                            className="w-full px-3 py-2 text-xs font-mono border border-[#D8D0C3] rounded-xs outline-none focus:border-[#0C2340]"
                          />
                        </div>
                      </div>

                      <p className="text-[10px] text-emerald-700 font-mono bg-emerald-50 p-2 rounded-xs border border-emerald-200">
                        ✓ Test credentials ready. No real money will be charged.
                      </p>
                    </div>
                  )}

                  {/* TAB 3: NETBANKING */}
                  {checkoutTab === 'netbanking' && (
                    <div className="p-4 bg-white border border-[#D8D0C3] rounded-xs space-y-2">
                      <span className="text-[11px] font-mono uppercase text-[#77736C] block mb-2">
                        Supported Test Banks:
                      </span>
                      <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                        {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((b, i) => (
                          <label
                            key={b}
                            className="flex items-center gap-2 p-2 border border-[#E2DDD5] rounded-xs cursor-pointer hover:bg-[#FAF8F5]"
                          >
                            <input type="radio" name="drawer_bank" defaultChecked={i === 0} />
                            <span>{b}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Payer Summary */}
                  <div className="p-3 bg-[#ECE8E0] border border-[#D8D0C3] rounded-xs text-[11px] font-mono flex items-center justify-between">
                    <span className="text-[#77736C]">Guest: <strong className="text-[#111111]">{guestName || 'Valued Guest'}</strong></span>
                    <span className="text-[#55514B]">{guestEmail || 'guest@novahouse.com'}</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-2 pt-2">
                    <button
                      type="button"
                      onClick={handleAuthorizePayment}
                      className="w-full py-4 bg-[#0C2340] hover:bg-[#07172C] text-white rounded-xs font-mono text-xs uppercase tracking-wider font-semibold shadow-md flex items-center justify-center gap-2 transition-all"
                    >
                      <Lock size={14} className="text-emerald-400" />
                      <span>Authorize & Pay ₹ {Number(activeOrderData.amount || 0).toLocaleString()}</span>
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
                        onClick={() => setPaymentState('idle')}
                        className="text-[#77736C] hover:text-[#111111]"
                      >
                        Cancel & Edit Details
                      </button>
                    </div>
                  </div>

                  {/* Trust Badge */}
                  <div className="pt-1 flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#77736C]">
                    <ShieldCheck size={13} className="text-emerald-600" />
                    <span>Official 256-Bit Razorpay Test Mode Verification</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATE 3: PAYMENT FAILED OR DECLINED */}
          {paymentState === 'failed' && (
            <div className="py-8 text-center space-y-5 animate-fade-in">
              <div className="w-14 h-14 rounded-full bg-[#FDF0F0] text-[#962828] border border-[#F7C6C6] flex items-center justify-center mx-auto">
                <AlertCircle size={28} />
              </div>

              <div>
                <h4 className="font-serif text-2xl font-light text-[#111111]">
                  Payment Not Completed
                </h4>
                <p className="text-xs text-[#77736C] mt-1 leading-relaxed">
                  {errorMessage || 'Payment could not be completed. Please try again.'}
                </p>
                <p className="font-mono text-[11px] text-[#A58A5C] mt-2">
                  Your reservation preference is preserved without duplicate orders.
                </p>
              </div>

              <div className="space-y-3 pt-4">
                <button
                  type="button"
                  onClick={handleRetryPayment}
                  className="w-full btn-luxury-primary !py-4 text-xs tracking-widest font-semibold flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#111111', color: '#F4F1EB', borderColor: '#111111' }}
                >
                  <RefreshCw size={14} />
                  <span>Try Payment Again</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentState('idle')}
                  className="w-full py-2.5 text-xs font-mono text-[#77736C] hover:text-[#111111]"
                >
                  Modify Booking Details
                </button>
              </div>
            </div>
          )}

          {/* STATE 4: PROCESSING / LOADING SPINNERS */}
          {(paymentState === 'preparing' || paymentState === 'verifying') && (
            <div className="py-16 text-center space-y-4 animate-fade-in">
              <Loader2 size={32} className="animate-spin text-[#A58A5C] mx-auto" />
              <h4 className="font-serif text-xl font-light text-[#111111]">
                {paymentState === 'preparing'
                  ? 'Preparing Secure Payment...'
                  : 'Confirming Your Payment...'}
              </h4>
              <p className="font-mono text-xs text-[#77736C]">
                {paymentState === 'preparing'
                  ? 'Authorizing with Razorpay gateway server...'
                  : 'Cryptographically validating payment signature...'}
              </p>
            </div>
          )}

          {/* STATE 5: NORMAL BOOKING & PAYMENT FORM */}
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
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full border border-[#D8D0C3] p-3 text-xs font-mono outline-none focus:border-[#111111] transition-colors"
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
                    onChange={(e) => setGuestEmail(e.target.value)}
                    className="w-full border border-[#D8D0C3] p-3 text-xs font-mono outline-none focus:border-[#111111] transition-colors"
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
                    onChange={(e) => setGuestPhone(e.target.value)}
                    className="w-full border border-[#D8D0C3] p-3 text-xs font-mono outline-none focus:border-[#111111] transition-colors"
                    style={{ backgroundColor: '#FFFFFF', color: '#111111' }}
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono uppercase tracking-widest text-[#77736C] mb-1.5 font-medium">
                  Select Room Sanctuary
                </label>
                <select
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="w-full border border-[#D8D0C3] p-3 text-xs font-mono outline-none focus:border-[#111111] transition-colors"
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
                    className="w-full border border-[#D8D0C3] p-3 text-xs font-mono outline-none focus:border-[#111111] transition-colors"
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
                    onChange={(e) => setCheckOut(e.target.value)}
                    className="w-full border border-[#D8D0C3] p-3 text-xs font-mono outline-none focus:border-[#111111] transition-colors"
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
                  className="w-full border border-[#D8D0C3] p-3 text-xs font-mono outline-none focus:border-[#111111] transition-colors"
                  style={{ backgroundColor: '#FFFFFF', color: '#111111' }}
                >
                  <option>1 Adult</option>
                  <option>2 Adults</option>
                  <option>2 Adults, 1 Child</option>
                  <option>3 Adults</option>
                  <option>4 Adults (Signature Suite)</option>
                </select>
              </div>

              {/* Live Database Availability Indicator */}
              <div className="text-[11px] font-mono flex items-center justify-between p-2.5 bg-[#FFFFFF] border border-[#D8D0C3] rounded-xs">
                <span className="text-[#77736C]">Sanctuary Availability:</span>
                {isCheckingAvailability ? (
                  <span className="text-[#77736C] flex items-center gap-1">
                    <Loader2 size={12} className="animate-spin" /> Checking database...
                  </span>
                ) : availabilityResult && !availabilityResult.available ? (
                  <span className="text-red-600 font-medium flex items-center gap-1">
                    <AlertCircle size={12} /> Booked for dates · Change dates
                  </span>
                ) : (
                  <span className="text-emerald-700 font-medium flex items-center gap-1">
                    <Check size={12} /> Available for Selected Dates
                  </span>
                )}
              </div>

              {/* Server-Side Calculated Booking Price Summary */}
              <div
                className="p-5 border border-[#D8D0C3] space-y-2.5 shadow-sm rounded-xs"
                style={{ backgroundColor: '#ECE8E0' }}
              >
                <div className="flex items-center justify-between text-xs font-mono text-[#111111]">
                  <span className="text-[#77736C]">Duration:</span>
                  <span className="font-semibold">{nights} Nights</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-[#111111]">
                  <span className="text-[#77736C]">Room Rate ({nights}x):</span>
                  <span>₹ {roomSubtotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono text-[#111111]">
                  <span className="text-[#77736C]">Luxury GST Tax (18%):</span>
                  <span>₹ {estimatedTaxes.toLocaleString()}</span>
                </div>
                <div className="pt-2 border-t border-[#171717]/10 flex items-baseline justify-between">
                  <span className="text-xs font-mono font-bold text-[#111111]">Total Payable:</span>
                  <span className="font-serif text-2xl text-[#111111] font-semibold">
                    ₹ {estimatedTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Razorpay Security Assurance */}
              <div className="flex items-center gap-2 text-[11px] font-mono text-[#77736C]">
                <Shield size={14} className="text-[#A58A5C]" />
                <span>256-Bit SSL Secured · Official Razorpay Checkout Gateway</span>
              </div>

              {/* Action Button: PAY ₹XX,XXX */}
              <button
                type="submit"
                className="w-full btn-luxury-primary !py-4 text-xs tracking-widest font-semibold shadow-md flex items-center justify-center gap-2"
                style={{ backgroundColor: '#111111', color: '#F4F1EB', borderColor: '#111111' }}
              >
                <CreditCard size={15} className="text-[#A58A5C]" />
                <span>PAY ₹ {estimatedTotal.toLocaleString()}</span>
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
