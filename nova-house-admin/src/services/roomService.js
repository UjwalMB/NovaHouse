import api from './api';
import { initialRooms } from '../data/rooms';

// In-memory state with localStorage sync
const STORAGE_KEY = 'nova_admin_rooms';

function getStoredRooms() {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      // fallback
    }
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialRooms));
  return [...initialRooms];
}

function saveStoredRooms(rooms) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
}

let roomsState = getStoredRooms();

export async function getRooms() {
  try {
    const remote = await api.get('/rooms');
    if (remote) return remote;
  } catch (err) {
    // fallback to mock
  }
  return new Promise((resolve) => {
    setTimeout(() => resolve([...roomsState]), 100);
  });
}

export async function getRoomById(id) {
  try {
    const remote = await api.get(`/rooms/${id}`);
    if (remote) return remote;
  } catch (err) {}
  const found = roomsState.find((r) => r.id === id);
  return found ? { ...found } : null;
}

export async function createRoom(newRoomData) {
  try {
    const remote = await api.post('/rooms', newRoomData);
    if (remote) return remote;
  } catch (err) {}

  const created = {
    ...newRoomData,
    id: newRoomData.roomNumber || String(Date.now()),
    status: newRoomData.status || 'Available',
    image: newRoomData.image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    amenities: newRoomData.amenities || ['King Bed', 'Wi-Fi', 'Air Conditioning', 'Breakfast']
  };

  roomsState = [created, ...roomsState];
  saveStoredRooms(roomsState);
  return created;
}

export async function updateRoom(id, updatedFields) {
  try {
    const remote = await api.put(`/rooms/${id}`, updatedFields);
    if (remote) return remote;
  } catch (err) {}

  roomsState = roomsState.map((r) => (r.id === id ? { ...r, ...updatedFields } : r));
  saveStoredRooms(roomsState);
  return roomsState.find((r) => r.id === id);
}

export async function updateRoomStatus(id, newStatus) {
  return updateRoom(id, { status: newStatus });
}

export async function deleteRoom(id) {
  try {
    await api.delete(`/rooms/${id}`);
  } catch (err) {}

  roomsState = roomsState.filter((r) => r.id !== id);
  saveStoredRooms(roomsState);
  return true;
}
