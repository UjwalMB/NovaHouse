import React, { useState } from 'react';
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Building2,
  CheckCircle2,
  X,
  AlertCircle,
  Loader2,
  Smartphone,
  Lock,
} from 'lucide-react';
import { authorizeTestPayment } from '../services/paymentService';

export default function RazorpayModal({
  isOpen,
  orderData,
  guestName,
  guestEmail,
  guestPhone,
  onSuccess,
  onDismiss,
  onError,
}) {
  const [activeTab, setActiveTab] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [selectedUpiApp, setSelectedUpiApp] = useState('gpay');
  const [cardNumber, setCardNumber] = useState('4111 2222 3333 4444');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvv, setCardCvv] = useState('789');

  if (!isOpen || !orderData) return null;

  const handleSimulateSuccess = async () => {
    setIsProcessing(true);
    setProcessingStatus('Connecting to secure payment gateway...');

    setTimeout(() => {
      setProcessingStatus('Cryptographically signing test transaction...');
    }, 400);

    try {
      const authData = await authorizeTestPayment({
        bookingId: orderData.bookingId,
        orderId: orderData.orderId,
      });

      setIsProcessing(false);
      if (onSuccess) {
        onSuccess({
          ...authData,
          amount: orderData.amount,
          method: activeTab === 'upi' ? 'UPI / Razorpay' : activeTab === 'card' ? 'Card / Razorpay' : 'Netbanking / Razorpay',
          email: guestEmail,
          contact: guestPhone,
        });
      }
    } catch (err) {
      setIsProcessing(false);
      if (onError) {
        onError(err.message || 'Signature authorization failed.');
      }
    }
  };

  const handleSimulateDecline = () => {
    setIsProcessing(true);
    setProcessingStatus('Simulating bank authorization check...');

    setTimeout(() => {
      setIsProcessing(false);
      if (onError) {
        onError('Payment declined by issuing bank: Transaction limit exceeded on test account.');
      }
    }, 800);
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-[#FBFAF6] rounded-lg shadow-2xl overflow-hidden text-[#181818] font-sans flex flex-col relative z-[10000] border border-[#181818]/15 animate-in zoom-in-95 duration-200"
        style={{ maxHeight: '90vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Razorpay Luxury Brand Header */}
        <div className="bg-[#0C2340] text-white p-5 relative">
          <button
            onClick={onDismiss}
            disabled={isProcessing}
            className="absolute top-4 right-4 text-white/70 hover:text-white p-1 rounded-full transition-colors"
            aria-label="Close payment modal"
          >
            <X size={18} />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="font-mono text-[10px] tracking-wider uppercase bg-[#143257] text-[#52A2FF] px-2 py-0.5 rounded font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Razorpay Test Mode
            </span>
            <span className="text-[10px] text-white/60 font-mono">
              Ref: {orderData.orderId || 'order_active'}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-serif text-lg tracking-wide text-white uppercase font-normal">
                NOVA HOUSE
              </h3>
              <p className="text-xs text-white/70 font-mono">
                {orderData.roomTitle} · {orderData.nights} Night{orderData.nights > 1 ? 's' : ''}
              </p>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-white/60 block uppercase font-mono">Amount Payable</span>
              <span className="text-xl font-bold font-mono text-white">
                ₹ {Number(orderData.amount || 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {/* Processing Loading Overlay */}
        {isProcessing ? (
          <div className="py-16 px-6 text-center space-y-4">
            <Loader2 size={36} className="animate-spin text-[#0C2340] mx-auto" />
            <h4 className="font-serif text-lg font-normal text-[#181818]">
              Authorizing Payment
            </h4>
            <p className="font-mono text-xs text-[#77736B]">
              {processingStatus}
            </p>
          </div>
        ) : (
          <div className="p-5 space-y-4 flex-grow overflow-y-auto">
            {/* Payment Method Selector Tabs */}
            <div className="grid grid-cols-3 gap-2 bg-[#EFEBE2] p-1 rounded">
              <button
                type="button"
                onClick={() => setActiveTab('upi')}
                className={`py-2 text-xs font-mono font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'upi'
                    ? 'bg-[#181818] text-[#F5F2EA] shadow-xs'
                    : 'text-[#77736B] hover:text-[#181818]'
                }`}
              >
                <Smartphone size={14} />
                <span>UPI / QR</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('card')}
                className={`py-2 text-xs font-mono font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'card'
                    ? 'bg-[#181818] text-[#F5F2EA] shadow-xs'
                    : 'text-[#77736B] hover:text-[#181818]'
                }`}
              >
                <CreditCard size={14} />
                <span>Card</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('netbanking')}
                className={`py-2 text-xs font-mono font-medium rounded transition-all flex items-center justify-center gap-1.5 ${
                  activeTab === 'netbanking'
                    ? 'bg-[#181818] text-[#F5F2EA] shadow-xs'
                    : 'text-[#77736B] hover:text-[#181818]'
                }`}
              >
                <Building2 size={14} />
                <span>Netbanking</span>
              </button>
            </div>

            {/* TAB 1: UPI */}
            {activeTab === 'upi' && (
              <div className="space-y-3 pt-1">
                <span className="text-[11px] font-mono uppercase text-[#77736B] block">
                  Select Fast UPI Checkout App
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
                      className={`p-3 border rounded text-center transition-all ${
                        selectedUpiApp === app.id
                          ? 'border-[#0C2340] bg-[#F4F8FC] shadow-xs font-semibold'
                          : 'border-[#181818]/12 hover:border-[#B69A68]'
                      }`}
                    >
                      <div className="text-base mb-1">{app.icon}</div>
                      <span className="text-xs font-mono block">{app.name}</span>
                    </button>
                  ))}
                </div>

                <div className="p-3 bg-[#FBFAF6] border border-[#181818]/10 rounded text-[11px] font-mono text-[#77736B] flex items-center justify-between">
                  <span>Guest VPA:</span>
                  <strong className="text-[#181818]">
                    {guestPhone ? `${guestPhone.replace(/[^0-9]/g, '')}@okaxis` : 'guest@okhdfc'}
                  </strong>
                </div>
              </div>
            )}

            {/* TAB 2: CARDS */}
            {activeTab === 'card' && (
              <div className="space-y-3 pt-1">
                <div>
                  <label className="text-[10px] font-mono uppercase text-[#77736B] block mb-1">
                    Test Card Number
                  </label>
                  <input
                    type="text"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-mono border border-[#181818]/12 bg-[#FBFAF6] text-[#181818] rounded outline-none focus:border-[#0C2340]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-mono uppercase text-[#77736B] block mb-1">
                      Expiry (MM/YY)
                    </label>
                    <input
                      type="text"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-[#181818]/12 bg-[#FBFAF6] text-[#181818] rounded outline-none focus:border-[#0C2340]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono uppercase text-[#77736B] block mb-1">
                      CVV
                    </label>
                    <input
                      type="password"
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-mono border border-[#181818]/12 bg-[#FBFAF6] text-[#181818] rounded outline-none focus:border-[#0C2340]"
                    />
                  </div>
                </div>

                <p className="text-[10px] text-emerald-700 font-mono bg-emerald-50 p-2 rounded border border-emerald-200">
                  ✓ Official Razorpay test credentials pre-filled. No real funds charged.
                </p>
              </div>
            )}

            {/* TAB 3: NETBANKING */}
            {activeTab === 'netbanking' && (
              <div className="space-y-3 pt-1">
                <span className="text-[11px] font-mono uppercase text-[#77736B] block">
                  Popular Indian Banks
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                  {['HDFC Bank', 'ICICI Bank', 'State Bank of India', 'Axis Bank'].map((b, i) => (
                    <label
                      key={b}
                      className="flex items-center gap-2 p-2.5 border border-[#181818]/12 rounded cursor-pointer hover:bg-[#EFEBE2]"
                    >
                      <input type="radio" name="bank" defaultChecked={i === 0} />
                      <span>{b}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Guest Summary Pill */}
            <div className="pt-2 border-t border-[#181818]/10 flex items-center justify-between text-[11px] font-mono text-[#77736B]">
              <span>Payer: <strong>{guestName || 'Valued Guest'}</strong></span>
              <span>{guestEmail || 'guest@novahouse.com'}</span>
            </div>

            {/* Primary Action Button */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={handleSimulateSuccess}
                className="w-full py-3.5 bg-[#0C2340] hover:bg-[#07172C] text-white rounded font-mono text-xs uppercase tracking-wider font-semibold shadow-md flex items-center justify-center gap-2 transition-all"
              >
                <Lock size={13} className="text-emerald-400" />
                <span>Pay ₹ {Number(orderData.amount || 0).toLocaleString()} (Test Mode)</span>
              </button>

              <div className="flex items-center justify-between pt-1 text-[11px] font-mono">
                <button
                  type="button"
                  onClick={handleSimulateDecline}
                  className="text-red-600 hover:underline"
                >
                  Simulate Bank Decline
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-[#77736B] hover:text-[#181818]"
                >
                  Cancel Payment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Security Footer */}
        <div className="bg-[#EFEBE2] p-3 border-t border-[#181818]/10 text-[10px] font-mono text-[#77736B] flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>256-bit Encrypted · Razorpay Test Gateway</span>
          </div>
          <span className="text-[#B69A68]">NOVA HOUSE BENGALURU</span>
        </div>
      </div>
    </div>
  );
}
