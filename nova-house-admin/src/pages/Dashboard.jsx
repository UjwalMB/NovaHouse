import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  Percent,
  IndianRupee,
  BedDouble,
  Mail,
  XCircle,
  Plus,
  CreditCard,
  CheckCircle2,
  Clock,
  RotateCcw,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import RevenueChart from '../components/dashboard/RevenueChart';
import OccupancyChart from '../components/dashboard/OccupancyChart';
import BookingChart from '../components/dashboard/BookingChart';
import RecentBookings from '../components/dashboard/RecentBookings';
import ActivityFeed from '../components/dashboard/ActivityFeed';
import { useBookings } from '../hooks/useBookings';
import { useRooms } from '../hooks/useRooms';
import api from '../services/api';
import { fetchPaymentStats, fetchPayments } from '../services/paymentService';

export default function Dashboard() {
  const navigate = useNavigate();
  const { bookings, loading: bookingsLoading, refresh: refreshBookings } = useBookings();
  const { rooms } = useRooms();
  const [stats, setStats] = useState(null);
  const [paymentStats, setPaymentStats] = useState(null);
  const [payments, setPayments] = useState([]);

  useEffect(() => {
    async function loadLiveStats() {
      try {
        const liveStats = await api.get('/stats');
        if (liveStats) setStats(liveStats);
      } catch (e) {}

      try {
        const livePayStats = await fetchPaymentStats();
        if (livePayStats) setPaymentStats(livePayStats);
      } catch (e) {}

      try {
        const livePayments = await fetchPayments();
        if (Array.isArray(livePayments)) setPayments(livePayments);
      } catch (e) {}
    }

    loadLiveStats();
    const interval = setInterval(loadLiveStats, 4000);
    return () => clearInterval(interval);
  }, []);

  // Compute metrics from database responses and live bookings
  const todayStr = '2026-10-12';
  const totalBookings = stats?.totalBookings ?? bookings.length;
  const todayBookings = stats?.todayBookings ?? bookings.filter(b => b.checkIn === todayStr || (b.createdAt && b.createdAt.startsWith(todayStr))).length;
  const confirmedBookings = stats?.confirmedBookings ?? bookings.filter(b => b.bookingStatus === 'Confirmed' || b.bookingStatus === 'Checked In').length;
  const pendingPayments = stats?.pendingPayments ?? paymentStats?.pendingCount ?? bookings.filter(b => b.paymentStatus === 'PENDING' || b.paymentStatus === 'UNPAID').length;
  
  const todayRevenue = stats?.todayRevenue ?? paymentStats?.todayRevenue ?? 0;
  const totalRevenue = stats?.totalRevenue ?? paymentStats?.totalRevenue ?? 0;
  const refundsTotal = stats?.refundsTotal ?? paymentStats?.refundedTotal ?? 0;

  const totalRoomsCount = rooms.length || 6;
  const occupiedCount = rooms.filter(r => r.status === 'Occupied').length;
  const availableRooms = stats?.availableRooms ?? Math.max(0, totalRoomsCount - occupiedCount);
  const occupancyRate = stats?.occupancyRate ?? (totalRoomsCount > 0 ? Math.round((occupiedCount / totalRoomsCount) * 100) : 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Welcome Greeting Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Executive Operations Dashboard
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl font-light text-[#111111] uppercase tracking-tight">
            Good morning, Admin
          </h2>
          <p className="font-sans text-xs text-[#77736C] mt-1">
            Live database synchronization active across public website and management portal.
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex items-center gap-3 shrink-0">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/admin/availability')}
          >
            Check Calendar
          </Button>
          <Button
            variant="secondary"
            size="sm"
            icon={CreditCard}
            onClick={() => navigate('/admin/payments')}
          >
            Payments
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => navigate('/admin/bookings?new=true')}
          >
            New Reservation
          </Button>
        </div>
      </div>

      {/* KPI Cards: Live Real-Time Database Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-4 gap-4">
        <StatCard
          title="Today's Revenue"
          value={`₹ ${todayRevenue.toLocaleString()}`}
          icon={IndianRupee}
          trend={{ direction: 'up', value: `Total: ₹ ${totalRevenue.toLocaleString()}` }}
          subtitle="verified payments"
          accent
        />

        <StatCard
          title="Today's Bookings"
          value={todayBookings}
          icon={CalendarCheck}
          trend={{ direction: 'up', value: `${totalBookings} total in DB` }}
          subtitle="arrivals & stays"
        />

        <StatCard
          title="Total Bookings"
          value={totalBookings}
          icon={CalendarCheck}
          trend={{ direction: 'up', value: `${confirmedBookings} active` }}
          subtitle="lifetime reservations"
        />

        <StatCard
          title="Confirmed Bookings"
          value={confirmedBookings}
          icon={CheckCircle2}
          trend={{ direction: 'up', value: 'verified' }}
          subtitle="guaranteed stays"
        />

        <StatCard
          title="Pending Payments"
          value={pendingPayments}
          icon={Clock}
          trend={{ direction: 'neutral', value: 'awaiting capture' }}
          subtitle="action required"
        />

        <StatCard
          title="Available Rooms"
          value={`${availableRooms} Suites`}
          icon={BedDouble}
          trend={{ direction: 'neutral', value: `${totalRoomsCount} catalog` }}
          subtitle="open for reservation"
        />

        <StatCard
          title="Occupancy"
          value={`${occupancyRate}%`}
          icon={Percent}
          trend={{ direction: 'up', value: `${totalRoomsCount - availableRooms} booked` }}
          subtitle="current capacity"
        />

        <StatCard
          title="Refunds"
          value={`₹ ${refundsTotal.toLocaleString()}`}
          icon={RotateCcw}
          trend={{ direction: 'down', value: 'processed' }}
          subtitle="net deducted"
        />
      </div>

      {/* Primary Analytics Grid: Revenue (8 cols) + Bookings Distribution (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-8">
          <RevenueChart payments={payments} />
        </div>
        <div className="lg:col-span-4">
          <BookingChart bookings={bookings} />
        </div>
      </div>

      {/* Secondary Operational Grid: Occupancy Bar Chart (5 cols) + Activity Feed (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5">
          <OccupancyChart />
        </div>
        <div className="lg:col-span-7">
          <ActivityFeed />
        </div>
      </div>

      {/* Recent Reservations Table Section */}
      <div>
        <RecentBookings bookings={bookings} onRefresh={refreshBookings} />
      </div>
    </div>
  );
}
