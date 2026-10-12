import api from './api';

export async function fetchOverviewMetrics() {
  return await api.get('/dashboard/overview');
}

export async function fetchRevenueAnalytics(days = 14) {
  return await api.get('/dashboard/revenue', { days });
}

export async function fetchBookingsAnalytics() {
  return await api.get('/dashboard/bookings');
}

export async function fetchOccupancyAnalytics() {
  return await api.get('/dashboard/occupancy');
}

export async function fetchRoomsPerformance() {
  return await api.get('/dashboard/rooms');
}

export async function fetchGuestsAnalytics() {
  return await api.get('/dashboard/guests');
}

export async function fetchPaymentsAnalytics() {
  return await api.get('/dashboard/payments');
}
