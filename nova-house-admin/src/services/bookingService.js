import api from './api';
import { initialBookings } from '../data/bookings';

const STORAGE_KEY = 'nova_admin_bookings';

function getStoredBookings() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialBookings));
  return [...initialBookings];
}

function saveStoredBookings(bookings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bookings));
}

let bookingsState = getStoredBookings();

export async function getBookings() {
  try {
    const remote = await api.get('/bookings');
    if (remote) return remote;
  } catch (err) {}
  return new Promise((resolve) => {
    setTimeout(() => resolve([...bookingsState]), 100);
  });
}

export async function getBookingById(id) {
  try {
    const remote = await api.get(`/bookings/${id}`);
    if (remote) return remote;
  } catch (err) {}
  const found = bookingsState.find((b) => b.id === id);
  return found ? { ...found } : null;
}

export async function createBooking(newBookingData) {
  try {
    const remote = await api.post('/bookings', newBookingData);
    if (remote) return remote;
  } catch (err) {}

  const newId = `NH-${Math.floor(1000 + Math.random() * 9000)}`;
  const created = {
    ...newBookingData,
    id: newId,
    bookingStatus: newBookingData.bookingStatus || 'Confirmed',
    paymentStatus: newBookingData.paymentStatus || 'Pending',
    createdAt: new Date().toISOString().split('T')[0]
  };

  bookingsState = [created, ...bookingsState];
  saveStoredBookings(bookingsState);
  return created;
}

export async function updateBooking(id, updatedFields) {
  try {
    const remote = await api.put(`/bookings/${id}`, updatedFields);
    if (remote) return remote;
  } catch (err) {}

  bookingsState = bookingsState.map((b) => (b.id === id ? { ...b, ...updatedFields } : b));
  saveStoredBookings(bookingsState);
  return bookingsState.find((b) => b.id === id);
}

export async function updateBookingStatus(id, newStatus) {
  return updateBooking(id, { bookingStatus: newStatus });
}

export async function cancelBooking(id) {
  return updateBooking(id, { bookingStatus: 'Cancelled' });
}

export async function deleteBooking(id) {
  try {
    await api.delete(`/bookings/${id}`);
  } catch (err) {}

  bookingsState = bookingsState.filter((b) => b.id !== id);
  saveStoredBookings(bookingsState);
  return true;
}
