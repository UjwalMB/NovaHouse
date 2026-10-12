import React, { useState, useEffect } from 'react';
import { IndianRupee, TrendingUp, CreditCard, RotateCcw, DollarSign } from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
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
import { fetchRevenueAnalytics } from '../services/dashboardService';

const METHOD_COLORS = ['#A58A5C', '#38BDF8', '#22C55E', '#F59E0B', '#818CF8'];

export default function RevenueAnalytics() {
  const [data, setData] = useState(null);
  const [days, setDays] = useState(14);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchRevenueAnalytics(days);
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [days]);

  const formatINR = (val) => `₹${Math.round(val || 0).toLocaleString('en-IN')}`;

  const totalRev = data?.totalRevenue || 0;
  const grossRev = (data?.dailyTimeline || []).reduce((acc, curr) => acc + (curr.gross || 0), 0);
  const totalRefunds = (data?.dailyTimeline || []).reduce((acc, curr) => acc + (curr.refunds || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
        <div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--gold-primary)' }}>
            Financial Intelligence
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 500, letterSpacing: '0.04em', color: '#FFFFFF', marginTop: '4px' }}>
            Revenue & Capital Analytics
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
            Audited cash collections, gateway settlement volume, and room category yield.
          </p>
        </div>

        {/* Time Period Filter */}
        <div style={{ display: 'flex', gap: '6px', background: 'var(--bg-card)', padding: '4px', border: '1px solid var(--border-light)', borderRadius: '4px' }}>
          {[7, 14, 30].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d)}
              style={{
                padding: '6px 12px',
                background: days === d ? 'var(--gold-subtle)' : 'transparent',
                border: 'none',
                color: days === d ? 'var(--gold-light)' : 'var(--text-muted)',
                fontFamily: 'var(--font-mono)',
                fontSize: '11px',
                cursor: 'pointer',
                borderRadius: '2px',
                fontWeight: days === d ? 600 : 400
              }}
            >
              {d} Days
            </button>
          ))}
        </div>
      </div>

      {/* KPI Highlights */}
      <div className="kpi-grid">
        <KpiCard
          title="Period Net Revenue"
          value={formatINR(totalRev)}
          subtitle="Net collections"
          icon={IndianRupee}
        />
        <KpiCard
          title="Gross Billed Volume"
          value={formatINR(grossRev)}
          subtitle="Before refunds/adjustments"
          icon={DollarSign}
        />
        <KpiCard
          title="Total Refunds Deducted"
          value={formatINR(totalRefunds)}
          subtitle="Settled customer reversals"
          icon={RotateCcw}
        />
      </div>

      {/* Daily Revenue Chart */}
      <ChartCard
        title={`Daily Revenue Curve (${days} Day Timeline)`}
        subtitle="Daily settlement amounts tracked by timestamp"
      >
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data?.dailyTimeline || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id="netRevGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#A58A5C" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#A58A5C" stopOpacity={0.0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
            <XAxis dataKey="label" stroke="#8E8A82" fontSize={11} fontFamily="var(--font-mono)" />
            <YAxis stroke="#8E8A82" fontSize={11} fontFamily="var(--font-mono)" tickFormatter={(v) => `₹${v/1000}k`} />
            <Tooltip
              contentStyle={{ background: '#18181D', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}
              formatter={(val) => [formatINR(val), 'Net Collection']}
            />
            <Area type="monotone" dataKey="revenue" stroke="#A58A5C" strokeWidth={2} fillOpacity={1} fill="url(#netRevGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2 Column: Payment Method Share & Revenue by Room Category */}
      <div className="charts-grid-equal">
        <ChartCard
          title="Payment Gateway Channels"
          subtitle="Method distribution by transactional volume"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data?.paymentMethods || []}
                dataKey="amount"
                nameKey="method"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={55}
                paddingAngle={4}
              >
                {(data?.paymentMethods || []).map((entry, index) => (
                  <Cell key={`m-${index}`} fill={METHOD_COLORS[index % METHOD_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#18181D', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}
                formatter={(val, name) => [formatINR(val), name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="Revenue by Sanctuary Category"
          subtitle="Comparative earnings per room tier"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.revenueByRoomType || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="roomType" stroke="#8E8A82" fontSize={10} fontFamily="var(--font-sans)" />
              <YAxis stroke="#8E8A82" fontSize={11} fontFamily="var(--font-mono)" tickFormatter={(v) => `₹${v/1000}k`} />
              <Tooltip
                contentStyle={{ background: '#18181D', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}
                formatter={(val) => [formatINR(val), 'Revenue']}
              />
              <Bar dataKey="revenue" fill="#A58A5C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
