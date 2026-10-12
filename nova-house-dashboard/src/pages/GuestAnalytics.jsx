import React, { useState, useEffect } from 'react';
import { Users, Globe, Crown, Award, UserCheck } from 'lucide-react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import KpiCard from '../components/ui/KpiCard';
import ChartCard from '../components/ui/ChartCard';
import { fetchGuestsAnalytics } from '../services/dashboardService';

const TIER_COLORS = {
  Member: '#8E8A82',
  Silver: '#94A3B8',
  Gold: '#A58A5C',
  Platinum: '#38BDF8',
};

export default function GuestAnalytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetchGuestsAnalytics();
        setData(res);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const totalGsts = data?.totalGuests || 13;
  const repeatRate = data?.repeatRate || 15;
  const repeatCount = data?.repeatGuestsCount || 2;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div style={{ borderBottom: '1px solid var(--border-light)', paddingBottom: '20px' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.2em', color: 'var(--gold-primary)' }}>
          Patron Intelligence
        </span>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 500, letterSpacing: '0.04em', color: '#FFFFFF', marginTop: '4px' }}>
          Guest Demographics & Retention
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Geographical visitor distribution, VIP loyalty brackets, and repeat guest stay retention.
        </p>
      </div>

      {/* KPI Highlights */}
      <div className="kpi-grid">
        <KpiCard
          title="Total Registered Patrons"
          value={totalGsts}
          subtitle="Profiles in guest ledger"
          icon={Users}
        />
        <KpiCard
          title="Repeat Guest Rate"
          value={`${repeatRate}%`}
          subtitle={`${repeatCount} patrons with 2+ stays`}
          icon={UserCheck}
        />
        <KpiCard
          title="Top Loyalty Status"
          value="Gold Patron"
          subtitle="Highest spending tier"
          icon={Crown}
        />
      </div>

      {/* 2 Column: Country Distribution & VIP Tier Mix */}
      <div className="charts-grid-equal">
        <ChartCard
          title="Geographical Origin Distribution"
          subtitle="Guest breakdown by citizenship / country"
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data?.countryDistribution || []} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis dataKey="country" stroke="#8E8A82" fontSize={11} fontFamily="var(--font-sans)" />
              <YAxis stroke="#8E8A82" fontSize={11} fontFamily="var(--font-mono)" />
              <Tooltip
                contentStyle={{ background: '#18181D', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}
                formatter={(val, name, item) => [`${val} Guests (${item.payload.share}%)`, 'Count']}
              />
              <Bar dataKey="count" fill="#A58A5C" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard
          title="VIP Loyalty Tier Mix"
          subtitle="Patron classification across loyalty programs"
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data?.vipTierDistribution || []}
                dataKey="count"
                nameKey="tier"
                cx="50%"
                cy="50%"
                outerRadius={90}
                innerRadius={55}
                paddingAngle={4}
              >
                {(data?.vipTierDistribution || []).map((entry, index) => (
                  <Cell key={`tier-${index}`} fill={TIER_COLORS[entry.tier] || '#A58A5C'} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ background: '#18181D', border: '1px solid rgba(255, 255, 255, 0.15)', borderRadius: '4px', fontFamily: 'var(--font-mono)' }}
                formatter={(val, name) => [`${val} Patrons`, name]}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}
