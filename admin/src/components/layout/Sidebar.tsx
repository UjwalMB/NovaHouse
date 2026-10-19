import React, { useState } from 'react';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  BedDouble,
  Users,
  CalendarDays,
  DollarSign,
  Sparkles,
  Wrench,
  UtensilsCrossed,
  Tag,
  Compass,
  FileText,
  MessageSquare,
  Star,
  Mail,
  CreditCard,
  Receipt,
  FileCheck,
  Landmark,
  FileSpreadsheet,
  TrendingUp,
  PieChart,
  BarChart3,
  UserCheck,
  Shield,
  KeyRound,
  History,
  Globe,
  Image as ImageIcon,
  ExternalLink,
  Settings,
  LogOut,
  ChevronDown,
  LucideIcon,
  Circle,
} from 'lucide-react';
import { logoutStaff } from '../../services/authService';

interface SubNavItem {
  label: string;
  path: string;
}

interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  subItems?: SubNavItem[];
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
      { label: 'Rooms', path: '/admin/rooms', icon: BedDouble },
      { label: 'Guests', path: '/admin/guests', icon: Users },
      { label: 'Availability', path: '/admin/availability', icon: CalendarDays },
      { label: 'Pricing', path: '/admin/pricing', icon: DollarSign },
    ],
  },
  {
    title: 'HOTEL OPERATIONS',
    items: [
      { label: 'Housekeeping', path: '/admin/housekeeping', icon: Sparkles },
      { label: 'Maintenance', path: '/admin/maintenance', icon: Wrench },
      {
        label: 'Dining',
        path: '/admin/dining',
        icon: UtensilsCrossed,
        subItems: [
          { label: 'Tables', path: '/admin/dining/tables' },
          { label: 'Orders', path: '/admin/dining/orders' },
          { label: 'Menu', path: '/admin/dining/menu' },
          { label: 'Room Service', path: '/admin/dining/room-service' },
        ],
      },
      { label: 'Experiences', path: '/admin/experiences', icon: Compass },
      { label: 'Offers', path: '/admin/offers', icon: Tag },
    ],
  },
  {
    title: 'GUEST EXPERIENCE',
    items: [
      { label: 'Guest Documents', path: '/admin/guest-documents', icon: FileText },
      { label: 'Guest Communication', path: '/admin/guest-communication', icon: MessageSquare },
      { label: 'Reviews', path: '/admin/reviews', icon: Star },
      { label: 'Enquiries', path: '/admin/enquiries', icon: Mail },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      { label: 'Payments', path: '/admin/payments', icon: CreditCard },
      { label: 'Invoices', path: '/admin/invoices', icon: Receipt },
      { label: 'Receipts', path: '/admin/receipts', icon: FileCheck },
      { label: 'Settlements', path: '/admin/settlements', icon: Landmark },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { label: 'Reports', path: '/admin/reports', icon: FileSpreadsheet },
      { label: 'Revenue Analytics', path: '/admin/analytics/revenue', icon: TrendingUp },
      { label: 'Occupancy Analytics', path: '/admin/analytics/occupancy', icon: PieChart },
      { label: 'Booking Analytics', path: '/admin/analytics/bookings', icon: BarChart3 },
      { label: 'Guest Analytics', path: '/admin/analytics/guests', icon: UserCheck },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { label: 'Staff', path: '/admin/staff', icon: Shield },
      { label: 'Roles & Permissions', path: '/admin/roles-permissions', icon: KeyRound },
      { label: 'Activity Logs', path: '/admin/activity-logs', icon: History },
    ],
  },
  {
    title: 'WEBSITE',
    items: [
      { label: 'Website CMS', path: '/admin/website', icon: Globe },
      { label: 'Gallery', path: '/admin/gallery', icon: ImageIcon },
      { label: 'Public Website', path: '/admin/public-website', icon: ExternalLink },
    ],
  },
  {
    title: 'SYSTEM',
    items: [
      { label: 'Settings', path: '/admin/settings', icon: Settings },
    ],
  },
];

interface SidebarProps {
  onCloseMobile?: () => void;
}

export default function Sidebar({ onCloseMobile }: SidebarProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [diningExpanded, setDiningExpanded] = useState(
    location.pathname.startsWith('/admin/dining')
  );

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
                  const isDining = item.label === 'Dining';
                  const isDiningActive = location.pathname.startsWith('/admin/dining');

                  if (isDining) {
                    return (
                      <div key={item.path} className="flex flex-col">
                        <button
                          type="button"
                          onClick={() => {
                            setDiningExpanded(!diningExpanded);
                            if (!diningExpanded && location.pathname !== '/admin/dining/tables') {
                              navigate('/admin/dining/tables');
                              if (onCloseMobile) onCloseMobile();
                            }
                          }}
                          className={`admin-nav-link justify-between w-full text-left ${
                            isDiningActive ? 'admin-nav-link-active' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon size={16} />
                            <span>Dining</span>
                          </div>
                          <ChevronDown
                            size={14}
                            className={`transition-transform duration-200 text-[#77736C] ${
                              diningExpanded ? 'rotate-180' : ''
                            }`}
                          />
                        </button>

                        {/* Dining Submenu */}
                        {diningExpanded && (
                          <div className="ml-5 pl-3 border-l border-[#2B2B2B] my-1 space-y-0.5 animate-in fade-in duration-200">
                            {item.subItems?.map((sub) => {
                              const isSubActive = location.pathname === sub.path;
                              return (
                                <NavLink
                                  key={sub.path}
                                  to={sub.path}
                                  onClick={onCloseMobile}
                                  className={`flex items-center gap-2 py-1.5 px-2 rounded-xs text-[11px] font-medium transition-colors ${
                                    isSubActive
                                      ? 'text-[#C5A878] font-semibold bg-[#1F1F1F]'
                                      : 'text-[#9E9990] hover:text-[#FFFFFF] hover:bg-[#181818]'
                                  }`}
                                >
                                  <Circle
                                    size={5}
                                    className={isSubActive ? 'fill-[#C5A878] text-[#C5A878]' : 'text-transparent'}
                                  />
                                  <span>{sub.label}</span>
                                </NavLink>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  }

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
