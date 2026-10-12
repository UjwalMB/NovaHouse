import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  Users,
  CalendarDays,
  DollarSign,
  UtensilsCrossed,
  Sparkles,
  Image as ImageIcon,
  Tag,
  Globe,
  Mail,
  Star,
  ShieldCheck,
  Settings,
  CreditCard,
  ExternalLink,
  LogOut,
} from 'lucide-react';

const navSections = [
  {
    title: 'MAIN',
    items: [
      { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
      { label: 'Bookings', path: '/admin/bookings', icon: CalendarCheck },
      { label: 'Payments', path: '/admin/payments', icon: CreditCard },
      { label: 'Rooms', path: '/admin/rooms', icon: BedDouble },
      { label: 'Guests', path: '/admin/guests', icon: Users },
      { label: 'Availability', path: '/admin/availability', icon: CalendarDays },
      { label: 'Pricing', path: '/admin/pricing', icon: DollarSign },
    ],
  },
  {
    title: 'HOTEL',
    items: [
      { label: 'Dining', path: '/admin/dining', icon: UtensilsCrossed },
      { label: 'Experiences', path: '/admin/experiences', icon: Sparkles },
      { label: 'Gallery', path: '/admin/gallery', icon: ImageIcon },
      { label: 'Offers', path: '/admin/offers', icon: Tag },
    ],
  },
  {
    title: 'WEBSITE',
    items: [
      { label: 'Website CMS', path: '/admin/website', icon: Globe },
      { label: 'Enquiries', path: '/admin/enquiries', icon: Mail },
      { label: 'Reviews', path: '/admin/reviews', icon: Star },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { label: 'Staff', path: '/admin/staff', icon: ShieldCheck },
      { label: 'Settings', path: '/admin/settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ onCloseMobile }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('nova_admin_logged_in');
    navigate('/admin/login');
  };

  return (
    <aside className="admin-sidebar-container">
      {/* Brand Header */}
      <div>
        <div className="admin-sidebar-header">
          <div>
            <div className="admin-sidebar-brand">NOVA HOUSE</div>
            <div className="admin-sidebar-tagline">HOTEL ADMIN</div>
          </div>
          <span className="live-dot-indicator" />
        </div>

        {/* Navigation Groups */}
        <nav className="admin-sidebar-nav">
          {navSections.map((sec) => (
            <div key={sec.title} className="admin-nav-section">
              <span className="admin-nav-section-title">{sec.title}</span>
              <div className="admin-nav-links-wrap">
                {sec.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/admin'}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `admin-nav-link ${isActive ? 'active' : ''}`
                      }
                    >
                      <Icon size={16} className="admin-nav-icon" />
                      <span className="admin-nav-text">{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Bottom Footer Actions */}
      <div className="admin-sidebar-footer">
        <a
          href={import.meta.env.VITE_PUBLIC_WEBSITE_URL || "http://127.0.0.1:5173"}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-footer-link"
        >
          <span className="admin-footer-left">
            <ExternalLink size={14} className="admin-footer-gold-icon" />
            <span>View Public Website</span>
          </span>
          <span className="admin-footer-arrow">↗</span>
        </a>

        <button onClick={handleLogout} className="admin-footer-logout">
          <LogOut size={14} />
          <span>Logout Portal</span>
        </button>
      </div>
    </aside>
  );
}
