import React, { useState } from 'react';
import {
  RotateCcw,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  IndianRupee,
  ShieldCheck,
} from 'lucide-react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

export default function RefundModal({ isOpen, onClose, payment, onRefundSuccess }) {
  const [amount, setAmount] = useState(payment ? payment.amount : 0);
  const [reason, setReason] = useState('Guest requested cancellation under 48h policy');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!payment) return null;

  const handleFullRefund = () => {
    setAmount(payment.amount);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amount <= 0 || amount > payment.amount) {
      setError(`Amount must be between ₹ 1 and ₹ ${payment.amount.toLocaleString()}`);
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      await onRefundSuccess({
        paymentId: payment.paymentId || payment.id,
        amount: Number(amount),
        reason,
      });
      setIsProcessing(false);
      onClose();
    } catch (err) {
      setIsProcessing(false);
      setError(err.message || 'Refund authorization declined.');
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Authorize Payment Refund"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-[#FAF8F5] p-4 border border-[#ECE8E0] rounded-xs space-y-2 text-xs">
          <div className="flex items-center justify-between text-[#77736C]">
            <span>Transaction Reference:</span>
            <span className="font-mono text-[#111111] font-semibold">{payment.paymentId}</span>
          </div>
          <div className="flex items-center justify-between text-[#77736C]">
            <span>Associated Booking:</span>
            <span className="font-mono text-[#A58A5C] font-semibold">{payment.bookingId}</span>
          </div>
          <div className="flex items-center justify-between text-[#77736C]">
            <span>Guest Name:</span>
            <span className="text-[#111111] font-medium">{payment.guestName}</span>
          </div>
          <div className="flex items-center justify-between text-[#77736C] pt-2 border-t border-[#ECE8E0]">
            <span>Original Captured Amount:</span>
            <span className="font-serif text-sm font-semibold text-[#111111]">
              ₹ {payment.amount.toLocaleString()}
            </span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xs flex items-center gap-2">
            <AlertTriangle size={15} className="shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-mono uppercase tracking-wider text-[#55514B]">
              Refund Amount (INR)
            </label>
            <button
              type="button"
              onClick={handleFullRefund}
              className="text-[11px] font-mono text-[#A58A5C] hover:underline"
            >
              Full Refund (₹ {payment.amount.toLocaleString()})
            </button>
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-[#77736C] font-mono">
              ₹
            </span>
            <input
              type="number"
              min="1"
              max={payment.amount}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full pl-8 pr-4 py-2.5 text-sm bg-white border border-[#D8D0C3] rounded-xs font-mono focus:outline-hidden focus:border-[#A58A5C]"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#55514B] mb-1.5">
            Hospitality Reason & Justification
          </label>
          <select
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-white border border-[#D8D0C3] rounded-xs focus:outline-hidden focus:border-[#A58A5C]"
          >
            <option value="Guest requested cancellation under 48h policy">
              Guest requested cancellation under 48h policy
            </option>
            <option value="Travel schedule disruption / Flight delay">
              Travel schedule disruption / Flight delay
            </option>
            <option value="Duplicate booking accidental charge">
              Duplicate booking accidental charge
            </option>
            <option value="Executive management courtesy / Sanctuary privilege">
              Executive management courtesy / Sanctuary privilege
            </option>
          </select>
        </div>

        <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs flex items-center gap-2 text-[11px] text-[#77736C]">
          <ShieldCheck size={16} className="text-[#A58A5C] shrink-0" />
          <span>
            Refund will be processed via Razorpay gateway directly back to the guest's original payment source (3-5 banking days).
          </span>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECE8E0]">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={onClose}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="sm"
            icon={isProcessing ? Loader2 : RotateCcw}
            disabled={isProcessing}
          >
            {isProcessing ? 'Processing Refund...' : 'Confirm Refund Dispatch'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
