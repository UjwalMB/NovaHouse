import { useState, useEffect, useCallback } from 'react';
import {
  getRooms,
  createRoom,
  updateRoom,
  updateRoomStatus,
  deleteRoom,
} from '../services/roomService';

export function useRooms() {
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchRooms = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getRooms();
      setRooms(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load rooms');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRooms();
  }, [fetchRooms]);

  const handleCreate = async (roomData) => {
    const created = await createRoom(roomData);
    await fetchRooms();
    return created;
  };

  const handleUpdate = async (id, updatedFields) => {
    const updated = await updateRoom(id, updatedFields);
    await fetchRooms();
    return updated;
  };

  const handleStatusChange = async (id, status) => {
    const updated = await updateRoomStatus(id, status);
    await fetchRooms();
    return updated;
  };

  const handleDelete = async (id) => {
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
