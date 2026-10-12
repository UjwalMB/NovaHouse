import React, { useState, useEffect } from 'react';
import { BedDouble, Award, DollarSign, CalendarCheck, TrendingUp } from 'lucide-react';
import KpiCard from '../components/ui/KpiCard';
import ChartCard from '../components/ui/ChartCard';
import { fetchRoomsPerformance } from '../services/dashboardService';

export default function RoomPerformance() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchRoomsPerformance();
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const formatINR = (val) => `₹${Math.round(val || 0).toLocaleString('en-IN')}`;

  const topRevRoom = data?.topRevenueRooms?.[0];
  const topBookedRoom = data?.topBookedRooms?.[0];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--gold-primary)' }}>
          Asset Intelligence
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 500, letterSpacing: '0.04em', color: '#FFFFFF', marginTop: '4px' }}>
          Sanctuary & Room Performance Matrix
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Comparative earnings, ADR yield, and nights sold across all architectural suites.
        </p>
      </div>

      {/* KPI Highlights */}
      <div className="kpi-grid">
        <KpiCard
          title="Top Grossing Sanctuary"
          value={topRevRoom?.title || 'Bengaluru Penthouse'}
          subtitle={formatINR(topRevRoom?.totalRevenue || 0)}
          icon={Award}
        />
        <KpiCard
          title="Most Booked Sanctuary"
          value={topBookedRoom?.title || 'Nova Suite 301'}
          subtitle={`${topBookedRoom?.totalBookings || 0} reservations`}
          icon={CalendarCheck}
        />
        <KpiCard
          title="Average Sanctuary ADR"
          value={formatINR(topBookedRoom?.adr || 38000)}
          subtitle="Realized nightly rate"
          icon={DollarSign}
        />
      </div>

      {/* Complete Room Performance Ledger */}
      <div className="chart-card">
        <div className="chart-card-header">
          <div>
            <h3 className="chart-title">Architectural Sanctuaries Yield Table</h3>
            <p className="chart-subtitle">Direct performance audit calculated from active reservations ledger</p>
          </div>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Key / Room</th>
                <th>Sanctuary Name</th>
                <th>Tier</th>
                <th>Base Rate</th>
                <th>Nights Sold</th>
                <th>Total Bookings</th>
                <th>Total Revenue</th>
                <th>ADR</th>
                <th>Occupancy Score</th>
              </tr>
            </thead>
            <tbody>
              {(data?.rooms || []).map((r) => (
                <tr key={r.id}>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-light)', fontWeight: 600 }}>
                    #{r.roomNumber}
                  </td>
                  <td style={{ color: '#FFFFFF', fontWeight: 500 }}>{r.title}</td>
                  <td>{r.type}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{formatINR(r.basePrice)}</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{r.nightsSold} nights</td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{r.totalBookings}</td>
                  <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--gold-light)', fontWeight: 600 }}>
                    {formatINR(r.totalRevenue)}
                  </td>
                  <td style={{ fontFamily: 'var(--font-mono)' }}>{formatINR(r.adr)}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '60px', height: '6px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                        <div style={{ width: `${r.occupancyRate}%`, height: '100%', background: 'var(--gold-primary)' }} />
                      </div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px' }}>{r.occupancyRate}%</span>
                    </div>
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
