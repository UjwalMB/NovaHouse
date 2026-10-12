import { useState, useEffect, useCallback } from 'react';
import {
  getBookings,
  createBooking,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
} from '../services/bookingService';

export function useBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBookings();
      setBookings(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();

    // Auto-refresh when user focuses or returns to admin portal tab
    const handleFocus = () => {
      fetchBookings();
    };
    window.addEventListener('focus', handleFocus);

    // Periodically poll backend so new website bookings appear in real time
    const pollTimer = setInterval(() => {
      fetchBookings();
    }, 3500);

    return () => {
      window.removeEventListener('focus', handleFocus);
      clearInterval(pollTimer);
    };
  }, [fetchBookings]);

  const handleCreate = async (bookingData) => {
    const created = await createBooking(bookingData);
    await fetchBookings();
    return created;
  };

  const handleUpdate = async (id, updatedFields) => {
    const updated = await updateBooking(id, updatedFields);
    await fetchBookings();
    return updated;
  };

  const handleStatusChange = async (id, status) => {
    const updated = await updateBookingStatus(id, status);
    await fetchBookings();
    return updated;
  };

  const handleCancel = async (id) => {
    const cancelled = await cancelBooking(id);
    await fetchBookings();
    return cancelled;
  };

  const handleDelete = async (id) => {
    await deleteBooking(id);
    await fetchBookings();
  };

  return {
    bookings,
    loading,
    error,
    refresh: fetchBookings,
    createBooking: handleCreate,
    updateBooking: handleUpdate,
    updateStatus: handleStatusChange,
    cancelBooking: handleCancel,
    deleteBooking: handleDelete,
  };
}
