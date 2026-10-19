import React, { useState, useEffect, useMemo } from 'react';
import {
  Landmark,
  Download,
  CheckCircle2,
  Clock,
  RefreshCw,
  Eye,
  ExternalLink,
  ShieldCheck,
  Check,
} from 'lucide-react';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';
import { useToast } from '../components/ui/Toast';
import { getSettlements, reconcileSettlement } from '../services/financeService';
import { Settlement } from '../types';

export default function Settlements() {
  const { addToast } = useToast();
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Modal
  const [selectedSettlement, setSelectedSettlement] = useState<Settlement | null>(null);
  const [isReconcileModalOpen, setIsReconcileModalOpen] = useState(false);
  const [utrInput, setUtrInput] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getSettlements();
      setSettlements(data);
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
  const totalNetSettled = settlements.filter((s) => s.status === 'Reconciled').reduce((sum, s) => sum + s.netSettlement, 0);
  const totalGrossCaptured = settlements.reduce((sum, s) => sum + s.capturedAmount, 0);
  const totalFees = settlements.reduce((sum, s) => sum + s.gatewayFees + s.taxOnFees, 0);
  const totalRefunded = settlements.reduce((sum, s) => sum + s.refundedAmount, 0);

  const filteredSettlements = useMemo(() => {
    return settlements.filter((s) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        s.settlementId.toLowerCase().includes(q) ||
        s.gateway.toLowerCase().includes(q) ||
        (s.utrNumber && s.utrNumber.toLowerCase().includes(q));

      const matchStatus = statusFilter === 'all' || s.status.toLowerCase() === statusFilter.toLowerCase();
      return matchSearch && matchStatus;
    });
  }, [settlements, searchQuery, statusFilter]);

  const handleOpenReconcile = (s: Settlement) => {
    setSelectedSettlement(s);
    setUtrInput(s.utrNumber || `HDFC-UTR-${Date.now().toString().slice(-8)}`);
    setIsReconcileModalOpen(true);
  };

  const handleReconcileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSettlement || !utrInput.trim()) return;

    const updated = await reconcileSettlement(selectedSettlement.id, utrInput);
    if (updated) {
      setSettlements(settlements.map((s) => (s.id === selectedSettlement.id ? updated : s)));
      addToast(`Settlement #${updated.settlementId} reconciled with bank UTR ${utrInput}.`);
      setIsReconcileModalOpen(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Settlement ID,Gateway,Captured Amount,Refunded,Fees,Tax on Fees,Net Settlement,Date,UTR Number,Status'];
    const rows = filteredSettlements.map((s) =>
      `"${s.settlementId}","${s.gateway}",${s.capturedAmount},${s.refundedAmount},${s.gatewayFees},${s.taxOnFees},${s.netSettlement},"${s.settlementDate}","${s.utrNumber || ''}","${s.status}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nova_House_Settlements_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Settlements batch export generated.');
  };

  const columns: Column<Settlement>[] = [
    {
      header: 'Settlement Batch',
      key: 'settlementId',
      render: (s) => (
        <div>
          <span className="font-mono text-xs font-bold text-[#111111] block">{s.settlementId}</span>
          <span className="text-[10px] text-[#A58A5C] font-mono">{s.gateway}</span>
        </div>
      ),
    },
    {
      header: 'Disbursement Date',
      key: 'settlementDate',
      render: (s) => <span className="font-mono text-xs text-[#77736C]">{s.settlementDate}</span>,
    },
    {
      header: 'Gross Captured',
      key: 'capturedAmount',
      render: (s) => (
        <span className="font-mono text-xs text-[#111111]">
          ₹ {s.capturedAmount.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Refunds Deducted',
      key: 'refundedAmount',
      render: (s) => (
        <span className="font-mono text-xs text-rose-700">
          {s.refundedAmount > 0 ? `- ₹ ${s.refundedAmount.toLocaleString()}` : '—'}
        </span>
      ),
    },
    {
      header: 'Gateway MDR Fees',
      key: 'gatewayFees',
      render: (s) => (
        <div>
          <span className="font-mono text-xs text-[#77736C] block">
            - ₹ {(s.gatewayFees + s.taxOnFees).toLocaleString()}
          </span>
          <span className="text-[9px] text-[#77736C] font-mono">(incl. 18% GST)</span>
        </div>
      ),
    },
    {
      header: 'Net Settled to Bank',
      key: 'netSettlement',
      render: (s) => (
        <span className="font-mono text-xs font-bold text-emerald-800">
          ₹ {s.netSettlement.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Bank UTR Ref',
      key: 'utrNumber',
      render: (s) => (
        <span className="font-mono text-[11px] text-[#55514B]">
          {s.utrNumber || <span className="text-gray-400 italic">Pending Bank UTR</span>}
        </span>
      ),
    },
    {
      header: 'Reconciliation',
      key: 'status',
      render: (s) => <StatusBadge status={s.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (s) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {s.status !== 'Reconciled' ? (
            <button
              onClick={() => handleOpenReconcile(s)}
              className="px-2 py-1 text-[10px] font-mono font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xs transition-colors cursor-pointer flex items-center gap-1"
            >
              <CheckCircle2 size={11} />
              <span>Reconcile UTR</span>
            </button>
          ) : (
            <button
              onClick={() => handleOpenReconcile(s)}
              className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs cursor-pointer"
              title="Inspect Settlement"
            >
              <Eye size={15} />
            </button>
          )}
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
            Treasury & Bank Clearing Ledger
          </span>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Gateway Settlements & Reconciliation
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Audit daily Razorpay gateway batches, net merchant payouts, gateway fees, and bank UTR numbers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
          >
            Export Reconciliation CSV
          </Button>
        </div>
      </div>

      {/* KPI Tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="admin-card p-4 border-l-4 border-emerald-600">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">Net Cleared to Bank</span>
          <span className="font-serif text-2xl font-light text-emerald-800">₹ {totalNetSettled.toLocaleString()}</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Reconciled in hotel account</span>
        </div>

        <div className="admin-card p-4 border-l-4 border-[#111111]">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">Gross Captured</span>
          <span className="font-serif text-2xl font-light text-[#111111]">₹ {totalGrossCaptured.toLocaleString()}</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Total transaction volume</span>
        </div>

        <div className="admin-card p-4 border-l-4 border-rose-600">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">Total Refunds</span>
          <span className="font-serif text-2xl font-light text-rose-800">₹ {totalRefunded.toLocaleString()}</span>
          <span className="text-[10px] text-[#77736C] block mt-1">Deducted prior to settlement</span>
        </div>

        <div className="admin-card p-4 border-l-4 border-[#A58A5C]">
          <span className="font-mono text-[10px] uppercase text-[#77736C] block">MDR Gateway Fees</span>
          <span className="font-serif text-2xl font-light text-[#A58A5C]">₹ {totalFees.toLocaleString()}</span>
          <span className="text-[10px] text-[#77736C] block mt-1">2% MDR + 18% GST</span>
        </div>
      </div>

      {/* Search & Filter Row */}
      <div className="admin-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search settlement batch, UTR ref, gateway..."
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-select text-xs font-mono !py-1.5"
          >
            <option value="all">All Reconciliation States</option>
            <option value="Reconciled">Reconciled</option>
            <option value="Processing">Processing</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        <DataTable
          columns={columns}
          data={filteredSettlements}
          loading={loading}
          onRowClick={(s) => handleOpenReconcile(s)}
        />
      </div>

      {/* Reconcile UTR Modal */}
      <Modal
        isOpen={isReconcileModalOpen}
        onClose={() => setIsReconcileModalOpen(false)}
        title={selectedSettlement ? `Reconcile Batch #${selectedSettlement.settlementId}` : ''}
        subtitle="Match Bank Clearing UTR"
      >
        {selectedSettlement && (
          <form onSubmit={handleReconcileSubmit} className="space-y-4">
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-[#77736C]">Gateway:</span>
                <span className="font-semibold text-[#111111]">{selectedSettlement.gateway}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77736C]">Disbursement Date:</span>
                <span className="text-[#111111]">{selectedSettlement.settlementDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77736C]">Gross Volume:</span>
                <span className="text-[#111111]">₹ {selectedSettlement.capturedAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#77736C]">Gateway Deductions (MDR):</span>
                <span className="text-[#77736C]">- ₹ {(selectedSettlement.gatewayFees + selectedSettlement.taxOnFees).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-emerald-800 pt-2 border-t border-[#ECE8E0]">
                <span>Net Bank Credit:</span>
                <span>₹ {selectedSettlement.netSettlement.toLocaleString()}</span>
              </div>
            </div>

            <div className="form-group !mb-0 text-xs">
              <label className="form-label">Bank UTR / Transaction Reference Number</label>
              <input
                type="text"
                required
                value={utrInput}
                onChange={(e) => setUtrInput(e.target.value)}
                placeholder="e.g. HDFC000123456789"
                className="form-input text-xs font-mono"
              />
              <span className="text-[10px] text-[#77736C] font-mono mt-1 block">
                Found on your corporate hotel bank credit statement.
              </span>
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE8E0]">
              <Button variant="secondary" size="sm" onClick={() => setIsReconcileModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" icon={CheckCircle2}>
                Confirm Reconciliation
              </Button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
