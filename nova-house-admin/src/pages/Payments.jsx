import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CreditCard,
  Download,
  Eye,
  RotateCcw,
  CheckCircle2,
  Clock,
  AlertCircle,
  ShieldCheck,
  Search,
  Filter,
  ExternalLink,
} from 'lucide-react';
import {
  fetchPayments,
  fetchPaymentStats,
  processPaymentRefund,
} from '../services/paymentService';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import LoadingState from '../components/ui/LoadingState';
import PaymentStatsCards from '../components/payments/PaymentStatsCards';
import RefundModal from '../components/payments/RefundModal';
import PaymentDossierModal from '../components/payments/PaymentDossierModal';

export default function Payments() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const [payments, setPayments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Modals
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);
  const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [paymentsData, statsData] = await Promise.all([
        fetchPayments(statusFilter),
        fetchPaymentStats(),
      ]);
      setPayments(paymentsData);
      setStats(statsData);
    } catch (err) {
      console.error('Error loading payments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  // Filtering
  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (p.paymentId && p.paymentId.toLowerCase().includes(q)) ||
        (p.orderId && p.orderId.toLowerCase().includes(q)) ||
        (p.bookingId && p.bookingId.toLowerCase().includes(q)) ||
        (p.guestName && p.guestName.toLowerCase().includes(q)) ||
        (p.roomType && p.roomType.toLowerCase().includes(q));

      const matchesStatus =
        statusFilter === 'all' ||
        (p.status && p.status.toUpperCase() === statusFilter.toUpperCase());

      return matchesSearch && matchesStatus;
    });
  }, [payments, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredPayments.length / pageSize) || 1;
  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredPayments.slice(start, start + pageSize);
  }, [filteredPayments, currentPage, pageSize]);

  // Export CSV Handler
  const handleExportCSV = () => {
    const headers = ['Payment ID,Booking ID,Order ID,Guest Name,Room,Amount,Currency,Status,Method,Date'];
    const rows = filteredPayments.map((p) =>
      `"${p.paymentId}","${p.bookingId}","${p.orderId || ''}","${p.guestName}","${p.roomType}",${p.amount},"${p.currency}","${p.status}","${p.method}","${p.date}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nova_House_Payments_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Payment settlement export generated successfully.');
  };

  // Open Modals
  const handleViewDossier = (payment) => {
    setSelectedPayment(payment);
    setIsDossierOpen(true);
  };

  const handleOpenRefund = (payment) => {
    setSelectedPayment(payment);
    setIsRefundModalOpen(true);
  };

  const handleRefundSuccess = async (refundPayload) => {
    const res = await processPaymentRefund(refundPayload);
    addToast(`Refund of ₹ ${refundPayload.amount.toLocaleString()} dispatched successfully.`);
    loadData();
  };

  const statusOptions = [
    { label: 'All', value: 'all', count: payments.length },
    { label: 'Captured (PAID)', value: 'PAID', count: payments.filter((p) => p.status === 'PAID').length },
    { label: 'Pending', value: 'PENDING', count: payments.filter((p) => p.status === 'PENDING').length },
    { label: 'Refunded', value: 'REFUNDED', count: payments.filter((p) => p.status === 'REFUNDED').length },
  ];

  const columns = [
    {
      header: 'Payment Reference',
      key: 'paymentId',
      render: (p) => (
        <div>
          <span className="font-mono text-xs font-semibold text-[#111111] block">
            {p.paymentId}
          </span>
          <span className="font-mono text-[10px] text-[#77736C]">
            {p.date} · {p.method}
          </span>
        </div>
      ),
    },
    {
      header: 'Guest & Booking',
      key: 'bookingId',
      render: (p) => (
        <div>
          <span className="text-xs font-medium text-[#111111] block">
            {p.guestName}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/admin/bookings/${p.bookingId}`);
            }}
            className="font-mono text-[11px] text-[#A58A5C] hover:underline flex items-center gap-1 mt-0.5"
          >
            <span>{p.bookingId}</span>
            <ExternalLink size={10} />
          </button>
        </div>
      ),
    },
    {
      header: 'Sanctuary Suite',
      key: 'roomType',
      render: (p) => (
        <div>
          <span className="font-serif text-xs font-light text-[#111111] block">
            {p.roomType}
          </span>
          <span className="font-mono text-[10px] text-[#77736C]">
            {p.checkIn} → {p.checkOut}
          </span>
        </div>
      ),
    },
    {
      header: 'Amount',
      key: 'amount',
      render: (p) => (
        <div>
          <span className="font-mono text-xs font-semibold text-[#111111] block">
            ₹ {p.amount.toLocaleString()}
          </span>
          <span className="font-mono text-[9px] uppercase tracking-wider text-[#77736C]">
            {p.currency}
          </span>
        </div>
      ),
    },
    {
      header: 'Gateway Status',
      key: 'status',
      render: (p) => <StatusBadge status={p.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleViewDossier(p)}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs transition-colors"
            title="Inspect Payment Dossier"
          >
            <Eye size={15} />
          </button>

          {p.status === 'PAID' && (
            <button
              onClick={() => handleOpenRefund(p)}
              className="p-1.5 text-[#77736C] hover:text-[#A58A5C] hover:bg-[#F4F1EB] rounded-xs transition-colors"
              title="Issue Refund"
            >
              <RotateCcw size={15} />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C]">
              Financial Settlements & Gateway
            </span>
            <span className="px-2 py-0.5 bg-[#FAF8F5] border border-[#ECE8E0] text-[10px] font-mono text-[#55514B] rounded-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Razorpay TEST MODE
            </span>
          </div>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Payments Reconciliations
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Audit captured guest payments, monitor Razorpay orders, and issue authorized refunds.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
          >
            Export Settlements
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <PaymentStatsCards stats={stats} />

      {/* Filter Tabs */}
      <div className="overflow-x-auto pb-1">
        <FilterBar
          options={statusOptions}
          activeValue={statusFilter}
          onChange={(val) => {
            setStatusFilter(val);
            setCurrentPage(1);
          }}
        />
      </div>

      {/* Search & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="max-w-md w-full">
          <SearchBar
            value={searchQuery}
            onChange={(val) => {
              const query = typeof val === 'string' ? val : (val?.target?.value ?? '');
              setSearchQuery(query);
              setCurrentPage(1);
            }}
            placeholder="Search by Payment ID, Order ID, Booking Ref, or Guest..."
          />
        </div>

        <div className="text-xs font-mono text-[#77736C]">
          Showing <strong>{filteredPayments.length}</strong> transactions
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="admin-card p-16">
          <LoadingState message="Fetching live transaction records..." />
        </div>
      ) : (
        <div className="space-y-4">
          <DataTable
            columns={columns}
            data={paginatedPayments}
            emptyMessage="No payment records match your selected filter."
            onRowClick={(p) => handleViewDossier(p)}
          />

          {totalPages > 1 && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
        </div>
      )}

      {/* Payment Dossier Modal */}
      <PaymentDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        payment={selectedPayment}
        onOpenRefund={handleOpenRefund}
      />

      {/* Refund Authorization Modal */}
      <RefundModal
        isOpen={isRefundModalOpen}
        onClose={() => setIsRefundModalOpen(false)}
        payment={selectedPayment}
        onRefundSuccess={handleRefundSuccess}
      />
    </div>
  );
}
