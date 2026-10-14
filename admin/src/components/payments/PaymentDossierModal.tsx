import React from 'react';
import {
  CreditCard,
  RotateCcw,
  Copy,
} from 'lucide-react';
import Modal from '../ui/Modal';
import StatusBadge from '../ui/StatusBadge';
import Button from '../ui/Button';
import { useToast } from '../ui/Toast';
import { settlePayment, PaymentDisplayRecord } from '../../services/paymentService';

interface PaymentDossierModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentDisplayRecord | null;
  onOpenRefund: (payment: PaymentDisplayRecord) => void;
  onSettleSuccess?: (payment: PaymentDisplayRecord) => void;
}

export default function PaymentDossierModal({
  isOpen,
  onClose,
  payment,
  onOpenRefund,
  onSettleSuccess,
}: PaymentDossierModalProps) {
  const { addToast } = useToast();

  if (!payment) return null;

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(`${label} copied to clipboard`);
  };

  const paymentIdDisplay = payment.paymentId || payment.id || 'N/A';
  const orderIdDisplay = payment.orderId || payment.razorpayOrderId || payment.razorpay_order_id || 'N/A';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Payment Dossier · ${paymentIdDisplay}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Top Status & Amount Header */}
        <div className="bg-[#FAF8F5] p-5 border border-[#ECE8E0] rounded-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block mb-1">
              Gateway Settlement
            </span>
            <div className="font-serif text-3xl font-light text-[#111111]">
              ₹ {payment.amount?.toLocaleString()} <span className="text-xs text-[#77736C] font-mono">INR</span>
            </div>
            <div className="flex items-center gap-2 mt-2">
              <StatusBadge status={payment.status} />
              <span className="text-xs font-mono text-[#77736C]">via {payment.method || 'Card'}</span>
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
                      bookingId: payment.bookingId || payment.booking_id || '',
                      paymentId: payment.paymentId || payment.id,
                    });
                    addToast(`Payment #${paymentIdDisplay} marked as PAID.`);
                    onClose();
                    if (onSettleSuccess) onSettleSuccess(payment);
                  } catch (err: any) {
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
                <span className="text-[10px] text-[#77736C] block">PAYMENT ID</span>
                <span className="text-[#111111] font-semibold">{paymentIdDisplay}</span>
              </div>
              <button
                onClick={() => handleCopy(paymentIdDisplay, 'Payment ID')}
                className="text-[#77736C] hover:text-[#111111] p-1"
                aria-label="Copy Payment ID"
              >
                <Copy size={13} />
              </button>
            </div>

            <div className="p-3 bg-white border border-[#ECE8E0] rounded-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-[#77736C] block">ORDER ID</span>
                <span className="text-[#111111] font-semibold">{orderIdDisplay}</span>
              </div>
              <button
                onClick={() => handleCopy(orderIdDisplay, 'Order ID')}
                className="text-[#77736C] hover:text-[#111111] p-1"
                aria-label="Copy Order ID"
              >
                <Copy size={13} />
              </button>
            </div>
          </div>
        </div>

        {/* Guest & Reservation Context */}
        <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2 text-xs">
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
            Associated Reservation
          </span>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="text-[#77736C]">Booking Number: </span>
              <strong className="font-mono text-[#111111]">{payment.bookingId || payment.booking_id || 'N/A'}</strong>
            </div>
            <div>
              <span className="text-[#77736C]">Patron Name: </span>
              <strong className="text-[#111111]">{payment.guestName || payment.email || 'N/A'}</strong>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
