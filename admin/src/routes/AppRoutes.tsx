import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout
import AdminLayout from '../components/layout/AdminLayout';

// Pages - Main
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Bookings from '../pages/Bookings';
import BookingDetails from '../pages/BookingDetails';
import Rooms from '../pages/Rooms';
import Guests from '../pages/Guests';
import Availability from '../pages/Availability';
import Pricing from '../pages/Pricing';

// Pages - Hotel Operations
import Housekeeping from '../pages/Housekeeping';
import Maintenance from '../pages/Maintenance';
import Dining from '../pages/Dining';
import Experiences from '../pages/Experiences';
import Offers from '../pages/Offers';

// Pages - Guest Experience
import GuestDocuments from '../pages/GuestDocuments';
import GuestCommunication from '../pages/GuestCommunication';
import Reviews from '../pages/Reviews';
import Enquiries from '../pages/Enquiries';

// Pages - Finance
import Payments from '../pages/Payments';
import Invoices from '../pages/Invoices';
import Receipts from '../pages/Receipts';
import Settlements from '../pages/Settlements';

// Pages - Analytics
import Reports from '../pages/Reports';
import RevenueAnalytics from '../pages/RevenueAnalytics';
import OccupancyAnalytics from '../pages/OccupancyAnalytics';
import BookingAnalytics from '../pages/BookingAnalytics';
import GuestAnalytics from '../pages/GuestAnalytics';

// Pages - Management
import Staff from '../pages/Staff';
import RolesPermissions from '../pages/RolesPermissions';
import ActivityLogs from '../pages/ActivityLogs';

// Pages - Website & System
import Website from '../pages/Website';
import Gallery from '../pages/Gallery';
import PublicWebsite from '../pages/PublicWebsite';
import Settings from '../pages/Settings';

// Conceptually protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const isLoggedIn = localStorage.getItem('nova_admin_logged_in') !== 'false';
  if (!isLoggedIn) {
    return <Navigate to="/admin/login" replace />;
  }
  return children;
}

export default function AppRoutes() {
  return (
    <Routes>
      {/* Root redirect to /admin */}
      <Route path="/" element={<Navigate to="/admin" replace />} />

      {/* Public Admin Login Route */}
      <Route path="/admin/login" element={<Login />} />

      {/* Protected Admin Portal Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        {/* MAIN */}
        <Route index element={<Dashboard />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/:id" element={<BookingDetails />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="guests" element={<Guests />} />
        <Route path="availability" element={<Availability />} />
        <Route path="pricing" element={<Pricing />} />

        {/* HOTEL OPERATIONS */}
        <Route path="housekeeping" element={<Housekeeping />} />
        <Route path="maintenance" element={<Maintenance />} />
        <Route path="dining" element={<Dining />} />
        <Route path="dining/tables" element={<Dining />} />
        <Route path="dining/orders" element={<Dining />} />
        <Route path="dining/menu" element={<Dining />} />
        <Route path="dining/room-service" element={<Dining />} />
        <Route path="experiences" element={<Experiences />} />
        <Route path="offers" element={<Offers />} />

        {/* GUEST EXPERIENCE */}
        <Route path="guest-documents" element={<GuestDocuments />} />
        <Route path="guest-communication" element={<GuestCommunication />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="enquiries" element={<Enquiries />} />

        {/* FINANCE */}
        <Route path="payments" element={<Payments />} />
        <Route path="finance/payments" element={<Payments />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="finance/invoices" element={<Invoices />} />
        <Route path="receipts" element={<Receipts />} />
        <Route path="finance/receipts" element={<Receipts />} />
        <Route path="settlements" element={<Settlements />} />
        <Route path="finance/settlements" element={<Settlements />} />

        {/* ANALYTICS */}
        <Route path="reports" element={<Reports />} />
        <Route path="analytics/revenue" element={<RevenueAnalytics />} />
        <Route path="revenue-analytics" element={<RevenueAnalytics />} />
        <Route path="analytics/occupancy" element={<OccupancyAnalytics />} />
        <Route path="occupancy-analytics" element={<OccupancyAnalytics />} />
        <Route path="analytics/bookings" element={<BookingAnalytics />} />
        <Route path="booking-analytics" element={<BookingAnalytics />} />
        <Route path="analytics/guests" element={<GuestAnalytics />} />
        <Route path="guest-analytics" element={<GuestAnalytics />} />

        {/* MANAGEMENT */}
        <Route path="staff" element={<Staff />} />
        <Route path="roles-permissions" element={<RolesPermissions />} />
        <Route path="activity-logs" element={<ActivityLogs />} />

        {/* WEBSITE */}
        <Route path="website" element={<Website />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="public-website" element={<PublicWebsite />} />

        {/* SYSTEM */}
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
