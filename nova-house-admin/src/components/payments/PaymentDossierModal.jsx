import React from 'react';
import {
  CreditCard,
  Calendar,
  User,
  ShieldCheck,
  CheckCircle2,
  Clock,
  RotateCcw,
  AlertCircle,
  ExternalLink,
  Copy,
} from 'lucide-react';
import Modal from '../ui/Modal';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { settlePayment } from '../../services/paymentService';

export default function PaymentDossierModal({ isOpen, onClose, payment, onOpenRefund, onSettleSuccess }) {
  const { addToast } = useToast();

  if (!payment) return null;

  const handleCopy = (text, label) => {
    navigator.clipboard.writeText(text);
    addToast(`${label} copied to clipboard`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payment Dossier · ${payment.paymentId}`}
      size="lg"
    >
      <div className="space-y-6">
        {/* Top Status & Amount Header */}
        <div className="bg-[#FAF8F5] p-5 border border-[#ECE8E0] rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block mb-1">
              Gateway Settlement
            </span>
            <div className="font-serif text-3xl font-light text-[#111111]">
              ₹ {payment.amount.toLocaleString()} <span className="text-xs text-[#77736C] font-mono">INR</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={payment.status} />
              <span className="text-xs font-mono text-[#77736C]">via {payment.method}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {payment.status === 'PENDING' && (
              <Button
                variant="primary"
                size="sm"
                icon={CreditCard}
                onClick={async () => {
                  try {
                    await settlePayment({
                      bookingId: payment.bookingId,
                      paymentId: payment.paymentId,
                    });
                    addToast(`Payment #${payment.paymentId} marked as PAID.`);
                    onClose();
                    if (onSettleSuccess) onSettleSuccess(payment);
                  } catch (err) {
                    addToast(err.message || 'Failed to settle payment.', 'error');
                  }
                }}
              >
                Pay Now / Settle
              </Button>
            )}

            {payment.status === 'PAID' && (
              <Button
                variant="secondary"
                size="sm"
                icon={RotateCcw}
                onClick={() => {
                  onClose();
                  onOpenRefund(payment);
                }}
              >
                Issue Refund
              </Button>
            )}
          </div>
        </div>

        {/* Technical Razorpay Metadata */}
        <div className="space-y-3">
          <span className="font-mono text-xs uppercase tracking-widest text-[#77736C] block">
            Cryptographic Transaction Parameters
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
            <div className="p-3 bg-white border border-[#ECE8E0] rounded-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#77736C] uppercase block">Razorpay Payment ID</span>
                <span className="text-[#111111] font-semibold">{payment.paymentId}</span>
              </div>
              <button
                type="button"
                onClick={() => handleCopy(payment.paymentId, 'Payment ID')}
                className="text-[#A58A5C] hover:text-[#111111] p-1"
                title="Copy"
              >
                <Copy size={13} />
              </button>
            </div>

            <div className="p-3 bg-white border border-[#ECE8E0] rounded-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#77736C] uppercase block">Razorpay Order ID</span>
                <span className="text-[#111111] font-semibold">{payment.orderId || 'N/A'}</span>
              </div>
              {payment.orderId && (
                <button
                  type="button"
                  onClick={() => handleCopy(payment.orderId, 'Order ID')}
                  className="text-[#A58A5C] hover:text-[#111111] p-1"
                  title="Copy"
                >
                  <Copy size={13} />
                </button>
              )}
            </div>

            <div className="p-3 bg-white border border-[#ECE8E0] rounded-xs">
              <span className="text-[10px] text-[#77736C] uppercase block">Linked Booking Reference</span>
              <span className="text-[#A58A5C] font-semibold">{payment.bookingId}</span>
            </div>

            <div className="p-3 bg-white border border-[#ECE8E0] rounded-xs">
              <span className="text-[10px] text-[#77736C] uppercase block">Captured Timestamp</span>
              <span className="text-[#111111]">{payment.date} ({payment.createdAt ? payment.createdAt.split('T')[1]?.slice(0, 5) : '10:30'})</span>
            </div>
          </div>
        </div>

        {/* Guest & Reservation Context */}
        <div className="space-y-3">
          <span className="font-mono text-xs uppercase tracking-widest text-[#77736C] block">
            Guest Reservation Information
          </span>
          <div className="p-4 bg-white border border-[#ECE8E0] rounded-xs space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] text-[#77736C] uppercase block">Guest Name</span>
                <span className="font-medium text-[#111111]">{payment.guestName}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#77736C] uppercase block">Room Category</span>
                <span className="font-serif text-sm font-light text-[#111111]">{payment.roomType}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#77736C] uppercase block">Contact Email</span>
                <span className="font-mono text-[#55514B]">{payment.guestEmail}</span>
              </div>
              <div>
                <span className="text-[10px] text-[#77736C] uppercase block">Stay Dates</span>
                <span className="font-mono text-[#55514B]">{payment.checkIn} → {payment.checkOut}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Guest Confirmation Status */}
        <div className="space-y-2">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#77736C] block">
            Automated Guest Notifications
          </span>
          <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs font-mono">
            <div className="flex flex-wrap items-center gap-4">
              <span className="flex items-center gap-1.5 text-[#111111]">
                <span className={`w-1.5 h-1.5 rounded-full ${payment.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>Email: <strong className={payment.status === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}>{payment.status === 'PAID' ? 'SENT' : 'PENDING'}</strong></span>
              </span>
              <span className="flex items-center gap-1.5 text-[#111111]">
                <span className={`w-1.5 h-1.5 rounded-full ${payment.status === 'PAID' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                <span>SMS: <strong className={payment.status === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}>{payment.status === 'PAID' ? 'SENT' : 'PENDING'}</strong></span>
              </span>
            </div>
            <span className="text-[10px] text-[#A58A5C]">
              {payment.status === 'PAID' ? 'Triggered upon signature verification' : 'Dispatches upon payment capture'}
            </span>
          </div>
        </div>

        {/* Refund Details If Applied */}
        {payment.status === 'REFUNDED' && (
          <div className="p-4 bg-[#F8F5EE] border border-[#E2DDD5] rounded-xs space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#A58A5C] font-mono font-medium">
              <RotateCcw size={14} />
              <span>Refund Settlement Executed</span>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-2 font-mono text-[11px]">
              <div>
                <span className="text-[#77736C] block">Refund ID:</span>
                <span className="text-[#111111] font-semibold">{payment.refundId || 'rfnd_direct_pms'}</span>
              </div>
              <div>
                <span className="text-[#77736C] block">Refunded Amount:</span>
                <span className="text-[#111111] font-semibold">₹ {(payment.refundAmount || payment.amount).toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-[#ECE8E0]">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close Dossier
          </Button>
        </div>
      </div>
    </Modal>
  );
}
