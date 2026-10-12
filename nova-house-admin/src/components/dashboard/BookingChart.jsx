import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';

export default function BookingChart({ bookings = [] }) {
  const statusData = React.useMemo(() => {
    if (!bookings || bookings.length === 0) {
      return [
        { name: 'Confirmed', value: 6, color: '#A58A5C' },
        { name: 'Checked In', value: 3, color: '#244C66' },
        { name: 'Pending', value: 1, color: '#B47D1C' },
        { name: 'Cancelled', value: 1, color: '#962828' },
      ];
    }
    const counts = {
      'Confirmed': 0,
      'Checked In': 0,
      'Pending': 0,
      'Cancelled': 0,
    };
    bookings.forEach((b) => {
      const s = b.bookingStatus || b.booking_status || 'Pending';
      if (counts[s] !== undefined) {
        counts[s] += 1;
      } else {
        counts[s] = (counts[s] || 0) + 1;
      }
    });
    const items = [
      { name: 'Confirmed', value: counts['Confirmed'] || 0, color: '#A58A5C' },
      { name: 'Checked In', value: counts['Checked In'] || 0, color: '#244C66' },
      { name: 'Pending', value: counts['Pending'] || 0, color: '#B47D1C' },
      { name: 'Cancelled', value: counts['Cancelled'] || 0, color: '#962828' },
    ].filter(item => item.value > 0);

    return items.length > 0 ? items : [{ name: 'Confirmed', value: 1, color: '#A58A5C' }];
  }, [bookings]);

  const total = statusData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
            Status Breakdown
          </span>
          <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
            Bookings Distribution
          </h3>
        </div>
        <span className="font-mono text-xs text-[#77736C]">
          Total: <strong className="text-[#111111]">{total}</strong>
        </span>
      </div>

      <div className="p-6">
        <div className="h-56 w-full relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#111111] text-[#F4F1EB] p-2 rounded-xs border border-white/20 text-xs font-mono shadow-md">
                        <span style={{ color: data.color }}>● {data.name}: </span>
                        <strong>{data.value} bookings</strong> (
                        {Math.round((data.value / total) * 100)}%)
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Pie
                data={statusData}
                innerRadius={55}
                outerRadius={80}
                paddingAngle={3}
                dataKey="value"
              >
                {statusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} stroke="#FFFFFF" strokeWidth={1} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="font-serif text-2xl font-light text-[#111111]">{total}</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-[#77736C]">Total</span>
          </div>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-4 pt-4 border-t border-[#ECE8E0] text-xs font-mono">
          {statusData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <span className="text-[#55514B] truncate">{item.name}</span>
              <strong className="text-[#111111] ml-auto">{item.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
