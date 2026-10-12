import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Plus,
  Download,
  Eye,
  Trash2,
  Calendar,
  Filter,
  CheckCircle,
} from 'lucide-react';
import { useBookings } from '../hooks/useBookings';
import { useRooms } from '../hooks/useRooms';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import Pagination from '../components/ui/Pagination';
import Modal from '../components/ui/Modal';

export default function Bookings() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { addToast } = useToast();

  const {
    bookings,
    loading,
    createBooking,
    updateStatus,
    deleteBooking,
  } = useBookings();
  const { rooms } = useRooms();

  // Search & Filter State
  const initialSearch = searchParams.get('search') || '';
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState('all');
  const [roomFilter, setRoomFilter] = useState('all');
  const [paymentFilter, setPaymentFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

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

  // Filter calculations
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // Search
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        b.id.toLowerCase().includes(q) ||
        b.guestName.toLowerCase().includes(q) ||
        b.guestEmail.toLowerCase().includes(q) ||
        b.roomType.toLowerCase().includes(q);

      // Status
      const matchesStatus =
        statusFilter === 'all' ||
        b.bookingStatus.toLowerCase() === statusFilter.toLowerCase();

      // Room Type
      const matchesRoom =
        roomFilter === 'all' ||
        b.roomType.toLowerCase() === roomFilter.toLowerCase();

      // Payment
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
    const headers = ['Booking ID,Guest,Email,Room,CheckIn,CheckOut,Guests,Amount,Payment,Status'];
    const rows = filteredBookings.map((b) =>
      `"${b.id}","${b.guestName}","${b.guestEmail}","${b.roomType}","${b.checkIn}","${b.checkOut}",${b.guests},${b.totalAmount},"${b.paymentStatus}","${b.bookingStatus}"`
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
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    const selRoom = rooms.find((r) => r.id === newForm.roomId) || rooms[0];

    // compute nights
    const d1 = new Date(newForm.checkIn);
    const d2 = new Date(newForm.checkOut);
    const nights = Math.max(1, Math.ceil(Math.abs(d2 - d1) / (1000 * 60 * 60 * 24)));
    const baseRate = selRoom.price;
    const taxes = Math.round(baseRate * nights * 0.18);
    const totalAmount = baseRate * nights + taxes;

    await createBooking({
      ...newForm,
      roomNumber: selRoom.roomNumber,
      roomType: selRoom.type,
      roomId: selRoom.id,
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

  const columns = [
    {
      header: 'Booking ID',
      key: 'id',
      render: (b) => (
        <span className="font-mono text-xs font-semibold text-[#111111]">
          #{b.id}
        </span>
      ),
    },
    {
      header: 'Guest',
      key: 'guestName',
      render: (b) => (
        <div>
          <div className="font-medium text-[#111111]">{b.guestName}</div>
          <div className="text-[11px] text-[#77736C] font-mono">{b.guestEmail}</div>
        </div>
      ),
    },
    {
      header: 'Room',
      key: 'roomType',
      render: (b) => (
        <div>
          <span className="font-serif text-xs text-[#111111]">{b.roomType}</span>
          <span className="block text-[10px] text-[#77736C] font-mono">
            Room #{b.roomNumber}
          </span>
        </div>
      ),
    },
    {
      header: 'Check-in',
      key: 'checkIn',
      render: (b) => <span className="font-mono text-xs">{b.checkIn}</span>,
    },
    {
      header: 'Check-out',
      key: 'checkOut',
      render: (b) => <span className="font-mono text-xs">{b.checkOut}</span>,
    },
    {
      header: 'Guests',
      key: 'guests',
      render: (b) => <span className="font-mono text-xs">{b.guests}</span>,
    },
    {
      header: 'Total',
      key: 'totalAmount',
      render: (b) => (
        <span className="font-mono text-xs font-semibold text-[#111111]">
          ₹ {b.totalAmount.toLocaleString()}
        </span>
      ),
    },
    {
      header: 'Payment',
      key: 'paymentStatus',
      render: (b) => <StatusBadge status={b.paymentStatus} />,
    },
    {
      header: 'Status',
      key: 'bookingStatus',
      render: (b) => <StatusBadge status={b.bookingStatus} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (b) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/admin/bookings/${b.id}`)}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs transition-colors"
            title="View Dossier"
          >
            <Eye size={15} />
          </button>
        </div>
      ),
    },
  ];

  const statusOptions = [
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
            Central Reservation System
          </span>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Bookings Directory
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Manage arrivals, departures, guest dossiers, and payment reconciliations.
          </p>
        </div>

        <div className="flex items-center gap-3">
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

      {/* Bookings Data Table */}
      <div className="admin-card">
        <DataTable
          columns={columns}
          data={paginatedBookings}
          loading={loading}
          onRowClick={(b) => navigate(`/admin/bookings/${b.id}`)}
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
