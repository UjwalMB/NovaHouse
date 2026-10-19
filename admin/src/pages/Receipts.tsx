import React, { useState, useEffect, useMemo } from 'react';
import {
  FileCheck,
  Plus,
  Printer,
  Download,
  Eye,
  CheckCircle2,
  DollarSign,
  CreditCard,
  Building,
} from 'lucide-react';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import { useToast } from '../components/ui/Toast';
import { getReceipts, createReceipt } from '../services/financeService';
import { Receipt } from '../types';

export default function Receipts() {
  const { addToast } = useToast();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [methodFilter, setMethodFilter] = useState('all');

  // Drawers & Modals
  const [isNewReceiptOpen, setIsNewReceiptOpen] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Form
  const [form, setForm] = useState({
    guestName: '',
    guestEmail: '',
    amountPaid: 38000,
    paymentMethod: 'Online Payment (Razorpay)',
    notes: 'Official electronic payment acknowledgement for luxury sanctuary booking.',
    bookingId: '',
    invoiceId: '',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getReceipts();
      setReceipts(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCaptured = receipts.reduce((sum, r) => sum + r.amountPaid, 0);
  const onlineCount = receipts.filter((r) => r.paymentMethod.toLowerCase().includes('online') || r.paymentMethod.toLowerCase().includes('razorpay')).length;
  const posCount = receipts.filter((r) => r.paymentMethod.toLowerCase().includes('pos') || r.paymentMethod.toLowerCase().includes('card')).length;

  const filteredReceipts = useMemo(() => {
    return receipts.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        r.receiptNumber.toLowerCase().includes(q) ||
        r.guestName.toLowerCase().includes(q) ||
        r.transactionRef.toLowerCase().includes(q) ||
        r.paymentId.toLowerCase().includes(q);

      const matchMethod = methodFilter === 'all' || r.paymentMethod.toLowerCase().includes(methodFilter.toLowerCase());
      return matchSearch && matchMethod;
    });
  }, [receipts, searchQuery, methodFilter]);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestName.trim()) return;

    const created = await createReceipt(form);
    setReceipts([created, ...receipts]);
    addToast(`Payment Receipt #${created.receiptNumber} recorded.`);
    setIsNewReceiptOpen(false);
    setForm({
      guestName: '',
      guestEmail: '',
      amountPaid: 38000,
      paymentMethod: 'Online Payment (Razorpay)',
      notes: 'Official electronic payment acknowledgement.',
      bookingId: '',
      invoiceId: '',
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const columns: Column<Receipt>[] = [
    {
      header: 'Receipt #',
      key: 'receiptNumber',
      render: (r) => (
        <div>
          <span className="font-mono text-xs font-bold text-[#111111] block">{r.receiptNumber}</span>
          <span className="text-[10px] text-[#A58A5C] font-mono">Ref: {r.transactionRef}</span>
        </div>
      ),
    },
    {
      header: 'Guest Name',
      key: 'guestName',
      render: (r) => (
        <div>
          <span className="font-medium text-xs text-[#111111] block">{r.guestName}</span>
          {r.guestEmail && <span className="text-[10px] text-[#77736C] font-mono block">{r.guestEmail}</span>}
        </div>
      ),
    },
    {
      header: 'Amount Paid',
      key: 'amountPaid',
      render: (r) => (
        <span className="font-mono text-xs font-bold text-emerald-800">
          ₹ {r.amountPaid.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Payment Method',
      key: 'paymentMethod',
      render: (r) => (
        <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#ECE8E0] text-[10px] font-mono text-[#55514B] rounded-xs">
          {r.paymentMethod}
        </span>
      ),
    },
    {
      header: 'Paid Timestamp',
      key: 'paidAt',
      render: (r) => <span className="text-xs font-mono text-[#77736C]">{r.paidAt}</span>,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setSelectedReceipt(r);
              setIsPrintModalOpen(true);
            }}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs cursor-pointer"
            title="Print Receipt"
          >
            <Printer size={15} />
          </button>
          <button
            onClick={() => setSelectedReceipt(r)}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs cursor-pointer"
            title="Inspect Dossier"
          >
            <Eye size={15} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Settled Collections & Electronic Vouchers
          </span>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Receipts Ledger
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Official electronic receipt vouchers issued to guests upon verified payment capture.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setIsNewReceiptOpen(true)}
        >
          Generate Official Receipt
        </Button>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-4 border-l-4 border-emerald-600">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">Total Captured Volume</span>
          <span className="font-serif text-2xl font-light text-emerald-800">₹ {totalCaptured.toLocaleString()}</span>
          <span className="text-[10px] text-[#77736C] block mt-1">{receipts.length} vouchers issued</span>
        </div>

        <div className="admin-card p-4 border-l-4 border-[#111111]">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">Online Gateway Receipts</span>
          <span className="font-serif text-2xl font-light text-[#111111]">{onlineCount} Receipts</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Razorpay instant captures</span>
        </div>

        <div className="admin-card p-4 border-l-4 border-[#A58A5C]">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">POS / Card Terminal</span>
          <span className="font-serif text-2xl font-light text-[#A58A5C]">{posCount} Receipts</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Front desk swipe payments</span>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="admin-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search receipt #, guest, transaction..."
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
            className="form-select text-xs font-mono !py-1.5"
          >
            <option value="all">All Payment Methods</option>
            <option value="Online">Online / Razorpay</option>
            <option value="POS">POS Terminal / Card</option>
            <option value="Bank">Direct Wire</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        <DataTable
          columns={columns}
          data={filteredReceipts}
          loading={loading}
          onRowClick={(r) => setSelectedReceipt(r)}
        />
      </div>

      {/* Create Receipt Modal */}
      <Modal
        isOpen={isNewReceiptOpen}
        onClose={() => setIsNewReceiptOpen(false)}
        title="Issue Official Receipt"
        subtitle="Electronic Payment Acknowledgement"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="form-group !mb-0 col-span-2">
              <label className="form-label">Guest Full Name</label>
              <input
                type="text"
                required
                value={form.guestName}
                onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                placeholder="e.g. Vikramaditya Singhania"
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Email</label>
              <input
                type="email"
                value={form.guestEmail}
                onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Amount Paid (₹)</label>
              <input
                type="number"
                required
                value={form.amountPaid}
                onChange={(e) => setForm({ ...form, amountPaid: Number(e.target.value) })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Payment Mode</label>
              <select
                value={form.paymentMethod}
                onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                className="form-select text-xs font-mono"
              >
                <option value="Online Payment (Razorpay)">Online Payment (Razorpay)</option>
                <option value="POS Terminal Card (AMEX / Visa)">POS Terminal Card (AMEX / Visa)</option>
                <option value="Direct Bank NEFT / RTGS">Direct Bank NEFT / RTGS</option>
                <option value="UPI Instant Transfer">UPI Instant Transfer</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Linked Booking / Invoice #</label>
              <input
                type="text"
                value={form.bookingId}
                onChange={(e) => setForm({ ...form, bookingId: e.target.value })}
                placeholder="e.g. NH-4029"
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0 col-span-2">
              <label className="form-label">Acknowledgement Notes</label>
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="form-textarea text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE8E0]">
            <Button variant="secondary" size="sm" onClick={() => setIsNewReceiptOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Issue Receipt
            </Button>
          </div>
        </form>
      </Modal>

      {/* Printable Receipt Modal */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Electronic Payment Receipt"
        subtitle="NOVA HOUSE Verified Transaction"
      >
        {selectedReceipt && (
          <div className="space-y-6">
            <div id="printable-receipt" className="p-6 bg-white border border-[#E2DDD5] rounded-xs space-y-6 font-serif text-[#111111]">
              <div className="flex justify-between items-start border-b border-[#111111] pb-4">
                <div>
                  <h2 className="font-serif text-2xl tracking-widest font-light">NOVA HOUSE</h2>
                  <span className="font-mono text-[9px] tracking-widest uppercase block text-[#A58A5C]">
                    Hotel & Sanctuary · Bengaluru, India
                  </span>
                  <div className="font-mono text-[10px] text-[#55514B] mt-1 space-y-0.5">
                    <div>Lavelle Road, Richmond Circle, Bengaluru 560001</div>
                    <div>CIN: U55101KA2024PTC189021 · GSTIN: 29AAACN8820P1Z4</div>
                  </div>
                </div>

                <div className="text-right font-mono text-xs">
                  <span className="font-bold text-sm text-[#111111] block">PAYMENT RECEIPT</span>
                  <span className="text-emerald-700 font-semibold block">#{selectedReceipt.receiptNumber}</span>
                  <span className="text-[10px] text-[#77736C] block mt-1">Date: {selectedReceipt.paidAt}</span>
                </div>
              </div>

              <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2 font-mono text-xs">
                <div className="flex justify-between">
                  <span className="text-[#77736C]">Received With Thanks From:</span>
                  <span className="font-bold text-sm text-[#111111]">{selectedReceipt.guestName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#77736C]">Payment Method:</span>
                  <span className="text-[#111111]">{selectedReceipt.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#77736C]">Gateway Transaction Ref:</span>
                  <span className="text-[#111111] font-semibold">{selectedReceipt.transactionRef}</span>
                </div>
                {selectedReceipt.invoiceId && (
                  <div className="flex justify-between">
                    <span className="text-[#77736C]">Linked Tax Invoice:</span>
                    <span className="text-[#A58A5C]">{selectedReceipt.invoiceId}</span>
                  </div>
                )}
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xs flex justify-between items-center font-mono">
                <div>
                  <span className="text-[10px] uppercase text-emerald-800 block">Total Amount Captured</span>
                  <span className="text-2xl font-bold text-emerald-900">
                    ₹ {selectedReceipt.amountPaid.toLocaleString()}
                  </span>
                </div>
                <span className="px-2.5 py-1 bg-emerald-600 text-white text-xs font-bold rounded-xs uppercase tracking-wider">
                  Payment Verified
                </span>
              </div>

              <div className="border-t border-[#ECE8E0] pt-4 flex justify-between items-end text-[10px] font-mono text-[#77736C]">
                <div>
                  <div>{selectedReceipt.notes}</div>
                  <div>Computer generated electronic receipt. No physical signature required.</div>
                </div>
                <div className="text-right">
                  <div className="w-32 border-b border-[#111111] mb-1" />
                  <div>Accounts & Treasury · NOVA HOUSE</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="secondary" size="sm" onClick={() => setIsPrintModalOpen(false)}>
                Close
              </Button>
              <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
                Print Receipt
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Drawer */}
      <Drawer
        isOpen={Boolean(selectedReceipt) && !isPrintModalOpen}
        onClose={() => setSelectedReceipt(null)}
        title={selectedReceipt ? `Receipt #${selectedReceipt.receiptNumber}` : ''}
        subtitle={selectedReceipt ? `Guest: ${selectedReceipt.guestName}` : ''}
      >
        {selectedReceipt && (
          <div className="space-y-6">
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center">
                <span className="font-bold text-sm text-[#111111]">₹ {selectedReceipt.amountPaid.toLocaleString()}</span>
                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-xs">PAID</span>
              </div>
              <div className="text-[#77736C] space-y-1 pt-1">
                <div>Transaction Ref: <strong className="text-[#111111]">{selectedReceipt.transactionRef}</strong></div>
                <div>Payment ID: <strong className="text-[#111111]">{selectedReceipt.paymentId}</strong></div>
                <div>Method: <strong className="text-[#111111]">{selectedReceipt.paymentMethod}</strong></div>
                <div>Captured on: <strong className="text-[#111111]">{selectedReceipt.paidAt}</strong></div>
              </div>
            </div>

            <div className="pt-4 border-t border-[#ECE8E0] flex justify-end">
              <Button
                variant="primary"
                size="sm"
                icon={Printer}
                onClick={() => setIsPrintModalOpen(true)}
              >
                Print Voucher
              </Button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
