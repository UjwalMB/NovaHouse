import React, { useState } from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';
import { PaymentDisplayRecord } from '../../services/paymentService';

interface RefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  payment: PaymentDisplayRecord | null;
  onRefundSuccess: (params: { paymentId: string; amount: number; reason: string }) => Promise<void>;
}

export default function RefundModal({ isOpen, onClose, payment, onRefundSuccess }: RefundModalProps) {
  const [amount, setAmount] = useState<number>(payment ? payment.amount : 0);
  const [reason, setReason] = useState('Guest requested cancellation under 48h policy');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');

  if (!payment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
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
    } catch (err: any) {
      setIsProcessing(false);
      setError(err.message || 'Refund authorization declined.');
    }
  };

  const paymentIdDisplay = payment.paymentId || payment.id;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Authorize Payment Refund"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="bg-[#FAF8F5] p-4 border border-[#ECE8E0] rounded-xs space-y-2 text-xs">
          <div className="flex items-center justify-between text-[#77736C]">
            <span>Transaction Reference:</span>
            <span className="font-mono text-[#111111] font-semibold">{paymentIdDisplay}</span>
          </div>
          <div className="flex items-center justify-between text-[#77736C]">
            <span>Max Refundable:</span>
            <span className="font-mono text-[#111111] font-semibold">₹ {payment.amount.toLocaleString()}</span>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-[#FFF5F5] border border-[#F7C6C6] rounded-xs text-xs text-[#962828] font-mono">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#77736C] mb-1">
            Refund Amount (INR)
          </label>
          <input
            type="number"
            min="1"
            max={payment.amount}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="form-input text-xs"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-mono uppercase tracking-wider text-[#77736C] mb-1">
            Audit Reason
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="form-input text-xs h-20"
            required
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <Button variant="secondary" size="sm" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button variant="danger" size="sm" type="submit" disabled={isProcessing}>
            {isProcessing ? 'Authorizing...' : 'Execute Refund'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
