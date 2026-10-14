import { useState, useEffect, useCallback } from 'react';
import {
  getRooms,
  createRoom,
  updateRoom,
  updateRoomStatus,
  deleteRoom,
} from '../services/roomService';
import { subscribeToTable } from '../services/supabase';
import { Room } from '../types';

export function useRooms() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRooms();
      setRooms(data);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();

    const unsubscribe = subscribeToTable('rooms', () => {
      fetchRooms();
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [fetchRooms]);

  const handleCreate = async (roomData: Partial<Room>): Promise<Room> => {
    const created = await createRoom(roomData);
    await fetchRooms();
    return created;
  };

  const handleUpdate = async (id: string, updatedFields: Partial<Room>): Promise<Room | undefined> => {
    const updated = await updateRoom(id, updatedFields);
    await fetchRooms();
    return updated;
  };

  const handleStatusChange = async (id: string, status: 'Available' | 'Occupied' | 'Cleaning' | 'Maintenance'): Promise<Room | undefined> => {
    const updated = await updateRoomStatus(id, status);
    await fetchRooms();
    return updated;
  };

  const handleDelete = async (id: string): Promise<void> => {
    await deleteRoom(id);
    await fetchRooms();
  };

  return {
    rooms,
    loading,
    error,
    refresh: fetchRooms,
    createRoom: handleCreate,
    updateRoom: handleUpdate,
    updateStatus: handleStatusChange,
    deleteRoom: handleDelete,
  };
}
