import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Layout
import AdminLayout from '../components/layout/AdminLayout';

// Pages
import Login from '../pages/Login';
import Dashboard from '../pages/Dashboard';
import Bookings from '../pages/Bookings';
import BookingDetails from '../pages/BookingDetails';
import Rooms from '../pages/Rooms';
import Guests from '../pages/Guests';
import Availability from '../pages/Availability';
import Pricing from '../pages/Pricing';
import Payments from '../pages/Payments';
import Dining from '../pages/Dining';
import Experiences from '../pages/Experiences';
import Gallery from '../pages/Gallery';
import Offers from '../pages/Offers';
import Website from '../pages/Website';
import Enquiries from '../pages/Enquiries';
import Reviews from '../pages/Reviews';
import Staff from '../pages/Staff';
import Settings from '../pages/Settings';

// Conceptually protected route wrapper
function ProtectedRoute({ children }: { children: React.ReactElement }) {
  // Demo token check - can be connected to real token check later
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
        <Route index element={<Dashboard />} />
        <Route path="bookings" element={<Bookings />} />
        <Route path="bookings/:id" element={<BookingDetails />} />
        <Route path="rooms" element={<Rooms />} />
        <Route path="guests" element={<Guests />} />
        <Route path="availability" element={<Availability />} />
        <Route path="pricing" element={<Pricing />} />
        <Route path="payments" element={<Payments />} />
        <Route path="dining" element={<Dining />} />
        <Route path="experiences" element={<Experiences />} />
        <Route path="gallery" element={<Gallery />} />
        <Route path="offers" element={<Offers />} />
        <Route path="website" element={<Website />} />
        <Route path="enquiries" element={<Enquiries />} />
        <Route path="reviews" element={<Reviews />} />
        <Route path="staff" element={<Staff />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Catch-all fallback */}
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
