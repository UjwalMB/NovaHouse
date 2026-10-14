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
  BarChart3,
  LogOut,
  LucideIcon,
} from 'lucide-react';
import { logoutStaff } from '../../services/authService';

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
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

interface SidebarProps {
  onCloseMobile?: () => void;
}

export default function Sidebar({ onCloseMobile }: SidebarProps) {
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutStaff();
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
          <span className="live-status-pill">
            <span className="live-status-dot" />
            <span>LIVE</span>
          </span>
        </div>

        {/* Navigation Sections */}
        <nav className="admin-sidebar-nav">
          {navSections.map((section) => (
            <div key={section.title} className="nav-section-group">
              <span className="nav-section-heading">{section.title}</span>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      end={item.path === '/admin'}
                      onClick={onCloseMobile}
                      className={({ isActive }) =>
                        `admin-nav-link ${isActive ? 'admin-nav-link-active' : ''}`
                      }
                    >
                      <Icon size={16} />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* External Portals & Sign Out */}
      <div className="admin-sidebar-footer">
        <a
          href={import.meta.env.VITE_DASHBOARD_URL || 'http://127.0.0.1:5175'}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-external-link text-[#A58A5C] hover:text-[#C5A878]"
        >
          <div className="flex items-center gap-2">
            <BarChart3 size={15} />
            <span>Executive Dashboard</span>
          </div>
          <ExternalLink size={13} />
        </a>

        <a
          href={import.meta.env.VITE_PUBLIC_WEBSITE_URL || 'http://127.0.0.1:5173'}
          target="_blank"
          rel="noopener noreferrer"
          className="admin-external-link"
        >
          <div className="flex items-center gap-2">
            <Globe size={15} />
            <span>Public Website</span>
          </div>
          <ExternalLink size={13} />
        </a>

        <button
          onClick={handleLogout}
          className="admin-logout-btn"
        >
          <LogOut size={14} />
          <span>Exit Admin Portal</span>
        </button>
      </div>
    </aside>
  );
}
