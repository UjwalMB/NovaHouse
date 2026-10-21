import React, { useState, useEffect, useMemo } from 'react';
import {
  Receipt,
  Plus,
  Printer,
  Download,
  Eye,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  DollarSign,
  Building,
} from 'lucide-react';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import { useToast } from '../components/ui/Toast';
import {
  getInvoices,
  createInvoice,
  updateInvoiceStatus,
} from '../services/financeService';
import { Invoice, InvoiceLineItem } from '../types';

export default function Invoices() {
  const { addToast } = useToast();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modals & Drawers
  const [isNewInvoiceOpen, setIsNewInvoiceOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    companyName: '',
    gstin: '',
    roomNumber: '101',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    items: [
      { id: '1', description: 'Luxury Suite Sanctuary Accommodation (3 Nights)', category: 'Room Tariff' as InvoiceLineItem['category'], quantity: 1, unitPrice: 55500, amount: 55500 },
      { id: '2', description: 'EMBER Hearth Tasting Dinner & Cellar Pairing', category: 'Dining' as InvoiceLineItem['category'], quantity: 2, unitPrice: 3200, amount: 6400 },
    ],
    discount: 0,
    status: 'Pending' as Invoice['status'],
    paymentMethod: 'Razorpay UPI / POS Card',
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getInvoices();
      setInvoices(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute Metrics
  const totalInvoiced = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
  const paidInvoiced = invoices.filter((i) => i.status === 'Paid').reduce((sum, i) => sum + i.grandTotal, 0);
  const pendingInvoiced = invoices.filter((i) => i.status === 'Pending').reduce((sum, i) => sum + i.grandTotal, 0);

  // Filtered invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        inv.invoiceNumber.toLowerCase().includes(q) ||
        inv.guestName.toLowerCase().includes(q) ||
        (inv.companyName && inv.companyName.toLowerCase().includes(q)) ||
        (inv.roomNumber && inv.roomNumber.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'all' || inv.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [invoices, searchQuery, statusFilter]);

  // Form helpers
  const handleAddItem = () => {
    setForm((prev) => ({
      ...prev,
      items: [
        ...prev.items,
        {
          id: String(Date.now()),
          description: 'Bespoke Experience / Amenity',
          category: 'Other',
          quantity: 1,
          unitPrice: 2500,
          amount: 2500,
        },
      ],
    }));
  };

  const handleRemoveItem = (id: string) => {
    setForm((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const handleItemChange = (id: string, field: 'description' | 'quantity' | 'unitPrice', val: any) => {
    setForm((prev) => {
      const items = prev.items.map((item) => {
        if (item.id === id) {
          const updated = { ...item, [field]: val };
          if (field === 'quantity' || field === 'unitPrice') {
            updated.amount = Number(updated.quantity) * Number(updated.unitPrice);
          }
          return updated;
        }
        return item;
      });
      return { ...prev, items };
    });
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.guestName.trim()) return;

    const newInv = await createInvoice(form);
    setInvoices([newInv, ...invoices]);
    addToast(`Tax Invoice ${newInv.invoiceNumber} created successfully.`);
    setIsNewInvoiceOpen(false);
  };

  const handleUpdateStatus = async (id: string, status: Invoice['status']) => {
    const updated = await updateInvoiceStatus(id, status);
    if (updated) {
      setInvoices(invoices.map((i) => (i.id === id ? updated : i)));
      if (selectedInvoice?.id === id) setSelectedInvoice(updated);
      addToast(`Invoice #${updated.invoiceNumber} updated to ${status}.`);
      if (status === 'Paid') {
        addToast('Payment receipt automatically generated in Receipts ledger.');
      }
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const columns: Column<Invoice>[] = [
    {
      header: 'Invoice #',
      key: 'invoiceNumber',
      render: (inv) => (
        <div>
          <span className="font-mono text-xs font-bold text-[#111111] tracking-wider block" style={{ fontVariantNumeric: 'tabular-nums' }}>
            {inv.invoiceNumber}
          </span>
          <span className="text-[10px] text-[#77736C] font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
            Issued: {inv.issueDate}
          </span>
        </div>
      ),
    },
    {
      header: 'Guest / Entity',
      key: 'guestName',
      render: (inv) => (
        <div>
          <span className="font-sans font-medium text-xs text-[#111111] block">{inv.guestName}</span>
          {inv.companyName && (
            <span className="text-[11px] font-sans text-[#A58A5C] block">
              {inv.companyName} {inv.gstin && <span className="font-mono text-[10px] text-[#77736C]">· GSTIN: {inv.gstin}</span>}
            </span>
          )}
          {inv.roomNumber && (
            <span className="text-[10px] text-[#77736C] font-sans block">
              Room Key: <strong className="font-mono text-[#111111]">#{inv.roomNumber}</strong>
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Due Date',
      key: 'dueDate',
      render: (inv) => <span className="font-mono text-xs text-[#77736C]" style={{ fontVariantNumeric: 'tabular-nums' }}>{inv.dueDate}</span>,
    },
    {
      header: 'Taxes (GST 18%)',
      key: 'totalTaxes',
      render: (inv) => (
        <span className="font-mono text-xs text-[#55514B]" style={{ fontVariantNumeric: 'tabular-nums' }}>
          ₹ {inv.totalTaxes.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Grand Total',
      key: 'grandTotal',
      render: (inv) => (
        <span className="font-mono text-xs font-bold text-[#111111]" style={{ fontVariantNumeric: 'tabular-nums' }}>
          ₹ {inv.grandTotal.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (inv) => <StatusBadge status={inv.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (inv) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {inv.status === 'Pending' && (
            <button
              onClick={() => handleUpdateStatus(inv.id, 'Paid')}
              className="px-2 py-1 text-[10px] font-sans font-semibold uppercase tracking-wider text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xs transition-colors cursor-pointer"
            >
              Mark Paid
            </button>
          )}

          <button
            onClick={() => {
              setSelectedInvoice(inv);
              setIsPrintModalOpen(true);
            }}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs"
            title="Print / View Invoice"
          >
            <Printer size={15} />
          </button>

          <button
            onClick={() => setSelectedInvoice(inv)}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs"
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
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-[#A58A5C] block mb-1 font-semibold">
            Financial Ledger & Tax Compliant Billing
          </span>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-wide">
            Invoices Management
          </h1>
          <p className="font-sans text-xs text-[#77736C] mt-1">
            Generate statutory GST invoices, break down lodging tariffs and F&B folios, and disburse official billing.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setIsNewInvoiceOpen(true)}
        >
          Create Tax Invoice
        </Button>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-4 border-l-4 border-[#111111]">
          <span className="font-sans text-[11px] uppercase tracking-wider font-semibold text-[#77736C] block">Total Invoiced Volume</span>
          <span className="font-mono text-2xl font-semibold text-[#111111] block mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
            ₹ {totalInvoiced.toLocaleString()}
          </span>
          <span className="font-sans text-[11px] text-[#77736C] block mt-1">
            <strong className="font-mono text-[#111111]">{invoices.length}</strong> invoices generated
          </span>
        </div>

        <div className="admin-card p-4 border-l-4 border-emerald-600">
          <span className="font-sans text-[11px] uppercase tracking-wider font-semibold text-[#77736C] block">Collected / Settled</span>
          <span className="font-mono text-2xl font-semibold text-emerald-800 block mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
            ₹ {paidInvoiced.toLocaleString()}
          </span>
          <span className="font-sans text-[11px] text-[#77736C] block mt-1">Receipted and reconciled</span>
        </div>

        <div className="admin-card p-4 border-l-4 border-amber-500">
          <span className="font-sans text-[11px] uppercase tracking-wider font-semibold text-[#77736C] block">Pending Collections</span>
          <span className="font-mono text-2xl font-semibold text-amber-800 block mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
            ₹ {pendingInvoiced.toLocaleString()}
          </span>
          <span className="font-sans text-[11px] text-[#77736C] block mt-1">Awaiting checkout settlement</span>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="admin-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search invoice #, guest, corporate name..."
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select text-xs font-mono !py-1.5"
          >
            <option value="all">All Invoices</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Overdue">Overdue</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        <DataTable
          columns={columns}
          data={filteredInvoices}
          loading={loading}
          onRowClick={(inv) => setSelectedInvoice(inv)}
        />
      </div>

      {/* Create Invoice Modal */}
      <Modal
        isOpen={isNewInvoiceOpen}
        onClose={() => setIsNewInvoiceOpen(false)}
        title="Generate Tax Invoice"
        subtitle="NOVA HOUSE · Statutory GST Billing"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 font-sans">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="form-group !mb-0">
              <label className="form-label font-sans">Guest Full Name</label>
              <input
                type="text"
                required
                value={form.guestName}
                onChange={(e) => setForm({ ...form, guestName: e.target.value })}
                placeholder="Ratan Tata"
                className="form-input text-xs font-sans"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label font-sans">Email</label>
              <input
                type="email"
                value={form.guestEmail}
                onChange={(e) => setForm({ ...form, guestEmail: e.target.value })}
                placeholder="patron@company.com"
                className="form-input text-xs font-sans"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label font-sans">Company Name (Optional)</label>
              <input
                type="text"
                value={form.companyName}
                onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                placeholder="Tata Sons Pvt Ltd"
                className="form-input text-xs font-sans"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label font-sans">Corporate GSTIN (Optional)</label>
              <input
                type="text"
                value={form.gstin}
                onChange={(e) => setForm({ ...form, gstin: e.target.value })}
                placeholder="29AAAAA0000A1Z5"
                className="form-input text-xs font-mono uppercase tracking-wider"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label font-sans">Room Key #</label>
              <input
                type="text"
                value={form.roomNumber}
                onChange={(e) => setForm({ ...form, roomNumber: e.target.value })}
                placeholder="101"
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label font-sans">Due Date</label>
              <input
                type="date"
                value={form.dueDate}
                onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>
          </div>

          {/* Line items table */}
          <div className="space-y-2 pt-2 font-sans">
            <div className="flex items-center justify-between">
              <span className="font-sans text-xs uppercase tracking-wider text-[#A58A5C] font-semibold">
                Billable Line Items
              </span>
              <button
                type="button"
                onClick={handleAddItem}
                className="text-[11px] font-sans font-semibold text-[#A58A5C] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <Plus size={12} />
                <span>Add Item</span>
              </button>
            </div>

            <div className="space-y-2 max-h-44 overflow-y-auto">
              {form.items.map((item) => (
                <div key={item.id} className="grid grid-cols-12 gap-2 p-2 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs text-xs font-sans">
                  <input
                    type="text"
                    value={item.description}
                    onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                    placeholder="Description"
                    className="col-span-6 form-input text-xs font-sans"
                  />
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleItemChange(item.id, 'quantity', Number(e.target.value))}
                    placeholder="Qty"
                    className="col-span-2 form-input text-xs font-mono text-center"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  />
                  <input
                    type="number"
                    value={item.unitPrice}
                    onChange={(e) => handleItemChange(item.id, 'unitPrice', Number(e.target.value))}
                    placeholder="Price"
                    className="col-span-3 form-input text-xs font-mono text-right"
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(item.id)}
                    className="col-span-1 text-[#77736C] hover:text-[#962828] flex items-center justify-center cursor-pointer font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="text-[11px] font-sans text-[#77736C] text-right pt-2 border-t border-[#ECE8E0]">
              * Automated 18% GST (9% CGST + 9% SGST) applied to final grand total.
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE8E0] font-sans">
            <Button variant="secondary" size="sm" onClick={() => setIsNewInvoiceOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Disburse Invoice
            </Button>
          </div>
        </form>
      </Modal>

      {/* Invoice Details Drawer */}
      <Drawer
        isOpen={Boolean(selectedInvoice) && !isPrintModalOpen}
        onClose={() => setSelectedInvoice(null)}
        title={selectedInvoice ? `Invoice Dossier · ${selectedInvoice.invoiceNumber}` : ''}
        subtitle={selectedInvoice ? `${selectedInvoice.guestName}` : ''}
      >
        {selectedInvoice && (
          <div className="space-y-6 font-sans">
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2 font-sans">
              <div className="flex justify-between items-center">
                <span className="font-mono text-sm font-bold text-[#111111] tracking-wider" style={{ fontVariantNumeric: 'tabular-nums' }}>
                  {selectedInvoice.invoiceNumber}
                </span>
                <StatusBadge status={selectedInvoice.status} />
              </div>
              <div className="text-xs text-[#77736C] space-y-1 font-sans">
                <div>Guest: <strong className="text-[#111111] font-medium">{selectedInvoice.guestName}</strong></div>
                {selectedInvoice.companyName && (
                  <div>Company: <strong className="text-[#111111] font-medium">{selectedInvoice.companyName}</strong></div>
                )}
                {selectedInvoice.gstin && (
                  <div>GSTIN: <strong className="text-[#111111] font-mono tracking-wider">{selectedInvoice.gstin}</strong></div>
                )}
                <div>Room: <strong className="text-[#111111] font-mono">{selectedInvoice.roomNumber || 'N/A'}</strong></div>
                <div>Issue Date: <strong className="text-[#111111] font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedInvoice.issueDate}</strong></div>
                <div>Due Date: <strong className="text-[#111111] font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedInvoice.dueDate}</strong></div>
              </div>
            </div>

            {/* Line items list */}
            <div className="space-y-2">
              <span className="font-sans text-xs uppercase tracking-wider text-[#A58A5C] font-semibold block">
                Itemized Tariff & Services
              </span>
              <div className="space-y-1.5 border border-[#ECE8E0] rounded-xs divide-y divide-[#ECE8E0] text-xs font-sans">
                {selectedInvoice.items.map((item, idx) => (
                  <div key={idx} className="p-3 flex justify-between items-center bg-white">
                    <div>
                      <span className="text-[#111111] block font-medium font-sans">{item.description}</span>
                      <span className="text-[11px] text-[#77736C] font-sans">
                        <span className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</span> × <span className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>₹ {item.unitPrice.toLocaleString()}</span> ({item.category})
                      </span>
                    </div>
                    <span className="font-semibold text-[#111111] font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>
                      ₹ {item.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Calculation Breakdown */}
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-1.5 text-xs font-sans">
              <div className="flex justify-between text-[#77736C] font-sans">
                <span>Subtotal:</span>
                <span className="font-mono text-[#111111]" style={{ fontVariantNumeric: 'tabular-nums' }}>₹ {selectedInvoice.subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#77736C] font-sans">
                <span>CGST (9%):</span>
                <span className="font-mono text-[#111111]" style={{ fontVariantNumeric: 'tabular-nums' }}>₹ {selectedInvoice.cgst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[#77736C] font-sans">
                <span>SGST (9%):</span>
                <span className="font-mono text-[#111111]" style={{ fontVariantNumeric: 'tabular-nums' }}>₹ {selectedInvoice.sgst.toLocaleString()}</span>
              </div>
              {selectedInvoice.discount > 0 && (
                <div className="flex justify-between text-emerald-700 font-sans">
                  <span>Privilege Discount:</span>
                  <span className="font-mono" style={{ fontVariantNumeric: 'tabular-nums' }}>- ₹ {selectedInvoice.discount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm font-bold text-[#111111] pt-2 border-t border-dashed border-[#CDC7BC] font-sans">
                <span className="uppercase tracking-wider text-xs">Grand Total:</span>
                <span className="font-mono text-base font-bold" style={{ fontVariantNumeric: 'tabular-nums' }}>₹ {selectedInvoice.grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#ECE8E0] flex flex-wrap gap-2 justify-between font-sans">
              <Button
                variant="secondary"
                size="sm"
                icon={Printer}
                onClick={() => setIsPrintModalOpen(true)}
              >
                Printable Tax View
              </Button>

              {selectedInvoice.status !== 'Paid' ? (
                <Button
                  variant="primary"
                  size="sm"
                  icon={CheckCircle2}
                  onClick={() => handleUpdateStatus(selectedInvoice.id, 'Paid')}
                >
                  Mark Paid & Generate Receipt
                </Button>
              ) : (
                <span className="text-xs font-sans text-emerald-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>Settled & Receipt Issued</span>
                </span>
              )}
            </div>
          </div>
        )}
      </Drawer>

      {/* Luxury Printable Invoice Modal */}
      <Modal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        title="Official Tax Invoice Document"
        subtitle="NOVA HOUSE Luxury Hospitality Folio"
      >
        {selectedInvoice && (
          <div className="space-y-6">
            <div id="printable-invoice" className="p-6 bg-white border border-[#E2DDD5] rounded-xs space-y-6 text-[#111111]">
              {/* Hotel Letterhead */}
              <div className="flex justify-between items-start border-b border-[#111111] pb-4">
                <div>
                  <h2 className="font-serif text-3xl tracking-widest font-light text-[#111111]">NOVA HOUSE</h2>
                  <span className="font-mono text-[9px] tracking-[0.25em] uppercase block text-[#A58A5C] font-semibold mt-0.5">
                    Hotel & Sanctuary · Bengaluru, India
                  </span>
                  <div className="font-sans text-[11px] text-[#55514B] mt-2 space-y-0.5 leading-relaxed">
                    <div>Lavelle Road, Richmond Circle, Bengaluru 560001</div>
                    <div className="font-mono text-[10px] text-[#77736C]">GSTIN: 29AAACN8820P1Z4 · CIN: U55101KA2024PTC189021</div>
                    <div>reservations@novahouse.com · +91 80 4965 8800</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-serif text-base tracking-widest text-[#111111] font-semibold block">TAX INVOICE</span>
                  <span className="font-mono text-xs font-bold text-[#A58A5C] tracking-wider block mt-0.5" style={{ fontVariantNumeric: 'tabular-nums' }}>
                    #{selectedInvoice.invoiceNumber}
                  </span>
                  <div className="text-[11px] font-sans text-[#77736C] mt-2 space-y-0.5">
                    <div>Issue Date: <span className="font-mono text-[#111111] font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedInvoice.issueDate}</span></div>
                    <div>Due Date: <span className="font-mono text-[#111111] font-medium" style={{ fontVariantNumeric: 'tabular-nums' }}>{selectedInvoice.dueDate}</span></div>
                  </div>
                </div>
              </div>

              {/* Billed To */}
              <div className="grid grid-cols-2 gap-4 text-xs font-sans text-[#55514B]">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-[#77736C] font-semibold block mb-0.5">
                    Billed To (Guest / Client):
                  </span>
                  <strong className="font-serif text-lg font-normal text-[#111111] block">{selectedInvoice.guestName}</strong>
                  {selectedInvoice.companyName && <div className="font-sans text-xs font-medium text-[#111111]">{selectedInvoice.companyName}</div>}
                  {selectedInvoice.gstin && <div className="font-mono text-xs text-[#55514B] tracking-wider">GSTIN: {selectedInvoice.gstin}</div>}
                  {selectedInvoice.guestEmail && <div className="font-sans text-xs text-[#77736C]">{selectedInvoice.guestEmail}</div>}
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase tracking-wider text-[#77736C] font-semibold block mb-0.5">
                    Stay Specifics:
                  </span>
                  <div className="font-sans text-xs text-[#55514B]">Room Allocated: <strong className="font-mono text-[#111111]">Suite #{selectedInvoice.roomNumber || '101'}</strong></div>
                  <div className="font-sans text-xs text-[#55514B]">Status: <strong className="uppercase font-sans font-bold text-[#111111]">{selectedInvoice.status}</strong></div>
                  <div className="font-sans text-xs text-[#55514B]">Payment Mode: <span className="font-sans text-[#111111]">{selectedInvoice.paymentMethod || 'Razorpay Gateway'}</span></div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#111111] text-left text-[10px] font-sans uppercase tracking-wider font-semibold text-[#77736C]">
                    <th className="py-2.5 font-semibold">Description</th>
                    <th className="py-2.5 font-semibold">Category</th>
                    <th className="py-2.5 text-center font-semibold">Qty</th>
                    <th className="py-2.5 text-right font-semibold">Unit Rate (₹)</th>
                    <th className="py-2.5 text-right font-semibold">Amount (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#ECE8E0]">
                  {selectedInvoice.items.map((item, idx) => (
                    <tr key={idx} className="py-2">
                      <td className="py-2.5 font-sans font-medium text-[#111111]">{item.description}</td>
                      <td className="py-2.5 font-sans text-[#77736C] text-[11px]">{item.category}</td>
                      <td className="py-2.5 text-center font-mono text-xs text-[#111111]" style={{ fontVariantNumeric: 'tabular-nums' }}>{item.quantity}</td>
                      <td className="py-2.5 text-right font-mono text-xs text-[#111111]" style={{ fontVariantNumeric: 'tabular-nums' }}>₹ {item.unitPrice.toLocaleString()}</td>
                      <td className="py-2.5 text-right font-mono text-xs font-semibold text-[#111111]" style={{ fontVariantNumeric: 'tabular-nums' }}>₹ {item.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Tax & Total Summary */}
              <div className="border-t border-[#111111] pt-3 flex justify-end font-sans text-xs">
                <div className="w-64 space-y-1.5">
                  <div className="flex justify-between text-[#77736C] font-sans">
                    <span>Subtotal:</span>
                    <span className="font-mono text-[#111111]" style={{ fontVariantNumeric: 'tabular-nums' }}>₹ {selectedInvoice.subtotal.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#77736C] font-sans">
                    <span>CGST (9.0%):</span>
                    <span className="font-mono text-[#111111]" style={{ fontVariantNumeric: 'tabular-nums' }}>₹ {selectedInvoice.cgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[#77736C] font-sans">
                    <span>SGST (9.0%):</span>
                    <span className="font-mono text-[#111111]" style={{ fontVariantNumeric: 'tabular-nums' }}>₹ {selectedInvoice.sgst.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base font-bold text-[#111111] pt-2 border-t border-[#111111]">
                    <span className="font-sans uppercase tracking-wide text-xs">Grand Total:</span>
                    <span className="font-mono font-bold text-base" style={{ fontVariantNumeric: 'tabular-nums' }}>₹ {selectedInvoice.grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Signoff */}
              <div className="border-t border-[#ECE8E0] pt-4 flex justify-between items-end">
                <div className="space-y-1">
                  <div className="font-serif italic text-xs text-[#4A453E]">Thank you for staying at NOVA HOUSE Bengaluru.</div>
                  <div className="font-sans text-[10px] text-[#77736C]">This is an official computer-generated tax invoice verified under GST regulations.</div>
                </div>
                <div className="text-right font-sans">
                  <div className="w-36 border-b border-[#111111] mb-1 ml-auto" />
                  <div className="text-[10px] font-sans uppercase tracking-wider text-[#77736C] font-semibold">Authorized Signatory · Front Desk</div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 font-sans">
              <Button variant="secondary" size="sm" onClick={() => setIsPrintModalOpen(false)}>
                Close
              </Button>
              <Button variant="primary" size="sm" icon={Printer} onClick={handlePrint}>
                Print Invoice
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
