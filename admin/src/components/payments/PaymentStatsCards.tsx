import React from 'react';
import {
  IndianRupee,
  CheckCircle2,
  Clock,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import StatCard from '../ui/StatCard';

interface PaymentStatsCardsProps {
  stats?: {
    todayRevenue: number;
    totalRevenue: number;
    successfulCount: number;
    pendingCount: number;
    refundedTotal: number;
  } | any | null;
}

export default function PaymentStatsCards({ stats }: PaymentStatsCardsProps) {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      <StatCard
        title="Today's Captured"
        value={`₹ ${stats.todayRevenue.toLocaleString()}`}
        icon={IndianRupee}
        trend={{ direction: 'up', value: '+22.4%' }}
        subtitle="verified settlements"
        accent
      />

      <StatCard
        title="Total Net Revenue"
        value={`₹ ${stats.totalRevenue.toLocaleString()}`}
        icon={TrendingUp}
        trend={{ direction: 'up', value: '100% genuine' }}
        subtitle="successful transactions"
      />

      <StatCard
        title="Paid Transactions"
        value={stats.successfulCount}
        icon={CheckCircle2}
        trend={{ direction: 'neutral', value: '0 chargebacks' }}
        subtitle="signature verified"
      />

      <StatCard
        title="Pending Orders"
        value={stats.pendingCount}
        icon={Clock}
        trend={{ direction: 'neutral', value: 'awaiting payment' }}
        subtitle="open checkout sessions"
      />

      <StatCard
        title="Total Refunded"
        value={`₹ ${stats.refundedTotal.toLocaleString()}`}
        icon={RotateCcw}
        trend={{ direction: 'neutral', value: 'reconciled' }}
        subtitle="guest cancellations"
      />
    </div>
  );
}
