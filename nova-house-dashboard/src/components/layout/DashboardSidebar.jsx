import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  TrendingUp,
  CalendarCheck,
  Percent,
  BedDouble,
  Users,
  CreditCard,
  ExternalLink,
  LogOut,
  Sparkles,
  ShieldCheck,
} from 'lucide-react';
import { logoutDashboard, getCurrentUser } from '../../services/authService';

const navItems = [
  { label: 'Executive Overview', path: '/', icon: LayoutDashboard },
  { label: 'Revenue Analytics', path: '/revenue', icon: TrendingUp },
  { label: 'Bookings & Volume', path: '/bookings', icon: CalendarCheck },
  { label: 'Occupancy Intelligence', path: '/occupancy', icon: Percent },
  { label: 'Room Performance', path: '/rooms', icon: BedDouble },
  { label: 'Guest Demographics', path: '/guests', icon: Users },
  { label: 'Payment Ledger', path: '/payments', icon: CreditCard },
];

export default function DashboardSidebar({ isOpen, onCloseMobile }) {
  const navigate = useNavigate();
  const user = getCurrentUser();

  const handleLogout = () => {
    logoutDashboard();
    navigate('/login');
  };

  return (
    <aside className={`dashboard-sidebar ${isOpen ? 'open' : ''}`}>
      <div>
        {/* Brand Header */}
        <div className="sidebar-brand-box">
          <div>
            <div className="brand-title">NOVA HOUSE</div>
            <div className="brand-subtitle">EXECUTIVE INTELLIGENCE</div>
          </div>
          <div className="live-pill">
            <span className="live-dot" />
            <span>LIVE</span>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="sidebar-nav">
          <span className="nav-section-label">BUSINESS INTELLIGENCE</span>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                onClick={onCloseMobile}
                className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* External Portals & User Profile */}
      <div className="sidebar-footer">
        <div style={{ padding: '4px 6px', marginBottom: '4px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px',
              height: '28px',
              borderRadius: '2px',
              background: 'var(--gold-subtle)',
              color: 'var(--gold-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '11px',
              fontWeight: 600,
              fontFamily: 'var(--font-mono)'
            }}>
              {user.role ? user.role.slice(0, 2) : 'EX'}
            </div>
            <div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#FFFFFF' }}>{user.name}</div>
              <div style={{ fontSize: '10px', color: 'var(--gold-primary)', fontFamily: 'var(--font-mono)' }}>
                ROLE: {user.role || 'ANALYST'}
              </div>
            </div>
          </div>
        </div>

        {/* Cross-portal Navigation */}
        <a
          href={import.meta.env.VITE_ADMIN_URL || "http://127.0.0.1:5174"}
          target="_blank"
          rel="noopener noreferrer"
          className="portal-switch-link"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={14} style={{ color: 'var(--gold-primary)' }} />
            <span>Admin Operations</span>
          </span>
          <span>↗</span>
        </a>

        <a
          href={import.meta.env.VITE_PUBLIC_WEBSITE_URL || "http://127.0.0.1:5173"}
          target="_blank"
          rel="noopener noreferrer"
          className="portal-switch-link"
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ExternalLink size={14} style={{ color: 'var(--text-muted)' }} />
            <span>Public Website</span>
          </span>
          <span>↗</span>
        </a>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'transparent',
            border: 'none',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            fontSize: '12px',
            fontFamily: 'var(--font-mono)'
          }}
        >
          <LogOut size={13} />
          <span>Exit Intelligence Suite</span>
        </button>
      </div>
    </aside>
  );
}
