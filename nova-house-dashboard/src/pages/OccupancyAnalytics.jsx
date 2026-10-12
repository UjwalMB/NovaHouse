import React, { useState, useEffect } from 'react';
import { Percent, Building2, BedDouble, Calendar, CheckCircle2 } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import KpiCard from '../components/ui/KpiCard';
import ChartCard from '../components/ui/ChartCard';
import { fetchOccupancyAnalytics } from '../services/dashboardService';

export default function OccupancyAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchOccupancyAnalytics();
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const curRate = data?.currentOccupancyRate || 50;
  const totalSanctuaries = data?.totalSanctuaries || 6;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--gold-primary)' }}>
          Inventory Management
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 500, letterSpacing: '0.04em', color: '#FFFFFF', marginTop: '4px' }}>
          Occupancy & Capacity Trends
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          7-day occupancy trends and floor-by-floor architectural utilization.
        </p>
      </div>

      {/* KPI Highlights */}
      <div className="kpi-grid">
        <KpiCard
          title="Today's Occupancy Score"
          value={`${curRate}%`}
          subtitle="Of total hotel inventory"
          icon={Percent}
        />
        <KpiCard
          title="Total Sanctuaries"
          value={totalSanctuaries}
          subtitle="Exclusive boutique keys"
          icon={BedDouble}
        />
        <KpiCard
          title="Operational Capacity"
          value="100%"
          subtitle="All suites fully active"
          icon={Building2}
        />
      </div>

      {/* 7-Day Occupancy Trends Curve */}
      <ChartCard
        title="7-Day Forward Occupancy Trends"
        subtitle="Observed room utilization rate based on verified reservations"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data?.occupancyTimeline || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="occGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#22C55E" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#22C55E" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="label" stroke="#8E8A82" fontSize={11} fontFamily="var(--font-mono)" />
            <YAxis stroke="#8E8A82" fontSize={11} fontFamily="var(--font-mono)" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ background: '#18181D', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}
              formatter={(val) => [`${val}% Occupancy`, 'Occupancy Rate']}
            />
            <Area type="monotone" dataKey="rate" stroke="#22C55E" strokeWidth={2} fillOpacity={1} fill="url(#occGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* Floor-by-Floor Distribution */}
      <ChartCard
        title="Floor-by-Floor Sanctuary Occupancy"
        subtitle="Building level occupancy and density tracking"
      >
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data?.floorDistribution || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="floor" stroke="#8E8A82" fontSize={11} fontFamily="var(--font-mono)" />
            <YAxis stroke="#8E8A82" fontSize={11} fontFamily="var(--font-mono)" domain={[0, 100]} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ background: '#18181D', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}
              formatter={(val, name, item) => [`${val}% (${item.payload.occupied}/${item.payload.total} Suites)`, 'Rate']}
            />
            <Bar dataKey="rate" fill="#A58A5C" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
}
