import React, { useState, useEffect } from 'react';
import {
  CalendarCheck,
  TrendingUp,
  Percent,
  Clock,
  Compass,
  Download,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import Button from '../components/ui/Button';
import StatCard from '../components/ui/StatCard';
import { useToast } from '../components/ui/Toast';
import { getBookingMetrics, BookingMetrics } from '../services/analyticsService';

export default function BookingAnalytics() {
  const { addToast } = useToast();
  const [metrics, setMetrics] = useState<BookingMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getBookingMetrics();
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
    const rows = metrics.monthlyVolume.map((m) => `${m.month},${m.bookings},${m.cancelled}`);
    const csvContent = 'data:text/csv;charset=utf-8,Month,Total Bookings,Cancelled\n' + rows.join('\n');
    const encoded = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Nova_House_Booking_Analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Booking analytics exported.');
  };

  if (!metrics) {
    return <div className="p-8 text-center text-xs text-[#77736C]">Loading booking intelligence...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Channel Acquisition & Reservation Velocity
          </span>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Booking Analytics
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Analyze reservation lead times, direct website vs agent acquisition channels, and cancellation ratios.
          </p>
        </div>

        <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>
          Export Booking Data
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Bookings"
          value={metrics.totalBookings}
          icon={CalendarCheck}
          trend={{ direction: 'up', value: 'Steady growth' }}
          subtitle="lifetime catalog"
          accent
        />

        <StatCard
          title="Confirmed & Active"
          value={metrics.confirmedBookings + metrics.checkedInBookings}
          icon={CheckCircle2}
          trend={{ direction: 'up', value: 'Guaranteed stays' }}
          subtitle="verified reservations"
        />

        <StatCard
          title="Avg Length of Stay"
          value={`${metrics.averageLengthOfStay} Nights`}
          icon={Clock}
          trend={{ direction: 'up', value: 'Luxury residency' }}
          subtitle="per booking folio"
        />

        <StatCard
          title="Cancellations"
          value={metrics.cancelledBookings}
          icon={XCircle}
          trend={{ direction: 'down', value: 'Low churn (7.6%)' }}
          subtitle="released inventory"
        />
      </div>

      {/* Monthly Booking Velocity Chart */}
      <div className="admin-card">
        <div className="admin-card-header flex justify-between items-center">
          <div>
            <span className="font-mono text-[10px] uppercase text-[#A58A5C] tracking-widest block">Monthly Pacing</span>
            <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
              Reservation Volume & Cancellation Pacing
            </h3>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#111111]" /> Confirmed Stays</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Cancelled</span>
          </div>
        </div>

        <div className="p-4 sm:p-6">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.monthlyVolume} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DDD5" />
                <XAxis dataKey="month" stroke="#77736C" tick={{ fill: '#77736C', fontSize: 11 }} />
                <YAxis stroke="#77736C" tick={{ fill: '#77736C', fontSize: 10 }} />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-[#111111] text-white p-3 rounded-xs font-mono text-xs shadow-lg space-y-1">
                          <div className="font-bold text-[#A58A5C]">{d.month} 2026</div>
                          <div>Total Bookings: {d.bookings}</div>
                          <div>Cancelled: {d.cancelled}</div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="bookings" fill="#111111" radius={[2, 2, 0, 0]} />
                <Bar dataKey="cancelled" fill="#E05252" radius={[2, 2, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Booking Sources Distribution */}
      <div className="admin-card p-6 space-y-4">
        <div className="border-b border-[#ECE8E0] pb-3">
          <span className="font-mono text-[10px] uppercase text-[#A58A5C] tracking-widest block">Acquisition Channels</span>
          <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
            Reservations by Booking Source
          </h3>
        </div>

        <div className="space-y-3 font-mono text-xs">
          {metrics.bookingSources.map((src, i) => (
            <div key={i} className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-1.5">
              <div className="flex justify-between items-center">
                <span className="font-medium text-[#111111]">{src.source}</span>
                <span className="font-bold text-[#111111]">{src.count} Bookings ({src.percentage}%)</span>
              </div>
              <div className="w-full h-1.5 bg-white border border-[#ECE8E0] rounded-xs overflow-hidden">
                <div className="h-full bg-[#A58A5C]" style={{ width: `${src.percentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
