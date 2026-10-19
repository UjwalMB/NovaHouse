import { HousekeepingTask, LostAndFoundItem, HousekeepingStatus, TaskStatus, TaskPriority } from '../types';
import { initialHousekeepingTasks, initialLostAndFound } from '../data/housekeeping';
import { updateRoomStatus } from './roomService';

const HK_STORAGE_KEY = 'nova_admin_housekeeping_tasks';
const LF_STORAGE_KEY = 'nova_admin_lost_found';

function getStoredTasks(): HousekeepingTask[] {
  const stored = localStorage.getItem(HK_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  localStorage.setItem(HK_STORAGE_KEY, JSON.stringify(initialHousekeepingTasks));
  return [...initialHousekeepingTasks];
}

function saveStoredTasks(tasks: HousekeepingTask[]): void {
  localStorage.setItem(HK_STORAGE_KEY, JSON.stringify(tasks));
}

function getStoredLF(): LostAndFoundItem[] {
  const stored = localStorage.getItem(LF_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  localStorage.setItem(LF_STORAGE_KEY, JSON.stringify(initialLostAndFound));
  return [...initialLostAndFound];
}

function saveStoredLF(items: LostAndFoundItem[]): void {
  localStorage.setItem(LF_STORAGE_KEY, JSON.stringify(items));
}

export async function getHousekeepingTasks(): Promise<HousekeepingTask[]> {
  return getStoredTasks();
}

export async function createHousekeepingTask(task: Partial<HousekeepingTask>): Promise<HousekeepingTask> {
  const tasks = getStoredTasks();
  const newTask: HousekeepingTask = {
    id: `HK-${Math.floor(100 + Math.random() * 900)}`,
    roomNumber: task.roomNumber || '101',
    roomType: task.roomType || 'Deluxe Room',
    taskType: task.taskType || 'Daily Turnover',
    assignedStaff: task.assignedStaff || 'Unassigned',
    priority: task.priority || 'Medium',
    status: task.status || 'Pending',
    roomStatus: task.roomStatus || 'Dirty',
    scheduledTime: task.scheduledTime || '10:00 AM',
    notes: task.notes || '',
    checklist: task.checklist || [
      { item: 'Bespoke linen refresh', completed: false },
      { item: 'Bathroom sanitization', completed: false },
      { item: 'Mini-bar inspection', completed: false },
    ],
    ...task,
  };
  const updated = [newTask, ...tasks];
  saveStoredTasks(updated);

  // Sync with Room Status
  if (newTask.roomNumber) {
    await updateRoomStatus(newTask.roomNumber, mapHkToRoomStatus(newTask.roomStatus));
  }
  return newTask;
}

export async function updateHousekeepingTask(id: string, updates: Partial<HousekeepingTask>): Promise<HousekeepingTask | null> {
  const tasks = getStoredTasks();
  const index = tasks.findIndex((t) => t.id === id);
  if (index === -1) return null;

  const updatedTask = { ...tasks[index], ...updates };
  if (updates.status === 'Completed' && !updatedTask.completedAt) {
    updatedTask.completedAt = new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
  }

  tasks[index] = updatedTask;
  saveStoredTasks(tasks);

  // Synchronize room status if roomStatus changed
  if (updates.roomStatus && updatedTask.roomNumber) {
    await updateRoomStatus(updatedTask.roomNumber, mapHkToRoomStatus(updates.roomStatus));
  }
  return updatedTask;
}

export async function deleteHousekeepingTask(id: string): Promise<boolean> {
  const tasks = getStoredTasks();
  const filtered = tasks.filter((t) => t.id !== id);
  saveStoredTasks(filtered);
  return true;
}

export async function getLostAndFound(): Promise<LostAndFoundItem[]> {
  return getStoredLF();
}

export async function addLostAndFound(item: Partial<LostAndFoundItem>): Promise<LostAndFoundItem> {
  const items = getStoredLF();
  const newItem: LostAndFoundItem = {
    id: `LF-${Math.floor(800 + Math.random() * 200)}`,
    item: item.item || 'Personal Belonging',
    locationFound: item.locationFound || 'Lobby',
    foundDate: item.foundDate || new Date().toISOString().split('T')[0],
    foundBy: item.foundBy || 'Front Office Staff',
    status: item.status || 'Reported',
    guestName: item.guestName,
    guestPhone: item.guestPhone,
    ...item,
  };
  const updated = [newItem, ...items];
  saveStoredLF(updated);
  return newItem;
}

export async function updateLostAndFound(id: string, updates: Partial<LostAndFoundItem>): Promise<LostAndFoundItem | null> {
  const items = getStoredLF();
  const index = items.findIndex((i) => i.id === id);
  if (index === -1) return null;

  const updatedItem = { ...items[index], ...updates };
  items[index] = updatedItem;
  saveStoredLF(items);
  return updatedItem;
}

function mapHkToRoomStatus(hkStatus: HousekeepingStatus): string {
  switch (hkStatus) {
    case 'Clean':
    case 'Inspected':
      return 'Available';
    case 'Dirty':
    case 'Cleaning':
      return 'Cleaning';
    case 'Out of Service':
      return 'Maintenance';
    default:
      return 'Available';
  }
}
