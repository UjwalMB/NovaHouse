import React, { useState, useEffect } from 'react';
import { CalendarCheck, Users, Clock, Compass, ShieldAlert } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import KpiCard from '../components/ui/KpiCard';
import ChartCard from '../components/ui/ChartCard';
import { fetchBookingsAnalytics } from '../services/dashboardService';

const STATUS_COLORS = {
  Confirmed: '#22C55E',
  'Checked In': '#38BDF8',
  Pending: '#F59E0B',
  Cancelled: '#EF4444',
  'Checked Out': '#94A3B8',
};

const CHANNEL_COLORS = ['#A58A5C', '#38BDF8', '#818CF8', '#F59E0B'];

export default function BookingsAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchBookingsAnalytics();
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalBks = data?.totalBookings || 0;
  const confirmedCount = (data?.statusDistribution || []).find(s => s.status === 'Confirmed')?.count || 0;
  const cancelledCount = (data?.statusDistribution || []).find(s => s.status === 'Cancelled')?.count || 0;
  const cancelRate = totalBks > 0 ? Math.round((cancelledCount / totalBks) * 100) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--gold-primary)' }}>
          Reservation Metrics
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 500, letterSpacing: '0.04em', color: '#FFFFFF', marginTop: '4px' }}>
          Booking Volume & Intake Dynamics
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Booking pace, reservation duration patterns, and channel distribution breakdown.
        </p>
      </div>

      {/* KPI Highlights */}
      <div className="kpi-grid">
        <KpiCard
          title="All-Time Reservations"
          value={totalBks}
          subtitle="Processed in database"
          icon={CalendarCheck}
        />
        <KpiCard
          title="Confirmed Pace"
          value={confirmedCount}
          subtitle="Active guaranteed bookings"
          icon={Users}
        />
        <KpiCard
          title="Cancellation Rate"
          value={`${cancelRate}%`}
          subtitle={`${cancelledCount} cancellations recorded`}
          icon={ShieldAlert}
        />
      </div>

      {/* 2 Column: Status Mix & Length of Stay Breakdown */}
      <div className="charts-grid-equal">
        <ChartCard
          title="Booking Status Mix"
          subtitle="Proportion of reservations by operational state"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data?.statusDistribution || []}
                dataKey="count"
                nameKey="status"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={55}
                paddingAngle={4}
              >
                {(data?.statusDistribution || []).map((entry, index) => (
                  <Cell key={`st-${index}`} fill={STATUS_COLORS[entry.status] || '#A58A5C'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#18181D', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}
                formatter={(val, name) => [`${val} Bookings`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Length of Stay (Nights)"
          subtitle="Guest stay duration preference brackets"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.lengthOfStay || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="bucket" stroke="#8E8A82" fontSize={11} fontFamily="var(--font-mono)" />
              <YAxis stroke="#8E8A82" fontSize={11} fontFamily="var(--font-mono)" />
              <Tooltip
                contentStyle={{ background: '#18181D', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}
                formatter={(val) => [`${val} Bookings`, 'Count']}
              />
              <Bar dataKey="count" fill="#38BDF8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Channel Distribution */}
      <ChartCard
        title="Acquisition Channel Distribution"
        subtitle="Reservations origin (Direct Website vs Concierge / Agent)"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data?.sourceDistribution || []} layout="vertical" margin={{ top: 10, right: 20, left: 80, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis type="number" stroke="#8E8A82" fontSize={11} fontFamily="var(--font-mono)" />
            <YAxis type="category" dataKey="source" stroke="#8E8A82" fontSize={11} fontFamily="var(--font-sans)" />
            <Tooltip
              contentStyle={{ background: '#18181D', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}
            />
            <Bar dataKey="count" fill="#A58A5C" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
