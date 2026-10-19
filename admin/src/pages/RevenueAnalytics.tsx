import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  IndianRupee,
  Calendar,
  CreditCard,
  UtensilsCrossed,
  Sparkles,
  ArrowUpRight,
  PieChart as PieIcon,
  Download,
} from 'lucide-react';
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
  Cell,
} from 'recharts';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import { useToast } from '../components/ui/Toast';
import { getRevenueMetrics, RevenueMetrics } from '../services/analyticsService';

export default function RevenueAnalytics() {
  const { addToast } = useToast();
  const [metrics, setMetrics] = useState<RevenueMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'6m' | '1y'>('6m');

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getRevenueMetrics();
        setMetrics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [timeframe]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `₹ ${(val / 100000).toFixed(1)} L`;
    if (val >= 1000) return `₹ ${(val / 1000).toFixed(0)}k`;
    return `₹ ${val}`;
  };

  const handleExport = () => {
    if (!metrics) return;
    const rows = metrics.revenueTrend.map((r) => `${r.month},${r.rooms},${r.dining},${r.spa},${r.total}`);
    const csvContent = 'data:text/csv;charset=utf-8,Month,Suites,Dining,Spa,Total\n' + rows.join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Nova_House_Revenue_Analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Revenue analytics data exported.');
  };

  if (!metrics) {
    return <div className="p-8 text-center text-xs text-[#77736C]">Loading revenue intelligence...</div>;
  }

  const roomColors = ['#A58A5C', '#111111', '#55514B', '#8C827A'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Yield Optimization & Financial Analytics
          </span>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Revenue Analytics
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Track gross receipts, ADR, RevPAR, dining contribution, and payment gateway distribution.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>
            Export Dataset
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Net Revenue"
          value={`₹ ${metrics.totalRevenue.toLocaleString()}`}
          icon={IndianRupee}
          trend={{ direction: 'up', value: '+14.2% YoY' }}
          subtitle="gross hotel collections"
          accent
        />

        <StatCard
          title="Average Daily Rate (ADR)"
          value={`₹ ${metrics.averageDailyRate.toLocaleString()}`}
          icon={TrendingUp}
          trend={{ direction: 'up', value: 'premium tier' }}
          subtitle="per sold room night"
        />

        <StatCard
          title="RevPAR"
          value={`₹ ${metrics.revenuePerAvailableRoom.toLocaleString()}`}
          icon={TrendingUp}
          trend={{ direction: 'up', value: 'high efficiency' }}
          subtitle="revenue per avail room"
        />

        <StatCard
          title="Dining Contribution"
          value={`₹ ${metrics.diningRevenue.toLocaleString()}`}
          icon={UtensilsCrossed}
          trend={{ direction: 'up', value: 'EMBER & In-Room' }}
          subtitle="F&B share"
        />
      </div>

      {/* Revenue Trend Chart */}
      <div className="admin-card">
        <div className="admin-card-header flex justify-between items-center">
          <div>
            <span className="font-mono text-[10px] uppercase text-[#A58A5C] tracking-widest block">Yield Trend</span>
            <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
              Monthly Revenue Performance by Stream
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#111111]" /> Total Volume</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#A58A5C]" /> Suites</span>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.revenueTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="totalGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#111111" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#111111" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="suitesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A58A5C" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#A58A5C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DDD5" />
                <XAxis dataKey="month" stroke="#77736C" tick={{ fill: '#77736C', fontSize: 11 }} />
                <YAxis stroke="#77736C" tick={{ fill: '#77736C', fontSize: 10 }} tickFormatter={formatCurrency} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-[#111111] text-white p-3 rounded-xs font-mono text-xs space-y-1 shadow-lg">
                          <div className="font-bold text-[#A58A5C]">{data.month} 2026</div>
                          <div>Suites: ₹ {data.rooms.toLocaleString()}</div>
                          <div>Dining: ₹ {data.dining.toLocaleString()}</div>
                          <div>Spa: ₹ {data.spa.toLocaleString()}</div>
                          <div className="font-bold border-t border-white/20 pt-1">Total: ₹ {data.total.toLocaleString()}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area type="monotone" dataKey="total" stroke="#111111" strokeWidth={2} fillOpacity={1} fill="url(#totalGrad)" />
                <Area type="monotone" dataKey="rooms" stroke="#A58A5C" strokeWidth={2} fillOpacity={1} fill="url(#suitesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Revenue by Room Type & Revenue by Payment Method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Room Type */}
        <div className="admin-card p-6 space-y-4">
          <div className="border-b border-[#ECE8E0] pb-3">
            <span className="font-mono text-[10px] uppercase text-[#A58A5C] tracking-widest block">Inventory Breakdown</span>
            <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
              Revenue by Sanctuary Category
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {metrics.byRoomType.map((r, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-[#111111]">{r.type}</span>
                  <span className="font-bold text-[#111111]">₹ {r.revenue.toLocaleString()} ({r.percentage}%)</span>
                </div>
                <div className="w-full h-2 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs overflow-hidden">
                  <div
                    className="h-full bg-[#A58A5C]"
                    style={{ width: `${r.percentage}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Revenue by Payment Method */}
        <div className="admin-card p-6 space-y-4">
          <div className="border-b border-[#ECE8E0] pb-3">
            <span className="font-mono text-[10px] uppercase text-[#A58A5C] tracking-widest block">Treasury Channels</span>
            <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
              Collections by Payment Method
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {metrics.byPaymentMethod.map((m, i) => (
              <div key={i} className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs flex items-center justify-between">
                <div>
                  <span className="font-medium text-[#111111] block">{m.method}</span>
                  <span className="text-[10px] text-[#77736C]">{m.percentage}% of captured transactions</span>
                </div>
                <span className="font-bold text-[#111111]">₹ {m.amount.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
