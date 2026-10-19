import { useState, useEffect, useCallback } from 'react';
import {
  getBookings,
  createBooking,
  updateBooking,
  updateBookingStatus,
  cancelBooking,
  deleteBooking,
} from '../services/bookingService';
import { subscribeToTable } from '../services/supabase';
import { Booking } from '../types';

export function useBookings() {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getBookings();
      setBookings(data);
      setError(null);
    } catch (err: any) {
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

    // Cross-tab / cross-window instant notification via BroadcastChannel
    let bc: BroadcastChannel | null = null;
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        bc = new BroadcastChannel('nova_house_sync');
        bc.onmessage = () => {
          fetchBookings();
        };
      }
    } catch (e) {}

    // Storage event listener for local state sync
    const handleStorage = (e: StorageEvent) => {
      if (!e.key || e.key.includes('bookings') || e.key.includes('nova_admin')) {
        fetchBookings();
      }
    };
    window.addEventListener('storage', handleStorage);

    // Instant Supabase Realtime WebSocket subscription for new/updated bookings
    const unsubscribe = subscribeToTable('bookings', () => {
      fetchBookings();
    });

    // Also fallback poll backend so changes appear even in restricted networks
    const pollTimer = setInterval(() => {
      fetchBookings();
    }, 2500);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
      if (bc) {
        try {
          bc.close();
        } catch (e) {}
      }
      if (unsubscribe) unsubscribe();
      clearInterval(pollTimer);
    };
  }, [fetchBookings]);

  const handleCreate = async (bookingData: Partial<Booking>): Promise<Booking> => {
    const created = await createBooking(bookingData);
    await fetchBookings();
    return created;
  };

  const handleUpdate = async (id: string, updatedFields: Partial<Booking>): Promise<Booking | undefined> => {
    const updated = await updateBooking(id, updatedFields);
    await fetchBookings();
    return updated;
  };

  const handleStatusChange = async (id: string, status: string): Promise<Booking | undefined> => {
    const updated = await updateBookingStatus(id, status);
    await fetchBookings();
    return updated;
  };

  const handleCancel = async (id: string): Promise<Booking | undefined> => {
    const updated = await cancelBooking(id);
    await fetchBookings();
    return updated;
  };

  const handleDelete = async (id: string): Promise<void> => {
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
