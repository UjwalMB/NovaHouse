import React from 'react';
import { Menu, RefreshCw, Database, Clock } from 'lucide-react';

export default function DashboardHeader({ onToggleSidebar, onRefresh, isRefreshing, lastUpdated }) {
  const formatTime = (iso) => {
    if (!iso) return 'Just now';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    } catch (e) {
      return 'Live';
    }
  };

  return (
    <header className="dashboard-header">
      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
          className="lg:hidden"
        >
          <Menu size={20} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Database size={15} style={{ color: 'var(--gold-primary)' }} />
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
            Connected: Supabase PostgreSQL (Shared Cluster)
          </span>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
          <Clock size={13} />
          <span>Sync: {formatTime(lastUpdated)}</span>
        </div>

        <button
          onClick={onRefresh}
          className="btn-secondary"
          disabled={isRefreshing}
        >
          <RefreshCw size={13} style={{ animation: isRefreshing ? 'spin 1s linear infinite' : 'none' }} />
          <span>Refresh Data</span>
        </button>
      </div>
    </header>
  );
}
