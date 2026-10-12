import React, { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from '../components/layout/DashboardLayout';
import MainDashboard from '../pages/MainDashboard';
import RevenueAnalytics from '../pages/RevenueAnalytics';
import BookingsAnalytics from '../pages/BookingsAnalytics';
import OccupancyAnalytics from '../pages/OccupancyAnalytics';
import RoomPerformance from '../pages/RoomPerformance';
import GuestAnalytics from '../pages/GuestAnalytics';
import PaymentAnalytics from '../pages/PaymentAnalytics';
import DashboardLogin from '../pages/DashboardLogin';
import { isUserAuthenticated } from '../services/authService';

function ProtectedRoute({ children }) {
  // Check if authenticated
  const auth = isUserAuthenticated();
  if (!auth) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

export default function AppRoutes() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(new Date().toISOString());

  const handleRefresh = () => {
    setIsRefreshing(true);
    setRefreshTrigger((prev) => prev + 1);
    setLastUpdated(new Date().toISOString());
    setTimeout(() => setIsRefreshing(false), 600);
  };

  return (
    <Routes>
      <Route path="/login" element={<DashboardLogin />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout
              onRefresh={handleRefresh}
              isRefreshing={isRefreshing}
              lastUpdated={lastUpdated}
            />
          </ProtectedRoute>
        }
      >
        <Route index element={<MainDashboard key={refreshTrigger} />} />
        <Route path="revenue" element={<RevenueAnalytics key={refreshTrigger} />} />
        <Route path="bookings" element={<BookingsAnalytics key={refreshTrigger} />} />
        <Route path="occupancy" element={<OccupancyAnalytics key={refreshTrigger} />} />
        <Route path="rooms" element={<RoomPerformance key={refreshTrigger} />} />
        <Route path="guests" element={<GuestAnalytics key={refreshTrigger} />} />
        <Route path="payments" element={<PaymentAnalytics key={refreshTrigger} />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
