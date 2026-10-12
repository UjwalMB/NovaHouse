import React from 'react';
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
import { occupancyChartData } from '../../data/mockData';

export default function OccupancyChart() {
  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
            Capacity Metrics
          </span>
          <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
            Weekly Occupancy Rate
          </h3>
        </div>
        <span className="font-mono text-xs text-[#235C33] bg-[#EDF7F0] px-2 py-0.5 rounded-xs border border-[#C8E8D1]">
          Avg. 83%
        </span>
      </div>

      <div className="p-6">
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={occupancyChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2DDD5" opacity={0.6} />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#77736C', fontSize: 11, fontFamily: 'monospace' }}
              />
              <YAxis
                domain={[0, 100]}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#77736C', fontSize: 11, fontFamily: 'monospace' }}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#111111] text-[#F4F1EB] p-2.5 rounded-xs border border-white/20 shadow-lg text-xs font-mono">
                        <span className="text-[#A58A5C]">{label}: </span>
                        <strong className="text-white">{payload[0].value}% Occupied</strong>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="rate" radius={[2, 2, 0, 0]}>
                {occupancyChartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.rate >= 90 ? '#A58A5C' : '#2D2D2D'}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
