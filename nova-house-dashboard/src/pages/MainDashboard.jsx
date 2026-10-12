import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  CalendarCheck,
  Percent,
  Users,
  BedDouble,
  CreditCard,
  AlertCircle,
  IndianRupee,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import KpiCard from '../components/ui/KpiCard';
import ChartCard from '../components/ui/ChartCard';
import { fetchOverviewMetrics, fetchRevenueAnalytics, fetchBookingsAnalytics } from '../services/dashboardService';

const STATUS_COLORS = {
  Confirmed: '#22C55E',
  'Checked In': '#38BDF8',
  Pending: '#F59E0B',
  Cancelled: '#EF4444',
  'Checked Out': '#94A3B8',
};

export default function MainDashboard() {
  const [overview, setOverview] = useState(null);
  const [revenueData, setRevenueData] = useState(null);
  const [bookingsData, setBookingsData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [ov, rev, bks] = await Promise.all([
          fetchOverviewMetrics(),
          fetchRevenueAnalytics(14),
          fetchBookingsAnalytics(),
        ]);
        setOverview(ov);
        setRevenueData(rev);
        setBookingsData(bks);
      } catch (err) {
        console.error('Failed to load live metrics:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const formatINR = (val) => {
    if (val === undefined || val === null) return '₹0';
    return `₹${Math.round(val).toLocaleString('en-IN')}`;
  };

  const netRev = overview?.total_revenue ?? overview?.totalRevenue ?? 0;
  const todayRev = overview?.today_revenue ?? overview?.todayRevenue ?? 0;
  const totalBks = overview?.total_bookings ?? overview?.totalBookings ?? 0;
  const occRate = overview?.occupancy_rate ?? overview?.occupancyRate ?? 0;
  const availRooms = overview?.available_rooms ?? overview?.availableRooms ?? 0;
  const occRooms = overview?.occupied_rooms ?? overview?.occupiedRooms ?? 0;
  const totalGsts = overview?.total_guests ?? overview?.totalGuests ?? 0;
  const succPayments = overview?.successful_payments ?? overview?.successfulPayments ?? 0;
  const pendPayments = overview?.pending_payments ?? overview?.pendingPayments ?? 0;
  const adr = overview?.adr ?? 0;
  const revpar = overview?.revpar ?? 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Title & Live Status */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--gold-primary)' }}>
            Live Database Analytics Platform
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 500, letterSpacing: '0.04em', color: '#FFFFFF', marginTop: '4px' }}>
            Executive Performance Overview
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Live metrics aggregated directly from PostgreSQL database records & active customer bookings.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          <div style={{ padding: '6px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '2px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)' }}>ADR: </span>
            <span style={{ color: 'var(--gold-light)', fontWeight: 600 }}>{formatINR(adr)}</span>
          </div>
          <div style={{ padding: '6px 12px', background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: '2px', fontFamily: 'var(--font-mono)', fontSize: '11px' }}>
            <span style={{ color: 'var(--text-muted)' }}>RevPAR: </span>
            <span style={{ color: 'var(--gold-light)', fontWeight: 600 }}>{formatINR(revpar)}</span>
          </div>
        </div>
      </div>

      {/* Main KPI Grid */}
      <div className="kpi-grid">
        <KpiCard
          title="Total Net Revenue"
          value={formatINR(netRev)}
          subtitle="Net after refunds"
          icon={IndianRupee}
          trend={todayRev > 0 ? `+${formatINR(todayRev)}` : null}
          trendLabel="today"
        />
        <KpiCard
          title="Total Bookings"
          value={totalBks}
          subtitle={`${overview?.confirmed_bookings || 0} Confirmed`}
          icon={CalendarCheck}
          trend={`+${overview?.today_bookings || 0}`}
          trendLabel="today"
        />
        <KpiCard
          title="Occupancy Rate"
          value={`${occRate}%`}
          subtitle={`${occRooms} of 6 suites occupied`}
          icon={Percent}
          trend={`${availRooms} available`}
        />
        <KpiCard
          title="Patron Guests"
          value={totalGsts}
          subtitle="Registered hotel patrons"
          icon={Users}
        />
        <KpiCard
          title="Successful Payments"
          value={succPayments}
          subtitle={`${pendPayments} pending settlement`}
          icon={CreditCard}
        />
      </div>

      {/* Booking Status Sub-bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
        gap: '12px',
        padding: '16px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-light)',
        borderRadius: '6px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={16} style={{ color: '#22C55E' }} />
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Confirmed</div>
            <div style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{overview?.confirmed_bookings ?? 0}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <Clock size={16} style={{ color: '#F59E0B' }} />
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pending</div>
            <div style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{overview?.pending_bookings ?? 0}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <CheckCircle2 size={16} style={{ color: '#38BDF8' }} />
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Completed</div>
            <div style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{overview?.completed_bookings ?? 0}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <XCircle size={16} style={{ color: '#EF4444' }} />
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cancelled</div>
            <div style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{overview?.cancelled_bookings ?? 0}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <IndianRupee size={16} style={{ color: '#A58A5C' }} />
          <div>
            <div style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Total Refunds</div>
            <div style={{ fontSize: '16px', fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatINR(overview?.refunds_total ?? 0)}</div>
          </div>
        </div>
      </div>

      {/* Main Charts: Revenue Timeline & Booking Status Distribution */}
      <div className="charts-grid-2col">
        <ChartCard
          title="Revenue Trajectory (Past 14 Days)"
          subtitle="Gross daily collection minus refunds"
        >
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={revenueData?.dailyTimeline || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A58A5C" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#A58A5C" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="label" stroke="#8E8A82" fontSize={11} fontFamily="var(--font-mono)" />
              <YAxis stroke="#8E8A82" fontSize={11} fontFamily="var(--font-mono)" tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip
                contentStyle={{ background: '#18181D', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}
                formatter={(val) => [formatINR(val), 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#A58A5C" strokeWidth={2} fillOpacity={1} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Booking Status Mix"
          subtitle="Live distribution of reservations"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={bookingsData?.statusDistribution || []}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
              >
                {(bookingsData?.statusDistribution || []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.status] || '#A58A5C'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#18181D', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}
                formatter={(val, name) => [`${val} Bookings`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Recent Reservations Feed */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <h3 className="chart-title">Recent Reservations Feed</h3>
            <p className="chart-subtitle">Direct live records from the hotel reservation ledger</p>
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Reservation ID</th>
                <th>Guest Patron</th>
                <th>Sanctuary Suite</th>
                <th>Check-in / Check-out</th>
                <th>Total Volume</th>
                <th>Payment</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(bookingsData?.recentBookings || []).slice(0, 7).map((b) => (
                <tr key={b.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-light)' }}>{b.id}</td>
                  <td style={{ fontWeight: 500, color: '#FFFFFF' }}>{b.guestName}</td>
                  <td>{b.roomType} ({b.roomNumber})</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{b.checkIn} → {b.checkOut}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>{formatINR(b.totalAmount)}</td>
                  <td>
                    <span className={`badge-status ${b.paymentStatus === 'PAID' ? 'badge-paid' : 'badge-pending'}`}>
                      {b.paymentStatus}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '11px',
                      color: STATUS_COLORS[b.bookingStatus] || '#FFFFFF'
                    }}>
                      {b.bookingStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
