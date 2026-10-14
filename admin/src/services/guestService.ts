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
