import React, { useState, useEffect } from 'react';
import {
  UserCheck,
  TrendingUp,
  DollarSign,
  Heart,
  Globe,
  Download,
  Award,
  Users,
} from 'lucide-react';
import StatCard from '../components/ui/StatCard';
import Button from '../components/ui/Button';
import { useToast } from '../components/ui/Toast';
import { getGuestMetrics, GuestMetrics } from '../services/analyticsService';

export default function GuestAnalytics() {
  const { addToast } = useToast();
  const [metrics, setMetrics] = useState<GuestMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const data = await getGuestMetrics();
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
    const content = 'Tier,Count,Revenue\n' + metrics.spendTiers.map((t) => `"${t.tier}",${t.guestCount},${t.revenue}`).join('\n');
    const encoded = encodeURI('data:text/csv;charset=utf-8,' + content);
    const link = document.createElement('a');
    link.setAttribute('href', encoded);
    link.setAttribute('download', `Nova_House_Guest_Analytics.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Guest analytics exported.');
  };

  if (!metrics) {
    return <div className="p-8 text-center text-xs text-[#77736C]">Loading guest intelligence...</div>;
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            CRM Patron Intelligence & Lifetime Value
          </span>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Guest Analytics
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Insights on patron retention, spend tiers, bespoke sanctuary preferences, and global demographics.
          </p>
        </div>

        <Button variant="secondary" size="sm" icon={Download} onClick={handleExport}>
          Export Guest Dataset
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard
          title="Total Registered Patrons"
          value={metrics.totalGuests}
          icon={Users}
          trend={{ direction: 'up', value: 'High Net-Worth CRM' }}
          subtitle="lifetime profiles"
          accent
        />

        <StatCard
          title="Repeat Stay Rate"
          value={`${metrics.repeatStayRate}%`}
          icon={Award}
          trend={{ direction: 'up', value: '16 Returning Patrons' }}
          subtitle="brand loyalty"
        />

        <StatCard
          title="Avg Lifetime Spend"
          value={`₹ ${metrics.averageSpendPerGuest.toLocaleString()}`}
          icon={DollarSign}
          trend={{ direction: 'up', value: 'Per unique guest' }}
          subtitle="high yield"
        />

        <StatCard
          title="New Patrons (Oct)"
          value={metrics.newGuestsCount}
          icon={UserCheck}
          trend={{ direction: 'up', value: 'Recent acquisitions' }}
          subtitle="first time visitors"
        />
      </div>

      {/* Grid: Spend Tiers & Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Spend Tiers */}
        <div className="admin-card p-6 space-y-4">
          <div className="border-b border-[#ECE8E0] pb-3">
            <span className="font-mono text-[10px] uppercase text-[#A58A5C] tracking-widest block">Wealth Tiers</span>
            <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
              Guest Lifetime Spending Distribution
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {metrics.spendTiers.map((tier, i) => (
              <div key={i} className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-1.5">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#111111]">{tier.tier}</span>
                  <span className="font-bold text-emerald-800">₹ {tier.revenue.toLocaleString()}</span>
                </div>
                <div className="text-[11px] text-[#77736C]">
                  {tier.guestCount} High-Value Patrons
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Preferences */}
        <div className="admin-card p-6 space-y-4">
          <div className="border-b border-[#ECE8E0] pb-3">
            <span className="font-mono text-[10px] uppercase text-[#A58A5C] tracking-widest block">Sanctuary Profiles</span>
            <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
              Top In-Suite & Concierge Preferences
            </h3>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {metrics.topPreferences.map((pref, i) => (
              <div key={i} className="flex justify-between items-center p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                <span className="text-[#111111] font-medium flex items-center gap-2">
                  <Heart size={12} className="text-[#A58A5C]" />
                  <span>{pref.preference}</span>
                </span>
                <span className="px-2 py-0.5 bg-[#111111] text-white text-[10px] font-bold rounded-xs">
                  {pref.count} Patrons
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Geographic Origin Distribution */}
      <div className="admin-card p-6 space-y-4">
        <div className="border-b border-[#ECE8E0] pb-3">
          <span className="font-mono text-[10px] uppercase text-[#A58A5C] tracking-widest block">Global Demographics</span>
          <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
            Patron Country / City of Origin
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono text-xs">
          {metrics.originDistribution.map((origin, i) => (
            <div key={i} className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2">
              <span className="text-[#77736C] text-[10px] uppercase block flex items-center gap-1.5">
                <Globe size={11} className="text-[#A58A5C]" />
                <span>{origin.country}</span>
              </span>
              <div className="flex justify-between items-baseline">
                <span className="text-xl font-bold text-[#111111]">{origin.count}</span>
                <span className="text-xs font-semibold text-[#A58A5C]">{origin.percentage}%</span>
              </div>
              <div className="w-full h-1.5 bg-white border border-[#ECE8E0] rounded-xs overflow-hidden">
                <div className="h-full bg-[#111111]" style={{ width: `${origin.percentage}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
