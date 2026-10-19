import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import {
  Menu,
  Bell,
  Search,
  User,
  Settings,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { logoutStaff } from '../../services/authService';

const routeTitleMap: Record<string, string> = {
  '/admin': 'Dashboard Overview',
  '/admin/bookings': 'Reservation Management',
  '/admin/rooms': 'Room & Suite Inventory',
  '/admin/guests': 'Guest Profiles & CRM (Guest 360)',
  '/admin/availability': 'Room Availability Calendar',
  '/admin/pricing': 'Tariff & Seasonal Pricing',
  '/admin/housekeeping': 'Housekeeping Operations & Cleanliness',
  '/admin/maintenance': 'Engineering & Maintenance Requests',
  '/admin/dining': 'EMBER Dining Operations',
  '/admin/dining/tables': 'Restaurant Tables Layout',
  '/admin/dining/orders': 'Dining Service Orders',
  '/admin/dining/menu': 'Menu & Recipe Management',
  '/admin/dining/room-service': 'In-Room Dining Orders',
  '/admin/experiences': 'Curated Experiences & Wellness',
  '/admin/offers': 'Promotions & Special Packages',
  '/admin/guest-documents': 'Secure Guest Documents & KYC',
  '/admin/guest-communication': 'Guest Communications & Automated Alerts',
  '/admin/reviews': 'Guest Reviews & Testimonials',
  '/admin/enquiries': 'Guest Enquiries & Direct Leads',
  '/admin/payments': 'Payment Ledger & Gateway Transactions',
  '/admin/invoices': 'Tax Invoices & Billing Folios',
  '/admin/receipts': 'Payment Receipts & Slips',
  '/admin/settlements': 'Gateway Settlements & Reconciliation',
  '/admin/reports': 'Property Management Reports & Exports',
  '/admin/analytics/revenue': 'Revenue Performance Analytics',
  '/admin/analytics/occupancy': 'Occupancy & Capacity Analytics',
  '/admin/analytics/bookings': 'Reservation Trends & Source Analytics',
  '/admin/analytics/guests': 'Guest Demographics & Spend Analytics',
  '/admin/staff': 'Staff Directory & Shifts',
  '/admin/roles-permissions': 'Roles & Permissions Access Matrix',
  '/admin/activity-logs': 'System Activity & Security Audit Trail',
  '/admin/website': 'Website Content Management (CMS)',
  '/admin/gallery': 'Media Archive & Photo Assets',
  '/admin/settings': 'Hotel PMS Master Settings',
};

interface TopbarProps {
  onToggleMobile: () => void;
}

export default function Topbar({ onToggleMobile }: TopbarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const dropdownRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);

  // Determine current page title
  const currentTitle =
    routeTitleMap[location.pathname] ||
    (location.pathname.startsWith('/admin/bookings/') ? 'Booking Dossier' : 'Hotel Admin Portal');

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProfileDropdownOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logoutStaff();
    navigate('/admin/login');
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    navigate(`/admin/bookings?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <header className="admin-topbar">
      {/* Left: Mobile Toggle & Page Title */}
      <div className="flex items-center gap-4">
        <button
          onClick={onToggleMobile}
          className="lg:hidden p-2 text-[#111111] hover:bg-[#F4F1EB] rounded-xs"
          aria-label="Open sidebar"
        >
          <Menu size={20} />
        </button>

        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
            Nova House Management
          </span>
          <h1 className="font-serif text-lg sm:text-xl font-light text-[#111111] leading-tight">
            {currentTitle}
          </h1>
        </div>
      </div>

      {/* Right Actions: Global Search, Notification Bell & Admin Profile */}
      <div className="flex items-center gap-4 sm:gap-6">
        {/* Global Search Bar */}
        <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
          <Search size={14} className="absolute left-3 text-[#77736C]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search bookings, guests, rooms..."
            className="w-60 lg:w-72 pl-9 pr-4 py-2 bg-[#FAF8F5] border border-[#E2DDD5] rounded-xs text-xs font-sans text-[#111111] focus:bg-[#FFFFFF] focus:border-[#111111] outline-none transition-all"
          />
        </form>

        {/* Notifications Icon & Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="w-9 h-9 flex items-center justify-center rounded-xs border border-[#E2DDD5] bg-[#FFFFFF] text-[#111111] hover:bg-[#F4F1EB] transition-colors relative"
            aria-label="Notifications"
          >
            <Bell size={16} />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#A58A5C]" />
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-[#FFFFFF] border border-[#E2DDD5] rounded-xs shadow-lg p-4 z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between pb-2 mb-3 border-b border-[#ECE8E0]">
                <span className="font-mono text-xs uppercase tracking-wider font-semibold text-[#111111]">
                  Alerts & Updates
                </span>
                <span className="text-[10px] font-mono text-[#A58A5C]">3 New</span>
              </div>
              <div className="space-y-3 text-xs">
                <div className="p-2 bg-[#FAF8F5] rounded-xs border border-[#ECE8E0]">
                  <div className="font-medium text-[#111111]">New VIP Booking</div>
                  <div className="text-[#77736C] text-[11px] mt-0.5">
                    Eleanor Vance booked The Bengaluru Penthouse #501
                  </div>
                  <div className="font-mono text-[9px] text-[#A58A5C] mt-1">15 mins ago</div>
                </div>
                <div className="p-2 bg-[#FAF8F5] rounded-xs border border-[#ECE8E0]">
                  <div className="font-medium text-[#111111]">Corporate Enquiry</div>
                  <div className="text-[#77736C] text-[11px] mt-0.5">
                    Siddharth Varma requested Glasshouse private buyout info
                  </div>
                  <div className="font-mono text-[9px] text-[#A58A5C] mt-1">1 hour ago</div>
                </div>
                <div className="p-2 bg-[#FAF8F5] rounded-xs border border-[#ECE8E0]">
                  <div className="font-medium text-[#111111]">Room Inspection Completed</div>
                  <div className="text-[#77736C] text-[11px] mt-0.5">
                    Deluxe Courtyard #101 marked available by Housekeeping
                  </div>
                  <div className="font-mono text-[9px] text-[#A58A5C] mt-1">2 hours ago</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Card & Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
            className="flex items-center gap-3 p-1.5 pr-2.5 rounded-xs border border-[#E2DDD5] bg-[#FFFFFF] hover:bg-[#F4F1EB] transition-colors"
          >
            <div className="w-8 h-8 rounded-xs bg-[#111111] text-[#A58A5C] flex items-center justify-center font-serif text-sm font-semibold">
              NH
            </div>
            <div className="text-left hidden sm:block">
              <div className="font-sans text-xs font-semibold text-[#111111] leading-none">
                Admin
              </div>
              <div className="font-mono text-[10px] text-[#77736C] mt-0.5 leading-none">
                Hotel Manager
              </div>
            </div>
            <ChevronDown size={13} className="text-[#77736C]" />
          </button>

          {profileDropdownOpen && (
            <div className="absolute right-0 mt-2 w-52 bg-[#FFFFFF] border border-[#E2DDD5] rounded-xs shadow-lg py-1.5 z-50 animate-in fade-in zoom-in-95 duration-150 text-xs">
              <div className="px-3 py-2 border-b border-[#ECE8E0] sm:hidden">
                <div className="font-semibold text-[#111111]">Admin</div>
                <div className="text-[10px] font-mono text-[#77736C]">Hotel Manager</div>
              </div>

              <Link
                to="/admin/staff"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-[#55514B] hover:bg-[#F4F1EB] hover:text-[#111111] transition-colors"
              >
                <User size={14} className="text-[#A58A5C]" />
                <span>My Profile</span>
              </Link>

              <Link
                to="/admin/settings"
                onClick={() => setProfileDropdownOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-[#55514B] hover:bg-[#F4F1EB] hover:text-[#111111] transition-colors"
              >
                <Settings size={14} className="text-[#A58A5C]" />
                <span>Portal Settings</span>
              </Link>

              <div className="border-t border-[#ECE8E0] my-1" />

              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-[#962828] hover:bg-[#FDF0F0] transition-colors text-left"
              >
                <LogOut size={14} />
                <span>Logout Portal</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
