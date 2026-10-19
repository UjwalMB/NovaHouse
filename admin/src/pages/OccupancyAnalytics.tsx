import React, { useState, useEffect } from 'react';
import {
  Percent,
  BedDouble,
  Calendar,
  Building,
  TrendingUp,
  Download,
} from 'lucide-react';
import {
  ResponsiveContainer,
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
import { getOccupancyMetrics, OccupancyMetrics } from '../services/analyticsService';

export default function OccupancyAnalytics() {
  const { addToast } = useToast();
  const [metrics, setMetrics] = useState<OccupancyMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getOccupancyMetrics();
        setMetrics(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleExport = () => {
    if (!metrics) return;
    const rows = metrics.occupancyTrend.map((o) => `${o.date},${o.rate}%,${o.booked},${o.total}`);
    const csvContent = 'data:text/csv;charset=utf-8,Date,Rate,Booked,Total\n' + rows.join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Nova_House_Occupancy_Analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Occupancy dataset exported.');
  };

  if (!metrics) {
    return <div className="p-8 text-center text-xs text-[#77736C]">Loading occupancy intelligence...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Capacity & Room Rack Analytics
          </span>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Occupancy Analytics
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Monitor daily room rack utilization, category capacity, maintenance downtime, and stay rhythms.
          </p>
        </div>

        <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>
          Export Occupancy Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Current Occupancy"
          value={`${metrics.currentOccupancyRate}%`}
          icon={Percent}
          trend={{ direction: 'up', value: 'High Sanctuary Demand' }}
          subtitle="live property rack"
          accent
        />

        <StatCard
          title="Occupied Suites"
          value={`${metrics.occupiedRooms} Keys`}
          icon={BedDouble}
          trend={{ direction: 'neutral', value: 'in-house guests' }}
          subtitle="active lodging"
        />

        <StatCard
          title="Available Suites"
          value={`${metrics.availableRooms} Keys`}
          icon={BedDouble}
          trend={{ direction: 'neutral', value: 'open for booking' }}
          subtitle="ready inventory"
        />

        <StatCard
          title="Maintenance Holds"
          value={`${metrics.maintenanceRooms} Keys`}
          icon={Building}
          trend={{ direction: 'down', value: 'offline engineering' }}
          subtitle="blocked from sale"
        />
      </div>

      {/* Daily Occupancy Bar Chart */}
      <div className="admin-card">
        <div className="admin-card-header flex justify-between items-center">
          <div>
            <span className="font-mono text-[10px] uppercase text-[#A58A5C] tracking-widest block">Daily Matrix</span>
            <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
              7-Day Occupancy Trend (%)
            </h3>
          </div>
          <span className="text-xs font-mono text-[#77736C]">Target: 80% Baseline</span>
        </div>

        <div className="p-4 sm:p-6">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.occupancyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DDD5" />
                <XAxis dataKey="date" stroke="#77736C" tick={{ fill: '#77736C', fontSize: 11 }} />
                <YAxis stroke="#77736C" domain={[0, 100]} tick={{ fill: '#77736C', fontSize: 10 }} unit="%" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#111111] text-white p-3 rounded-xs font-mono text-xs shadow-lg space-y-1">
                          <div className="font-bold text-[#A58A5C]">{d.date}</div>
                          <div>Occupancy: {d.rate}%</div>
                          <div>Rooms Booked: {d.booked} of {d.total}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="rate" radius={[2, 2, 0, 0]}>
                  {metrics.occupancyTrend.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.rate === 100 ? '#111111' : entry.rate >= 80 ? '#A58A5C' : '#D4AF37'}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="admin-card p-6 space-y-4">
        <div className="border-b border-[#ECE8E0] pb-3">
          <span className="font-mono text-[10px] uppercase text-[#A58A5C] tracking-widest block">Collection Rate</span>
          <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
            Occupancy by Room Category
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono text-xs">
          {metrics.byRoomCategory.map((cat, i) => (
            <div key={i} className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2">
              <div className="flex justify-between items-center">
                <span className="font-semibold text-sm text-[#111111]">{cat.category}</span>
                <span className="font-bold text-emerald-800 text-sm">{cat.rate}%</span>
              </div>
              <div className="w-full h-2 bg-white border border-[#ECE8E0] rounded-xs overflow-hidden">
                <div className="h-full bg-[#A58A5C]" style={{ width: `${cat.rate}%` }} />
              </div>
              <div className="flex justify-between text-[#77736C] text-[11px] pt-1">
                <span>Occupied: {cat.occupied} Suites</span>
                <span>Total: {cat.total} Suites</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
