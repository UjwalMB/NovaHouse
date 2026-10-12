import api from './api';
import { initialGuests } from '../data/guests';

const STORAGE_KEY = 'nova_admin_guests';

function getStoredGuests() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialGuests));
  return [...initialGuests];
}

function saveStoredGuests(guests) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(guests));
}

let guestsState = getStoredGuests();

export async function getGuests() {
  try {
    const remote = await api.get('/guests');
    if (remote) return remote;
  } catch (err) {}
  return new Promise((resolve) => {
    setTimeout(() => resolve([...guestsState]), 100);
  });
}

export async function getGuestById(id) {
  try {
    const remote = await api.get(`/guests/${id}`);
    if (remote) return remote;
  } catch (err) {}
  return guestsState.find((g) => g.id === id) || null;
}

export async function updateGuest(id, updatedFields) {
  try {
    const remote = await api.put(`/guests/${id}`, updatedFields);
    if (remote) return remote;
  } catch (err) {}

  guestsState = guestsState.map((g) => (g.id === id ? { ...g, ...updatedFields } : g));
  saveStoredGuests(guestsState);
  return guestsState.find((g) => g.id === id);
}
