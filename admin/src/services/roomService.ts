import { initialRooms } from '../data/rooms';
import { Room } from '../types';
import { fetchLiveRooms, updateLiveRoom } from './supabase';

const STORAGE_KEY = 'nova_admin_rooms';

function getStoredRooms(): Room[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as Room[];
    } catch (e) {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRooms));
  return [...initialRooms];
}

function saveStoredRooms(rooms: Room[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

let roomsState: Room[] = getStoredRooms();

export async function getRooms(): Promise<Room[]> {
  try {
    const live = await fetchLiveRooms();
    if (live && Array.isArray(live) && live.length > 0) {
      roomsState = live;
      saveStoredRooms(live);
      return live;
    }
  } catch (err) {
    console.warn('Live rooms query failed, fallback to local state:', err);
  }
  return [...roomsState];
}

export async function getRoomById(id: string): Promise<Room | null> {
  const all = await getRooms();
  const found = all.find((r) => r.id === id);
  return found ? { ...found } : null;
}

export async function createRoom(newRoomData: Partial<Room>): Promise<Room> {
  const created: Room = {
    id: newRoomData.roomNumber || String(Date.now()),
    name: newRoomData.name || 'Boutique Room',
    type: newRoomData.type || 'Deluxe Room',
    category: newRoomData.category || 'Rooms',
    floor: newRoomData.floor || '1st Floor',
    roomNumber: newRoomData.roomNumber || '101',
    capacity: newRoomData.capacity || 2,
    bedType: newRoomData.bedType || 'King Bed',
    size: newRoomData.size || '42 m²',
    price: newRoomData.price || 18500,
    status: (newRoomData.status as any) || 'Available',
    image: newRoomData.image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    amenities: newRoomData.amenities || ['King Bed', 'Wi-Fi', 'Air Conditioning', 'Breakfast'],
    description: newRoomData.description || '',
    ...newRoomData,
  };

  roomsState = [created, ...roomsState];
  saveStoredRooms(roomsState);
  return created;
}

export async function updateRoom(id: string, updatedFields: Partial<Room>): Promise<Room | undefined> {
  try {
    await updateLiveRoom(id, updatedFields);
  } catch (err) {
    console.warn('Live room update failed, falling back to local store:', err);
  }

  roomsState = roomsState.map((r) => (r.id === id ? { ...r, ...updatedFields } : r));
  saveStoredRooms(roomsState);
  return roomsState.find((r) => r.id === id);
}

export async function updateRoomStatus(id: string, newStatus: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance' | string): Promise<Room | undefined> {
  return updateRoom(id, { status: newStatus as any });
}

export async function deleteRoom(id: string): Promise<boolean> {
  roomsState = roomsState.filter((r) => r.id !== id);
  saveStoredRooms(roomsState);
  return true;
}
