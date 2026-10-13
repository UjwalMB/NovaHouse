import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  User,
  CreditCard,
  Printer,
  Download,
  CheckCircle2,
  Clock,
  Ban,
  DoorOpen,
  MapPin,
  Mail,
  Phone,
  FileText,
  RotateCcw,
  ShieldCheck,
  Send,
  AlertCircle,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import {
  getBookingById,
  updateBookingStatus,
  getBookingNotifications,
  retryNotification,
  resendBookingNotifications,
} from '../services/bookingService';
import { fetchPaymentByBooking, processPaymentRefund, settlePayment } from '../services/paymentService';
import { useToast } from '../components/ui/Toast';
import StatusBadge from '../components/ui/StatusBadge';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';
import RefundModal from '../components/payments/RefundModal';

export default function BookingDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isRefundOpen, setIsRefundOpen] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [bookingData, paymentData, notifs] = await Promise.all([
        getBookingById(id),
        fetchPaymentByBooking(id),
        getBookingNotifications(id),
      ]);
      setBooking(bookingData);
      setPayment(paymentData);
      setNotifications(notifs || bookingData?.notifications || []);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleRetryNotification = async (notificationId) => {
    setIsRetrying(true);
    try {
      const res = await retryNotification(notificationId);
      if (res?.success) {
        addToast(res.message || 'Notification retried successfully.');
        const updated = await getBookingNotifications(id);
        setNotifications(updated);
      } else {
        addToast(res?.detail || 'Notification retry failed.', 'error');
      }
    } catch (err) {
      addToast(err.message || 'Notification retry failed.', 'error');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleSendConfirmations = async () => {
    setIsRetrying(true);
    try {
      const res = await resendBookingNotifications(booking.id);
      if (res?.success) {
        addToast('Booking confirmation notifications dispatched.');
        const updated = await getBookingNotifications(id);
        setNotifications(updated);
      }
    } catch (err) {
      addToast(err.message || 'Failed to dispatch notifications.', 'error');
    } finally {
      setIsRetrying(false);
    }
  };

  const handleRefundSuccess = async (refundPayload) => {
    await processPaymentRefund(refundPayload);
    addToast(`Refund of ₹ ${refundPayload.amount.toLocaleString()} processed successfully.`);
    const updatedPayment = await fetchPaymentByBooking(id);
    setPayment(updatedPayment);
    if (booking) {
      setBooking({ ...booking, paymentStatus: 'REFUNDED' });
    }
  };

  const handleSettlePayment = async () => {
    try {
      await settlePayment({
        bookingId: booking.id,
        paymentId: payment?.paymentId || payment?.id,
        method: 'POS Card Terminal',
      });
      addToast(`Payment of ₹ ${booking.totalAmount.toLocaleString()} successfully captured and marked as PAID.`);
      setBooking((prev) => ({
        ...prev,
        paymentStatus: 'PAID',
        bookingStatus: prev.bookingStatus === 'Pending' ? 'Confirmed' : prev.bookingStatus,
      }));
      const updatedPayment = await fetchPaymentByBooking(id);
      setPayment(updatedPayment);
    } catch (err) {
      addToast(err.message || 'Failed to settle payment.', 'error');
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (!booking) return;
    const updated = await updateBookingStatus(booking.id, newStatus);
    setBooking(updated);
    addToast(`Reservation status updated to ${newStatus}.`);
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="admin-card p-16">
        <LoadingState message="Retrieving booking dossier..." />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="admin-card p-12 text-center space-y-4">
        <h3 className="font-serif text-xl font-light text-[#111111]">
          Booking Dossier Not Found
        </h3>
        <p className="text-xs text-[#77736C]">
          The reservation with reference #{id} could not be located in current records.
        </p>
        <Button variant="primary" size="sm" onClick={() => navigate('/admin/bookings')}>
          Back to Bookings
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl">
      {/* Top Navigation & Status Actions Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/bookings"
            className="p-2 border border-[#E2DDD5] bg-[#FFFFFF] rounded-xs text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] transition-colors"
            aria-label="Back to bookings"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="font-serif text-2xl font-light text-[#111111]">
                Reservation #{booking.id}
              </h2>
              <StatusBadge status={booking.bookingStatus} />
            </div>
            <p className="font-mono text-xs text-[#77736C] mt-0.5">
              Source: <strong className="text-[#111111]">{booking.source}</strong> · Placed on {booking.createdAt}
            </p>
          </div>
        </div>

        {/* Action Buttons: Confirm, Check In, Check Out, Cancel, Pay Now */}
        <div className="flex flex-wrap items-center gap-2">
          {(booking.paymentStatus === 'Pending' || booking.paymentStatus === 'UNPAID' || payment?.status === 'PENDING') && (
            <Button
              variant="primary"
              size="sm"
              icon={CreditCard}
              onClick={handleSettlePayment}
            >
              Pay Now
            </Button>
          )}

          {booking.bookingStatus === 'Pending' && (
            <Button
              variant="primary"
              size="sm"
              icon={CheckCircle2}
              onClick={() => handleStatusChange('Confirmed')}
            >
              Confirm
            </Button>
          )}

          {booking.bookingStatus === 'Confirmed' && (
            <Button
              variant="primary"
              size="sm"
              icon={DoorOpen}
              onClick={() => handleStatusChange('Checked In')}
            >
              Check In Guest
            </Button>
          )}

          {booking.bookingStatus === 'Checked In' && (
            <Button
              variant="secondary"
              size="sm"
              icon={Clock}
              onClick={() => handleStatusChange('Checked Out')}
            >
              Check Out
            </Button>
          )}

          {booking.bookingStatus !== 'Cancelled' && booking.bookingStatus !== 'Checked Out' && (
            <Button
              variant="danger"
              size="sm"
              icon={Ban}
              onClick={() => handleStatusChange('Cancelled')}
            >
              Cancel
            </Button>
          )}

          <Button
            variant="secondary"
            size="sm"
            icon={Printer}
            onClick={handlePrint}
          >
            Print Dossier
          </Button>
        </div>
      </div>

      {/* Grid: Guest Profile + Stay Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Guest Information */}
        <div className="lg:col-span-5 space-y-6">
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="font-serif text-base font-light uppercase text-[#111111] flex items-center gap-2">
                <User size={16} className="text-[#A58A5C]" />
                <span>Guest Information</span>
              </h3>
            </div>
            <div className="p-6 space-y-4 text-xs font-mono">
              <div>
                <span className="text-[#77736C] block text-[10px] uppercase tracking-wider">
                  Full Name
                </span>
                <span className="font-sans text-base font-semibold text-[#111111]">
                  {booking.guestName}
                </span>
              </div>

              <div>
                <span className="text-[#77736C] block text-[10px] uppercase tracking-wider">
                  Email Contact
                </span>
                <span className="text-[#111111] flex items-center gap-1.5 mt-0.5">
                  <Mail size={13} className="text-[#A58A5C]" />
                  <span>{booking.guestEmail}</span>
                </span>
              </div>

              <div>
                <span className="text-[#77736C] block text-[10px] uppercase tracking-wider">
                  Phone Number
                </span>
                <span className="text-[#111111] flex items-center gap-1.5 mt-0.5">
                  <Phone size={13} className="text-[#A58A5C]" />
                  <span>{booking.guestPhone}</span>
                </span>
              </div>

              <div>
                <span className="text-[#77736C] block text-[10px] uppercase tracking-wider">
                  Country of Residence
                </span>
                <span className="text-[#111111] flex items-center gap-1.5 mt-0.5">
                  <MapPin size={13} className="text-[#A58A5C]" />
                  <span>{booking.guestCountry}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Guest Confirmation Notifications (Email & SMS) Card */}
          <div className="admin-card">
            <div className="admin-card-header flex items-center justify-between">
              <h3 className="font-serif text-base font-light uppercase text-[#111111] flex items-center gap-2">
                <ShieldCheck size={16} className="text-[#A58A5C]" />
                <span>Guest Confirmations</span>
              </h3>
              {booking.paymentStatus === 'PAID' && (
                <button
                  type="button"
                  onClick={handleSendConfirmations}
                  disabled={isRetrying}
                  className="text-[10px] font-mono text-[#A58A5C] hover:text-[#111111] flex items-center gap-1 hover:underline"
                >
                  <RefreshCw size={11} className={isRetrying ? 'animate-spin' : ''} />
                  <span>Resend All</span>
                </button>
              )}
            </div>
            <div className="p-6 space-y-4 text-xs font-mono">
              {/* Email Status Item */}
              {(() => {
                const emailNotif = notifications.find((n) => (n.type || n.notification_type) === 'EMAIL');
                const isSent = emailNotif?.status === 'SENT';
                const isFailed = emailNotif?.status === 'FAILED';
                return (
                  <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail size={14} className="text-[#A58A5C]" />
                        <span className="font-semibold text-[#111111]">Email Confirmation</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-xs ${
                          isSent
                            ? 'bg-[#EDF7F0] text-[#235C33] border border-[#C8E8D1]'
                            : isFailed
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-[#F4F1EB] text-[#77736C] border border-[#E2DDD5]'
                        }`}
                      >
                        {emailNotif ? emailNotif.status : 'PENDING'}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#77736C] space-y-0.5">
                      <div className="truncate">To: {booking.guestEmail}</div>
                      {emailNotif?.providerMessageId && (
                        <div className="text-[10px] text-[#A58A5C]">
                          Ref: {emailNotif.providerMessageId}
                        </div>
                      )}
                      {emailNotif?.sentAt && (
                        <div className="text-[10px] text-[#77736C]">
                          Sent: {new Date(emailNotif.sentAt).toLocaleString('en-GB')}
                        </div>
                      )}
                      {isFailed && (emailNotif?.error || emailNotif?.errorMessage) && (
                        <div className="text-[10px] text-rose-600 mt-1">
                          {emailNotif.errorMessage || emailNotif.error}
                        </div>
                      )}
                    </div>

                    {isFailed && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleRetryNotification(emailNotif.id)}
                          disabled={isRetrying}
                          className="px-2.5 py-1 text-[10px] font-medium bg-[#111111] text-[#FFFFFF] rounded-xs hover:bg-[#333333] flex items-center gap-1 transition-colors"
                        >
                          <RefreshCw size={10} className={isRetrying ? 'animate-spin' : ''} />
                          <span>Retry Email</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* SMS Status Item */}
              {(() => {
                const smsNotif = notifications.find((n) => (n.type || n.notification_type) === 'SMS');
                const isSent = smsNotif?.status === 'SENT';
                const isFailed = smsNotif?.status === 'FAILED';
                return (
                  <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone size={14} className="text-[#A58A5C]" />
                        <span className="font-semibold text-[#111111]">SMS Confirmation</span>
                      </div>
                      <span
                        className={`px-2 py-0.5 text-[10px] font-bold rounded-xs ${
                          isSent
                            ? 'bg-[#EDF7F0] text-[#235C33] border border-[#C8E8D1]'
                            : isFailed
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-[#F4F1EB] text-[#77736C] border border-[#E2DDD5]'
                        }`}
                      >
                        {smsNotif ? smsNotif.status : 'PENDING'}
                      </span>
                    </div>

                    <div className="text-[11px] text-[#77736C] space-y-0.5">
                      <div className="truncate">To: {booking.guestPhone}</div>
                      {smsNotif?.providerMessageId && (
                        <div className="text-[10px] text-[#A58A5C]">
                          Ref: {smsNotif.providerMessageId}
                        </div>
                      )}
                      {smsNotif?.sentAt && (
                        <div className="text-[10px] text-[#77736C]">
                          Sent: {new Date(smsNotif.sentAt).toLocaleString('en-GB')}
                        </div>
                      )}
                      {isFailed && (smsNotif?.error || smsNotif?.errorMessage) && (
                        <div className="text-[10px] text-rose-600 mt-1">
                          {smsNotif.errorMessage || smsNotif.error}
                        </div>
                      )}
                    </div>

                    {isFailed && (
                      <div className="pt-1">
                        <button
                          type="button"
                          onClick={() => handleRetryNotification(smsNotif.id)}
                          disabled={isRetrying}
                          className="px-2.5 py-1 text-[10px] font-medium bg-[#111111] text-[#FFFFFF] rounded-xs hover:bg-[#333333] flex items-center gap-1 transition-colors"
                        >
                          <RefreshCw size={10} className={isRetrying ? 'animate-spin' : ''} />
                          <span>Retry SMS</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Special Requests Card */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="font-serif text-base font-light uppercase text-[#111111] flex items-center gap-2">
                <FileText size={16} className="text-[#A58A5C]" />
                <span>Special Requests & Notes</span>
              </h3>
            </div>
            <div className="p-6">
              <p className="text-xs text-[#111111] leading-relaxed bg-[#FAF8F5] p-3.5 border border-[#ECE8E0] rounded-xs font-sans">
                {booking.specialRequests || 'No special requests noted for this reservation.'}
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Stay Details & Financial Billing Reconciliations */}
        <div className="lg:col-span-7 space-y-6">
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="font-serif text-base font-light uppercase text-[#111111] flex items-center gap-2">
                <Calendar size={16} className="text-[#A58A5C]" />
                <span>Stay Specifications</span>
              </h3>
            </div>

            <div className="p-6 grid grid-cols-2 sm:grid-cols-3 gap-5 text-xs font-mono border-b border-[#ECE8E0]">
              <div>
                <span className="text-[#77736C] block text-[10px] uppercase tracking-wider">
                  Sanctuary Room
                </span>
                <span className="font-serif text-sm font-light text-[#111111]">
                  {booking.roomType}
                </span>
                <span className="text-[10px] text-[#A58A5C] block">Room #{booking.roomNumber}</span>
              </div>

              <div>
                <span className="text-[#77736C] block text-[10px] uppercase tracking-wider">
                  Arrival Check-In
                </span>
                <span className="text-[#111111] font-semibold">{booking.checkIn}</span>
                <span className="text-[10px] text-[#77736C] block">Standard 02:00 PM</span>
              </div>

              <div>
                <span className="text-[#77736C] block text-[10px] uppercase tracking-wider">
                  Departure Check-Out
                </span>
                <span className="text-[#111111] font-semibold">{booking.checkOut}</span>
                <span className="text-[10px] text-[#77736C] block">Standard 12:00 PM</span>
              </div>

              <div>
                <span className="text-[#77736C] block text-[10px] uppercase tracking-wider">
                  Stay Duration
                </span>
                <span className="text-[#111111] font-semibold">{booking.nights} Nights</span>
              </div>

              <div>
                <span className="text-[#77736C] block text-[10px] uppercase tracking-wider">
                  Occupants
                </span>
                <span className="text-[#111111] font-semibold">{booking.guests} Guests</span>
              </div>

              <div>
                <span className="text-[#77736C] block text-[10px] uppercase tracking-wider">
                  Payment Status
                </span>
                <div className="mt-0.5">
                  <StatusBadge status={booking.paymentStatus} />
                </div>
              </div>
            </div>

            {/* Billing Breakdown */}
            <div className="p-6 space-y-3 bg-[#FAF8F5]">
              <span className="font-mono text-xs uppercase tracking-widest text-[#77736C] block mb-2 font-medium">
                Billing & Tariff Reconciliation
              </span>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#77736C]">
                  Room Tariff ({booking.nights} nights × ₹ {booking.baseRate.toLocaleString()})
                </span>
                <span className="text-[#111111]">
                  ₹ {(booking.baseRate * booking.nights).toLocaleString()}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-mono">
                <span className="text-[#77736C]">Luxury GST & Hospitality Cess (18%)</span>
                <span className="text-[#111111]">₹ {booking.taxes.toLocaleString()}</span>
              </div>

              {booking.discount > 0 && (
                <div className="flex items-center justify-between text-xs font-mono text-[#235C33]">
                  <span>Direct Booking Sanctuary Privilege</span>
                  <span>- ₹ {booking.discount.toLocaleString()}</span>
                </div>
              )}

              <div className="pt-3 border-t border-[#E2DDD5] flex items-center justify-between font-mono">
                <span className="font-serif text-base text-[#111111] font-light uppercase">
                  Grand Total
                </span>
                <span className="font-serif text-2xl font-semibold text-[#111111]">
                  ₹ {booking.totalAmount.toLocaleString()}
                </span>
              </div>

              <div className="pt-2 text-[11px] font-mono text-[#77736C] flex items-center justify-between">
                <span>Settlement Method: {booking.paymentMethod}</span>
                <span>GSTIN Invoice Available</span>
              </div>
            </div>
          </div>

          {/* Razorpay Gateway & Cryptographic Audit Card */}
          <div className="admin-card">
            <div className="admin-card-header flex items-center justify-between">
              <h3 className="font-serif text-base font-light uppercase text-[#111111] flex items-center gap-2">
                <CreditCard size={16} className="text-[#A58A5C]" />
                <span>Razorpay Gateway Reconciliations</span>
              </h3>
              <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#ECE8E0] text-[10px] font-mono text-[#55514B] rounded-xs flex items-center gap-1">
                <ShieldCheck size={12} className="text-[#A58A5C]" />
                Server-Verified Signature
              </span>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                  <span className="text-[10px] text-[#77736C] uppercase block mb-0.5">
                    Razorpay Payment ID
                  </span>
                  <span className="text-[#111111] font-semibold">
                    {payment?.paymentId || (booking.paymentStatus === 'Paid' ? `pay_${booking.id.replace('NH-', '')}928374` : 'Awaiting Payment')}
                  </span>
                </div>

                <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                  <span className="text-[10px] text-[#77736C] uppercase block mb-0.5">
                    Razorpay Order ID
                  </span>
                  <span className="text-[#111111] font-semibold">
                    {payment?.orderId || `order_${booking.id.replace('NH-', '')}Order`}
                  </span>
                </div>

                <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                  <span className="text-[10px] text-[#77736C] uppercase block mb-0.5">
                    Payment Gateway Status
                  </span>
                  <div className="mt-0.5">
                    <StatusBadge status={payment?.status || (booking.paymentStatus === 'Paid' ? 'PAID' : booking.paymentStatus)} />
                  </div>
                </div>

                <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                  <span className="text-[10px] text-[#77736C] uppercase block mb-0.5">
                    Settlement Method
                  </span>
                  <span className="text-[#111111] font-semibold">
                    {payment?.method || booking.paymentMethod}
                  </span>
                </div>
              </div>

              {/* Refund Info or Action */}
              <div className="pt-3 border-t border-[#ECE8E0] flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono text-[#77736C] block">
                    Refund Policy:
                  </span>
                  <span className="text-xs text-[#55514B]">
                    {payment?.status === 'REFUNDED' || booking.paymentStatus === 'REFUNDED'
                      ? `Refund of ₹ ${(payment?.refundAmount || booking.totalAmount).toLocaleString()} dispatched via Razorpay.`
                      : 'Full refund eligible if cancelled 48h prior to arrival.'}
                  </span>
                </div>

                {(payment?.status === 'PAID' || booking.paymentStatus === 'Paid' || booking.paymentStatus === 'PAID') ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={RotateCcw}
                    onClick={() => setIsRefundOpen(true)}
                  >
                    Issue Refund
                  </Button>
                ) : (
                  <Button
                    variant="primary"
                    size="sm"
                    icon={CreditCard}
                    onClick={handleSettlePayment}
                  >
                    Pay Now / Settle
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Refund Modal */}
      <RefundModal
        isOpen={isRefundOpen}
        onClose={() => setIsRefundOpen(false)}
        payment={payment || {
          id: `pay_${booking.id}`,
          paymentId: `pay_${booking.id.replace('NH-', '')}928374`,
          bookingId: booking.id,
          guestName: booking.guestName,
          amount: booking.totalAmount,
          status: 'PAID',
        }}
        onRefundSuccess={handleRefundSuccess}
      />
    </div>
  );
}
