import { initialGuests } from '../data/guests';
import { Guest } from '../types';
import { fetchLiveGuests } from './supabase';

const STORAGE_KEY = 'nova_admin_guests';

function getStoredGuests(): Guest[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as Guest[];
    } catch (e) {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialGuests));
  return [...initialGuests];
}

function saveStoredGuests(guests: Guest[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(guests));
}

let guestsState: Guest[] = getStoredGuests();

export async function getGuests(): Promise<Guest[]> {
  try {
    const live = await fetchLiveGuests();
    if (live && Array.isArray(live) && live.length > 0) {
      guestsState = live;
      saveStoredGuests(live);
      return live;
    }
  } catch (err) {
    console.warn('Live guests fetch failed, fallback to local state:', err);
  }
  return [...guestsState];
}

export async function getGuestById(id: string): Promise<Guest | null> {
  const all = await getGuests();
  return all.find((g) => g.id === id) || null;
}

export async function updateGuest(id: string, updatedFields: Partial<Guest>): Promise<Guest | undefined> {
  guestsState = guestsState.map((g) => (g.id === id ? { ...g, ...updatedFields } : g));
  saveStoredGuests(guestsState);
  return guestsState.find((g) => g.id === id);
}

export async function createGuest(guest: Partial<Guest>): Promise<Guest> {
  const newGuest: Guest = {
    id: `gst_${Date.now()}`,
    name: guest.name || 'Valued Guest',
    email: guest.email || '',
    phone: guest.phone || '',
    country: guest.country || 'India',
    city: guest.city || 'Bengaluru',
    totalStays: 1,
    totalSpent: 0,
    lastStay: new Date().toISOString().split('T')[0],
    status: 'Active',
    tier: guest.tier || 'Member',
    preferences: guest.preferences || ['Quiet Suite'],
    notes: guest.notes || '',
    history: [],
    ...guest,
  };
  guestsState = [newGuest, ...guestsState];
  saveStoredGuests(guestsState);
  return newGuest;
}
