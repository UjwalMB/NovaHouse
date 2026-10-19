import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Download,
  Eye,
  CreditCard,
  Mail,
  Phone,
  LayoutList,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock,
  DoorOpen,
  Ban,
  CheckCircle2,
  Edit2,
  Calendar,
  X,
} from 'lucide-react';
import { settlePayment } from '../services/paymentService';
import { useBookings } from '../hooks/useBookings';
import { useRooms } from '../hooks/useRooms';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import FilterBar, { FilterOption } from '../components/ui/FilterBar';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';
import { Booking } from '../types';

export default function Bookings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const {
    bookings,
    loading,
    createBooking,
    updateBooking,
    updateStatus,
    cancelBooking,
    refresh,
  } = useBookings();
  const { rooms } = useRooms();

  // View Mode: 'table' vs 'tape_chart'
  const [viewMode, setViewMode] = useState<'table' | 'tape_chart'>('table');

  // Search & Filter State
  const initialSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Tape Chart Date Window (14 days)
  const [tapeStartDate, setTapeStartDate] = useState(() => {
    const d = new Date(2026, 9, 12); // Oct 12, 2026 base
    return d;
  });

  // Generate 14 continuous dates for tape chart
  const tapeDates = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const d = new Date(tapeStartDate);
      d.setDate(d.getDate() + i);
      const iso = d.toISOString().split('T')[0];
      return {
        key: iso,
        dateObj: d,
        dayNumber: d.getDate(),
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        month: d.toLocaleDateString('en-US', { month: 'short' }),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      };
    });
  }, [tapeStartDate]);

  const handlePrevTape = () => {
    setTapeStartDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() - 7);
      return d;
    });
  };

  const handleNextTape = () => {
    setTapeStartDate((prev) => {
      const d = new Date(prev);
      d.setDate(d.getDate() + 7);
      return d;
    });
  };

  const handleResetToday = () => {
    setTapeStartDate(new Date(2026, 9, 12));
  };

  // New Booking Modal State
  const [isNewModalOpen, setIsNewModalOpen] = useState(searchParams.get('new') === 'true');
  const [newForm, setNewForm] = useState({
    guestName: '',
    guestEmail: '',
    guestPhone: '',
    guestCountry: 'India',
    roomId: '301',
    checkIn: '2026-10-18',
    checkOut: '2026-10-21',
    guests: 2,
    specialRequests: '',
    paymentMethod: 'Credit Card',
  });

  // Edit Booking Modal State
  const [editingBooking, setEditingBooking] = useState<Booking | null>(null);
  const [editForm, setEditForm] = useState<Partial<Booking>>({});

  // Quick Dossier Preview Modal (from Tape Chart or Quick Click)
  const [selectedTapeBooking, setSelectedTapeBooking] = useState<Booking | null>(null);

  // Filter calculations
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.guestName.toLowerCase().includes(q) ||
        b.guestEmail.toLowerCase().includes(q) ||
        (b.guestPhone && b.guestPhone.toLowerCase().includes(q)) ||
        (b.guestCountry && b.guestCountry.toLowerCase().includes(q)) ||
        (b.specialRequests && b.specialRequests.toLowerCase().includes(q)) ||
        b.roomType.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        b.bookingStatus.toLowerCase() === statusFilter.toLowerCase();

      const matchesRoom =
        roomFilter === 'all' ||
        b.roomType.toLowerCase() === roomFilter.toLowerCase();

      const matchesPayment =
        paymentFilter === 'all' ||
        b.paymentStatus.toLowerCase() === paymentFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesRoom && matchesPayment;
    });
  }, [bookings, searchQuery, statusFilter, roomFilter, paymentFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredBookings.length / pageSize);
  const paginatedBookings = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, currentPage, pageSize]);

  // Export CSV Handler
  const handleExport = () => {
    const headers = ['Booking ID,Guest,Email,Phone,Country,Room,CheckIn,CheckOut,Guests,Amount,Payment,Status,Special Requests'];
    const rows = filteredBookings.map((b) =>
      `"${b.id}","${b.guestName}","${b.guestEmail}","${b.guestPhone || ''}","${b.guestCountry || ''}","${b.roomType}","${b.checkIn}","${b.checkOut}",${b.guests},${b.totalAmount},"${b.paymentStatus}","${b.bookingStatus}","${(b.specialRequests || '').replace(/"/g, '""')}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nova_House_Bookings_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Bookings export generated successfully.');
  };

  // Submit New Booking
  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selRoom = rooms.find((r) => r.id === newForm.roomId) || rooms[0];

    const d1 = new Date(newForm.checkIn).getTime();
    const d2 = new Date(newForm.checkOut).getTime();
    const nights = Math.max(1, Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)));
    const baseRate = selRoom?.price || 38000;
    const taxes = Math.round(baseRate * nights * 0.18);
    const totalAmount = baseRate * nights + taxes;

    await createBooking({
      ...newForm,
      roomNumber: selRoom?.roomNumber || '301',
      roomType: selRoom?.type || 'Nova Suite',
      roomId: selRoom?.id || '301',
      nights,
      baseRate,
      taxes,
      discount: 0,
      totalAmount,
      bookingStatus: 'Confirmed',
      paymentStatus: 'Pending',
      source: 'Front Desk Direct',
    });

    addToast(`Reservation created for ${newForm.guestName}.`);
    setIsNewModalOpen(false);
  };

  // Open Edit Modal
  const handleOpenEdit = (b: Booking) => {
    setEditingBooking(b);
    setEditForm({
      guestName: b.guestName,
      guestEmail: b.guestEmail,
      guestPhone: b.guestPhone,
      guestCountry: b.guestCountry,
      roomId: b.roomId,
      roomNumber: b.roomNumber,
      roomType: b.roomType,
      checkIn: b.checkIn,
      checkOut: b.checkOut,
      guests: b.guests,
      specialRequests: b.specialRequests,
      bookingStatus: b.bookingStatus,
      paymentStatus: b.paymentStatus,
    });
  };

  // Submit Edit Booking
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBooking) return;

    const selRoom = rooms.find((r) => r.id === editForm.roomId) || rooms.find((r) => r.roomNumber === editForm.roomNumber) || rooms[0];
    const d1 = new Date(editForm.checkIn || editingBooking.checkIn).getTime();
    const d2 = new Date(editForm.checkOut || editingBooking.checkOut).getTime();
    const nights = Math.max(1, Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)));
    const baseRate = selRoom?.price || editingBooking.baseRate;
    const taxes = Math.round(baseRate * nights * 0.18);
    const totalAmount = baseRate * nights + taxes;

    await updateBooking(editingBooking.id, {
      ...editForm,
      roomNumber: selRoom?.roomNumber || editForm.roomNumber,
      roomType: selRoom?.type || editForm.roomType,
      roomId: selRoom?.id || editForm.roomId,
      nights,
      baseRate,
      taxes,
      totalAmount,
    });

    addToast(`Reservation #${editingBooking.id} updated successfully.`);
    setEditingBooking(null);
    if (selectedTapeBooking && selectedTapeBooking.id === editingBooking.id) {
      setSelectedTapeBooking(null);
    }
  };

  // Status transitions
  const handleQuickStatus = async (b: Booking, newStatus: string) => {
    await updateStatus(b.id, newStatus);
    addToast(`Reservation #${b.id} status changed to ${newStatus}.`);
    if (selectedTapeBooking && selectedTapeBooking.id === b.id) {
      setSelectedTapeBooking({ ...selectedTapeBooking, bookingStatus: newStatus });
    }
  };

  const handleQuickCancel = async (b: Booking) => {
    if (window.confirm(`Are you sure you want to cancel reservation #${b.id} for ${b.guestName}?`)) {
      await cancelBooking(b.id);
      addToast(`Reservation #${b.id} has been cancelled.`);
      if (selectedTapeBooking && selectedTapeBooking.id === b.id) {
        setSelectedTapeBooking({ ...selectedTapeBooking, bookingStatus: 'Cancelled' });
      }
    }
  };

  // Helper for Tape Chart: Find booking for a room spanning a date
  const getBookingForRoomDate = (room: any, dateStr: string) => {
    return bookings.find((b) => {
      if (b.bookingStatus === 'Cancelled') return false;
      const matchRoom =
        String(b.roomId) === String(room.id) ||
        String(b.roomNumber) === String(room.roomNumber) ||
        (b.roomType && room.name && b.roomType.toLowerCase().includes(room.name.toLowerCase().split(' ')[0]));
      if (!matchRoom) return false;
      return dateStr >= b.checkIn && dateStr < b.checkOut;
    });
  };

  const isCheckInDay = (b: Booking, dateStr: string) => b.checkIn === dateStr;

  const columns: Column<Booking>[] = [
    {
      header: 'Booking ID',
      key: 'id',
      render: (b: Booking) => (
        <span className="font-mono text-xs font-semibold text-[#111111]">
          #{b.id}
        </span>
      ),
    },
    {
      header: 'Guest Details',
      key: 'guestName',
      render: (b: Booking) => (
        <div className="space-y-1">
          <div className="font-medium text-[#111111] flex items-center gap-1.5 flex-wrap">
            <span className="font-semibold">{b.guestName}</span>
            {b.guestCountry && (
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#FAF8F5] border border-[#E2DDD5] text-[#77736C] rounded-xs">
                {b.guestCountry}
              </span>
            )}
          </div>
          <div className="text-[11px] text-[#55514B] font-mono flex items-center gap-1.5">
            <Mail size={11} className="text-[#A58A5C] shrink-0" />
            <a
              href={`mailto:${b.guestEmail}`}
              onClick={(e) => e.stopPropagation()}
              className="hover:underline hover:text-[#111111]"
            >
              {b.guestEmail || '—'}
            </a>
          </div>
          {b.guestPhone && (
            <div className="text-[11px] text-[#55514B] font-mono flex items-center gap-1.5">
              <Phone size={11} className="text-[#A58A5C] shrink-0" />
              <a
                href={`tel:${b.guestPhone}`}
                onClick={(e) => e.stopPropagation()}
                className="hover:underline hover:text-[#111111]"
              >
                {b.guestPhone}
              </a>
            </div>
          )}
          {b.specialRequests && (
            <div
              className="text-[10px] font-sans text-[#77736C] bg-[#FAF8F5] px-1.5 py-0.5 border border-[#E2DDD5] rounded-xs truncate max-w-[220px]"
              title={b.specialRequests}
            >
              <span className="text-[#A58A5C] font-semibold">Note:</span> {b.specialRequests}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Room',
      key: 'roomType',
      render: (b: Booking) => (
        <div>
          <span className="font-serif text-xs text-[#111111]">{b.roomType}</span>
          <span className="block text-[10px] text-[#77736C] font-mono">
            Room #{b.roomNumber}
          </span>
        </div>
      ),
    },
    {
      header: 'Dates',
      key: 'checkIn',
      render: (b: Booking) => (
        <div className="font-mono text-xs text-[#111111]">
          <div>{b.checkIn}</div>
          <div className="text-[10px] text-[#77736C]">{b.checkOut} ({b.nights || 1}n)</div>
        </div>
      ),
    },
    {
      header: 'Guests',
      key: 'guests',
      render: (b: Booking) => <span className="font-mono text-xs">{b.guests}</span>,
    },
    {
      header: 'Total',
      key: 'totalAmount',
      render: (b: Booking) => (
        <span className="font-mono text-xs font-semibold text-[#111111]">
          ₹ {b.totalAmount?.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Payment',
      key: 'paymentStatus',
      render: (b: Booking) => <StatusBadge status={b.paymentStatus} />,
    },
    {
      header: 'Status',
      key: 'bookingStatus',
      render: (b: Booking) => <StatusBadge status={b.bookingStatus} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (b: Booking) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {/* Quick Pay */}
          {(b.paymentStatus === 'Pending' || b.paymentStatus === 'PENDING' || b.paymentStatus === 'UNPAID') && (
            <button
              onClick={async (e) => {
                e.stopPropagation();
                try {
                  await settlePayment({ bookingId: b.id });
                  addToast(`Payment for #${b.id} marked as PAID.`);
                  refresh();
                } catch (err) {
                  navigate(`/admin/bookings/${b.id}`);
                }
              }}
              className="px-2 py-1 text-[10px] font-mono font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
              title="Collect Payment"
            >
              <CreditCard size={11} />
              <span>Pay</span>
            </button>
          )}

          {/* Quick Check-In */}
          {b.bookingStatus === 'Confirmed' && (
            <button
              onClick={() => handleQuickStatus(b, 'Checked In')}
              className="px-2 py-1 text-[10px] font-mono font-medium text-[#244C66] bg-[#EBF4F9] hover:bg-[#D8EBF5] border border-[#C5DFEE] rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
              title="Quick Check-In"
            >
              <DoorOpen size={11} />
              <span>In</span>
            </button>
          )}

          {/* Quick Check-Out */}
          {b.bookingStatus === 'Checked In' && (
            <button
              onClick={() => handleQuickStatus(b, 'Checked Out')}
              className="px-2 py-1 text-[10px] font-mono font-medium text-[#55514B] bg-[#F4F1EB] hover:bg-[#EAE4D7] border border-[#E2DDD5] rounded-xs transition-colors flex items-center gap-1 cursor-pointer"
              title="Quick Check-Out"
            >
              <Clock size={11} />
              <span>Out</span>
            </button>
          )}

          {/* Edit */}
          <button
            onClick={() => handleOpenEdit(b)}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs transition-colors cursor-pointer"
            title="Edit Reservation"
          >
            <Edit2 size={13} />
          </button>

          {/* Cancel */}
          {b.bookingStatus !== 'Cancelled' && b.bookingStatus !== 'Checked Out' && (
            <button
              onClick={() => handleQuickCancel(b)}
              className="p-1.5 text-[#77736C] hover:text-[#962828] hover:bg-[#FDF0F0] rounded-xs transition-colors cursor-pointer"
              title="Cancel Reservation"
            >
              <Ban size={13} />
            </button>
          )}

          {/* View Dossier */}
          <button
            onClick={() => navigate(`/admin/bookings/${b.id}`)}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs transition-colors cursor-pointer"
            title="View Full Dossier"
          >
            <Eye size={15} />
          </button>
        </div>
      ),
    },
  ];

  const statusOptions: FilterOption[] = [
    { label: 'All', value: 'all', count: bookings.length },
    { label: 'Confirmed', value: 'Confirmed', count: bookings.filter((b) => b.bookingStatus === 'Confirmed').length },
    { label: 'Checked In', value: 'Checked In', count: bookings.filter((b) => b.bookingStatus === 'Checked In').length },
    { label: 'Pending', value: 'Pending', count: bookings.filter((b) => b.bookingStatus === 'Pending').length },
    { label: 'Checked Out', value: 'Checked Out', count: bookings.filter((b) => b.bookingStatus === 'Checked Out').length },
    { label: 'Cancelled', value: 'Cancelled', count: bookings.filter((b) => b.bookingStatus === 'Cancelled').length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Central Reservation System (CRS)
          </span>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Bookings Directory
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Manage arrivals, departures, room tape-chart grid, and financial reconciliations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="inline-flex rounded-xs border border-[#E2DDD5] bg-[#FFFFFF] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-xs transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#111111] text-[#FFFFFF]'
                  : 'text-[#77736C] hover:text-[#111111]'
              }`}
            >
              <LayoutList size={13} />
              <span>Table View</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('tape_chart')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-xs transition-colors cursor-pointer ${
                viewMode === 'tape_chart'
                  ? 'bg-[#111111] text-[#FFFFFF]'
                  : 'text-[#77736C] hover:text-[#111111]'
              }`}
            >
              <CalendarDays size={13} />
              <span>Tape Chart</span>
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExport}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsNewModalOpen(true)}
          >
            Add Booking
          </Button>
        </div>
      </div>

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

      {/* Search and Secondary Filter Row */}
      <div className="admin-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <SearchBar
            value={searchQuery}
            onChange={(val) => {
              setSearchQuery(val);
              setCurrentPage(1);
            }}
            placeholder="Search guest, ID, email..."
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Room Type Selector */}
          <select
            value={roomFilter}
            onChange={(e) => {
              setRoomFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="form-select !py-2 text-xs font-mono"
          >
            <option value="all">All Room Types</option>
            <option value="Deluxe Courtyard">Deluxe Courtyard</option>
            <option value="Premier Garden Room">Premier Garden Room</option>
            <option value="Nova Suite">Nova Suite</option>
            <option value="Executive Corner Suite">Executive Corner Suite</option>
            <option value="Residency Terrace Suite">Residency Terrace Suite</option>
            <option value="The Bengaluru Penthouse">The Bengaluru Penthouse</option>
            <option value="The Skyline Penthouse">The Skyline Penthouse</option>
          </select>

          {/* Payment Status Selector */}
          <select
            value={paymentFilter}
            onChange={(e) => {
              setPaymentFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="form-select !py-2 text-xs font-mono"
          >
            <option value="all">All Payments</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
            <option value="Refunded">Refunded</option>
          </select>
        </div>
      </div>

      {/* VIEW: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="admin-card">
          <DataTable
            columns={columns}
            data={paginatedBookings}
            loading={loading}
            onRowClick={(b: Booking) => navigate(`/admin/bookings/${b.id}`)}
            emptyTitle="No bookings found"
            emptyMessage="No reservations match the selected search terms or filters."
          />

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={filteredBookings.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      {/* VIEW: PROFESSIONAL TAPE CHART / CALENDAR VIEW */}
      {viewMode === 'tape_chart' && (
        <div className="admin-card overflow-hidden">
          {/* Tape Chart Navigation Toolbar */}
          <div className="p-4 border-b border-[#E2DDD5] bg-[#FAF8F5] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="font-mono text-xs font-medium text-[#111111] flex items-center gap-2">
                <Calendar size={14} className="text-[#A58A5C]" />
                <span>
                  {tapeDates[0].dayNumber} {tapeDates[0].month} – {tapeDates[13].dayNumber} {tapeDates[13].month} 2026
                </span>
              </span>
              <button
                type="button"
                onClick={handleResetToday}
                className="px-2 py-0.5 text-[10px] font-mono border border-[#E2DDD5] bg-[#FFFFFF] hover:bg-[#F4F1EB] rounded-xs cursor-pointer"
              >
                Today
              </button>
            </div>

            {/* Tape Legend & Paging */}
            <div className="flex items-center gap-4">
              <div className="hidden lg:flex items-center gap-3 text-[11px] font-mono">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#FAF3E8] border border-[#A58A5C]" />
                  <span>Confirmed</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#EBF4F9] border border-[#244C66]" />
                  <span>Checked In</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#FEF3C7] border border-[#D97706]" />
                  <span>Pending</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-[#F4F1EB] border border-[#77736C]" />
                  <span>Checked Out</span>
                </span>
              </div>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={handlePrevTape}
                  className="p-1.5 border border-[#E2DDD5] bg-[#FFFFFF] rounded-xs hover:bg-[#F4F1EB] transition-colors cursor-pointer"
                  title="Previous 7 Days"
                >
                  <ChevronLeft size={14} />
                </button>
                <button
                  type="button"
                  onClick={handleNextTape}
                  className="p-1.5 border border-[#E2DDD5] bg-[#FFFFFF] rounded-xs hover:bg-[#F4F1EB] transition-colors cursor-pointer"
                  title="Next 7 Days"
                >
                  <ChevronRight size={14} />
                </button>
              </div>
            </div>
          </div>

          {/* Tape Grid Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#FAF8F5] border-b border-[#E2DDD5]">
                  <th className="sticky left-0 z-20 bg-[#FAF8F5] p-3 text-left font-mono text-xs uppercase tracking-wider text-[#77736C] w-48 border-r border-[#E2DDD5]">
                    Room Key
                  </th>
                  {tapeDates.map((td) => (
                    <th
                      key={td.key}
                      className={`p-2.5 text-center font-mono text-xs border-r border-[#ECE8E0] min-w-[85px] ${
                        td.isWeekend ? 'bg-[#F6F2EA]' : ''
                      }`}
                    >
                      <div className="text-[10px] uppercase text-[#77736C]">{td.weekday}</div>
                      <div className="font-serif text-sm font-semibold text-[#111111] mt-0.5">
                        {td.dayNumber} {td.month}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rooms.map((room) => {
                  return (
                    <tr key={room.id} className="border-b border-[#ECE8E0] hover:bg-[#FAF8F5]/30">
                      {/* Room Column */}
                      <td className="sticky left-0 z-10 bg-[#FFFFFF] p-3 border-r border-[#E2DDD5] shadow-xs">
                        <div className="font-mono text-xs font-bold text-[#111111]">
                          Room #{room.roomNumber}
                        </div>
                        <div className="font-serif text-[11px] text-[#77736C] truncate max-w-[150px]">
                          {room.name}
                        </div>
                        <span className="text-[9px] font-mono text-[#A58A5C] block">
                          ₹{room.price.toLocaleString()}/nt
                        </span>
                      </td>

                      {/* Date Cells */}
                      {tapeDates.map((td) => {
                        const booking = getBookingForRoomDate(room, td.key);
                        const isStart = booking ? isCheckInDay(booking, td.key) : false;

                        if (booking) {
                          // Render reservation cell
                          let bgClass = 'bg-[#FAF3E8] border-[#A58A5C] text-[#8C734B]';
                          if (booking.bookingStatus === 'Checked In') {
                            bgClass = 'bg-[#EBF4F9] border-[#244C66] text-[#244C66]';
                          } else if (booking.bookingStatus === 'Checked Out') {
                            bgClass = 'bg-[#F4F1EB] border-[#77736C] text-[#55514B]';
                          } else if (booking.bookingStatus === 'Pending') {
                            bgClass = 'bg-[#FEF3C7] border-[#D97706] text-[#92400E]';
                          }

                          return (
                            <td
                              key={td.key}
                              onClick={() => setSelectedTapeBooking(booking)}
                              className="p-1 border-r border-[#ECE8E0] cursor-pointer"
                              title={`Booking #${booking.id} - ${booking.guestName} (${booking.checkIn} to ${booking.checkOut})`}
                            >
                              <div
                                className={`h-11 px-1.5 py-1 rounded-xs border text-left font-mono transition-transform hover:scale-[0.98] ${bgClass} overflow-hidden flex flex-col justify-between`}
                              >
                                <div className="font-semibold text-[10px] truncate leading-tight">
                                  {isStart ? `● ${booking.guestName}` : booking.guestName}
                                </div>
                                <div className="text-[9px] opacity-80 flex items-center justify-between">
                                  <span>#{booking.id}</span>
                                  <span className="uppercase text-[8px] font-bold">
                                    {booking.bookingStatus.slice(0, 3)}
                                  </span>
                                </div>
                              </div>
                            </td>
                          );
                        }

                        // Empty cell: click to add new booking for this room & date
                        return (
                          <td
                            key={td.key}
                            onClick={() => {
                              setNewForm((prev) => ({
                                ...prev,
                                roomId: room.id,
                                checkIn: td.key,
                                checkOut: new Date(new Date(td.key).getTime() + 86400000 * 2).toISOString().split('T')[0],
                              }));
                              setIsNewModalOpen(true);
                            }}
                            className="p-1 border-r border-[#ECE8E0] text-center cursor-pointer hover:bg-emerald-50/50 transition-colors group"
                            title={`Click to book Room #${room.roomNumber} starting ${td.dayNumber} ${td.month}`}
                          >
                            <div className="h-11 rounded-xs border border-dashed border-transparent group-hover:border-emerald-300 flex items-center justify-center text-[10px] text-emerald-700 opacity-0 group-hover:opacity-100 font-mono">
                              + Book
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Selected Tape Booking Quick Popover Modal */}
      {selectedTapeBooking && (
        <Modal
          isOpen={!!selectedTapeBooking}
          onClose={() => setSelectedTapeBooking(null)}
          title={`Reservation #${selectedTapeBooking.id}`}
          subtitle={`${selectedTapeBooking.roomType} · Room #${selectedTapeBooking.roomNumber}`}
        >
          <div className="space-y-4">
            <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2 text-xs font-mono">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-[#77736C] uppercase block">Guest Name</span>
                  <span className="font-sans text-base font-semibold text-[#111111]">
                    {selectedTapeBooking.guestName}
                  </span>
                </div>
                <StatusBadge status={selectedTapeBooking.bookingStatus} />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#ECE8E0] text-[11px]">
                <div>
                  <span className="text-[#77736C] block">Arrival:</span>
                  <strong>{selectedTapeBooking.checkIn}</strong>
                </div>
                <div>
                  <span className="text-[#77736C] block">Departure:</span>
                  <strong>{selectedTapeBooking.checkOut}</strong>
                </div>
                <div>
                  <span className="text-[#77736C] block">Nights:</span>
                  <strong>{selectedTapeBooking.nights || 1} Nights ({selectedTapeBooking.guests} Guests)</strong>
                </div>
                <div>
                  <span className="text-[#77736C] block">Tariff:</span>
                  <strong className="text-[#111111]">₹ {selectedTapeBooking.totalAmount?.toLocaleString()}</strong>
                </div>
              </div>

              <div className="pt-2 border-t border-[#ECE8E0] flex items-center justify-between">
                <span>Payment: <strong className="text-[#111111]">{selectedTapeBooking.paymentStatus}</strong></span>
                <span>Source: <strong className="text-[#111111]">{selectedTapeBooking.source || 'Direct'}</strong></span>
              </div>
            </div>

            {selectedTapeBooking.specialRequests && (
              <div className="p-2.5 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs text-xs font-sans">
                <span className="text-[10px] font-mono text-[#A58A5C] uppercase block mb-0.5">Special Requests</span>
                <p className="text-[#55514B]">{selectedTapeBooking.specialRequests}</p>
              </div>
            )}

            {/* Quick Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-2 pt-3 border-t border-[#ECE8E0]">
              {selectedTapeBooking.bookingStatus === 'Confirmed' && (
                <Button
                  variant="primary"
                  size="sm"
                  icon={DoorOpen}
                  onClick={() => handleQuickStatus(selectedTapeBooking, 'Checked In')}
                >
                  Check In
                </Button>
              )}

              {selectedTapeBooking.bookingStatus === 'Checked In' && (
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Clock}
                  onClick={() => handleQuickStatus(selectedTapeBooking, 'Checked Out')}
                >
                  Check Out
                </Button>
              )}

              <Button
                variant="secondary"
                size="sm"
                icon={Edit2}
                onClick={() => {
                  handleOpenEdit(selectedTapeBooking);
                }}
              >
                Edit
              </Button>

              {selectedTapeBooking.bookingStatus !== 'Cancelled' && selectedTapeBooking.bookingStatus !== 'Checked Out' && (
                <Button
                  variant="danger"
                  size="sm"
                  icon={Ban}
                  onClick={() => handleQuickCancel(selectedTapeBooking)}
                >
                  Cancel
                </Button>
              )}

              <Button
                variant="primary"
                size="sm"
                icon={Eye}
                onClick={() => navigate(`/admin/bookings/${selectedTapeBooking.id}`)}
              >
                View Dossier
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* Edit Booking Modal */}
      {editingBooking && (
        <Modal
          isOpen={!!editingBooking}
          onClose={() => setEditingBooking(null)}
          title={`Edit Reservation #${editingBooking.id}`}
          subtitle="Front Desk Tariff & Date Allocation"
        >
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="form-group !mb-0">
                <label className="form-label">Guest Full Name</label>
                <input
                  type="text"
                  required
                  value={editForm.guestName || ''}
                  onChange={(e) => setEditForm({ ...editForm, guestName: e.target.value })}
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Guest Email</label>
                <input
                  type="email"
                  required
                  value={editForm.guestEmail || ''}
                  onChange={(e) => setEditForm({ ...editForm, guestEmail: e.target.value })}
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  required
                  value={editForm.guestPhone || ''}
                  onChange={(e) => setEditForm({ ...editForm, guestPhone: e.target.value })}
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Country of Residence</label>
                <input
                  type="text"
                  value={editForm.guestCountry || ''}
                  onChange={(e) => setEditForm({ ...editForm, guestCountry: e.target.value })}
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Sanctuary Room Key</label>
                <select
                  value={editForm.roomId}
                  onChange={(e) => setEditForm({ ...editForm, roomId: e.target.value })}
                  className="form-select text-xs font-mono"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.roomNumber} - {r.name} (₹ {r.price.toLocaleString()}/nt)
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Guests Count</label>
                <select
                  value={editForm.guests || 2}
                  onChange={(e) => setEditForm({ ...editForm, guests: Number(e.target.value) })}
                  className="form-select text-xs font-mono"
                >
                  <option value={1}>1 Guest</option>
                  <option value={2}>2 Guests</option>
                  <option value={3}>3 Guests</option>
                  <option value={4}>4 Guests</option>
                </select>
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Check-in Date</label>
                <input
                  type="date"
                  required
                  value={editForm.checkIn || ''}
                  onChange={(e) => setEditForm({ ...editForm, checkIn: e.target.value })}
                  className="form-input text-xs font-mono"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Check-out Date</label>
                <input
                  type="date"
                  required
                  value={editForm.checkOut || ''}
                  onChange={(e) => setEditForm({ ...editForm, checkOut: e.target.value })}
                  className="form-input text-xs font-mono"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Reservation Status</label>
                <select
                  value={editForm.bookingStatus}
                  onChange={(e) => setEditForm({ ...editForm, bookingStatus: e.target.value })}
                  className="form-select text-xs font-mono"
                >
                  <option value="Confirmed">Confirmed</option>
                  <option value="Checked In">Checked In</option>
                  <option value="Checked Out">Checked Out</option>
                  <option value="Pending">Pending</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Payment Status</label>
                <select
                  value={editForm.paymentStatus}
                  onChange={(e) => setEditForm({ ...editForm, paymentStatus: e.target.value })}
                  className="form-select text-xs font-mono"
                >
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Refunded">Refunded</option>
                </select>
              </div>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Special Requests / Preferences</label>
              <textarea
                rows={2}
                value={editForm.specialRequests || ''}
                onChange={(e) => setEditForm({ ...editForm, specialRequests: e.target.value })}
                className="form-textarea text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECE8E0]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingBooking(null)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Adjustments
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add Booking Modal */}
      <Modal
        isOpen={isNewModalOpen}
        onClose={() => setIsNewModalOpen(false)}
        title="Create New Reservation"
        subtitle="Front Desk Key Allocation"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="form-group !mb-0">
              <label className="form-label">Guest Full Name</label>
              <input
                type="text"
                required
                value={newForm.guestName}
                onChange={(e) => setNewForm({ ...newForm, guestName: e.target.value })}
                placeholder="e.g. Vikramaditya Singhania"
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Guest Email</label>
              <input
                type="email"
                required
                value={newForm.guestEmail}
                onChange={(e) => setNewForm({ ...newForm, guestEmail: e.target.value })}
                placeholder="vikram@enterprise.in"
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                required
                value={newForm.guestPhone}
                onChange={(e) => setNewForm({ ...newForm, guestPhone: e.target.value })}
                placeholder="+91 98450 11223"
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Country of Residence</label>
              <input
                type="text"
                value={newForm.guestCountry}
                onChange={(e) => setNewForm({ ...newForm, guestCountry: e.target.value })}
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Select Sanctuary Room</label>
              <select
                value={newForm.roomId}
                onChange={(e) => setNewForm({ ...newForm, roomId: e.target.value })}
                className="form-select text-xs font-mono"
              >
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.roomNumber} - {r.name} (₹ {r.price.toLocaleString()}/nt)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Guests Count</label>
              <select
                value={newForm.guests}
                onChange={(e) => setNewForm({ ...newForm, guests: Number(e.target.value) })}
                className="form-select text-xs font-mono"
              >
                <option value={1}>1 Guest</option>
                <option value={2}>2 Guests</option>
                <option value={3}>3 Guests</option>
                <option value={4}>4 Guests (Penthouse)</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Check-in Date</label>
              <input
                type="date"
                required
                value={newForm.checkIn}
                onChange={(e) => setNewForm({ ...newForm, checkIn: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Check-out Date</label>
              <input
                type="date"
                required
                value={newForm.checkOut}
                onChange={(e) => setNewForm({ ...newForm, checkOut: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Special Requests / Preferences</label>
            <textarea
              rows={2}
              value={newForm.specialRequests}
              onChange={(e) => setNewForm({ ...newForm, specialRequests: e.target.value })}
              placeholder="e.g. Airport chauffeur, quiet courtyard wing, vegan breakfast..."
              className="form-textarea text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECE8E0]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsNewModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm Reservation
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
