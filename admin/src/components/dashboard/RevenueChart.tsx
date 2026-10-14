import React, { useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import { revenueChartData } from '../../data/mockData';
import { PaymentRecord } from '../../types';

interface RevenueChartProps {
  payments?: PaymentRecord[];
}

export default function RevenueChart({ payments = [] }: RevenueChartProps) {
  const [activeFilter, setActiveFilter] = useState<'7 Days' | '30 Days' | '90 Days' | '1 Year'>('7 Days');

  const data = React.useMemo(() => {
    if (payments && payments.length > 0 && activeFilter === '7 Days') {
      const paid = payments.filter((p) => p.status === 'PAID');
      const todayRev = paid
        .filter((p) => (p.createdAt && p.createdAt.startsWith('2026-10-12')) || (p.created_at && p.created_at.startsWith('2026-10-12')))
        .reduce((sum, p) => sum + (p.amount || 0), 0);

      const base = [
        { name: 'Mon (06 Oct)', revenue: 198000, bookings: 4 },
        { name: 'Tue (07 Oct)', revenue: 215000, bookings: 5 },
        { name: 'Wed (08 Oct)', revenue: 245000, bookings: 6 },
        { name: 'Thu (09 Oct)', revenue: 220000, bookings: 5 },
        { name: 'Fri (10 Oct)', revenue: 285000, bookings: 7 },
        { name: 'Sat (11 Oct)', revenue: 340000, bookings: 8 },
        { name: 'Today (12 Oct)', revenue: Math.max(todayRev, 196470), bookings: paid.length },
      ];
      return base;
    }
    return (revenueChartData as any)[activeFilter] || (revenueChartData as any)['7 Days'];
  }, [activeFilter, payments]);

  const formatCurrency = (val: number) => {
    if (val >= 10000000) return `₹ ${(val / 10000000).toFixed(1)} Cr`;
    if (val >= 100000) return `₹ ${(val / 100000).toFixed(1)} L`;
    if (val >= 1000) return `₹ ${(val / 1000).toFixed(0)}k`;
    return `₹ ${val}`;
  };

  return (
    <div className="admin-card">
      <div className="admin-card-header flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
            Financial Analytics
          </span>
          <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
            Revenue Overview
          </h3>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-[#ECE8E0] rounded-xs border border-[#E2DDD5]">
          {(['7 Days', '30 Days', '90 Days', '1 Year'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`px-2.5 py-1 font-mono text-[11px] uppercase tracking-wider rounded-xs transition-colors ${
                activeFilter === filter
                  ? 'bg-[#111111] text-[#F4F1EB] font-medium'
                  : 'text-[#77736C] hover:text-[#111111]'
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="goldGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#A58A5C" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#A58A5C" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DDD5" opacity={0.6} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#77736C', fontSize: 11, fontFamily: 'monospace' }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#77736C', fontSize: 11, fontFamily: 'monospace' }}
                tickFormatter={formatCurrency}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#111111] text-[#F4F1EB] p-3 rounded-xs border border-white/20 shadow-lg text-xs font-mono">
                        <span className="text-[#A58A5C] block mb-1">{label}</span>
                        <div className="space-y-0.5">
                          <div>
                            Revenue:{' '}
                            <strong className="text-white">
                              ₹ {Number(payload[0].value).toLocaleString()}
                            </strong>
                          </div>
                          {payload[0].payload.bookings && (
                            <div className="text-[#9E9990]">
                              Bookings: {payload[0].payload.bookings}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#A58A5C"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#goldGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
