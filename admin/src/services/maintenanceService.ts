import { MaintenanceRequest } from '../types';
import { initialMaintenanceRequests } from '../data/maintenance';
import { updateRoomStatus } from './roomService';

const MNT_STORAGE_KEY = 'nova_admin_maintenance_requests';

function getStoredRequests(): MaintenanceRequest[] {
  const stored = localStorage.getItem(MNT_STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  localStorage.setItem(MNT_STORAGE_KEY, JSON.stringify(initialMaintenanceRequests));
  return [...initialMaintenanceRequests];
}

function saveStoredRequests(reqs: MaintenanceRequest[]): void {
  localStorage.setItem(MNT_STORAGE_KEY, JSON.stringify(reqs));
}

export async function getMaintenanceRequests(): Promise<MaintenanceRequest[]> {
  return getStoredRequests();
}

export async function createMaintenanceRequest(req: Partial<MaintenanceRequest>): Promise<MaintenanceRequest> {
  const requests = getStoredRequests();
  const newReq: MaintenanceRequest = {
    id: `MNT-${Math.floor(400 + Math.random() * 500)}`,
    roomNumber: req.roomNumber || '101',
    category: req.category || 'Other',
    issue: req.issue || 'Maintenance inspection needed',
    description: req.description || '',
    priority: req.priority || 'Medium',
    status: req.status || 'Open',
    assignedStaff: req.assignedStaff || 'Karan Mehra (Chief Engineer)',
    createdDate: new Date().toISOString().split('T')[0],
    estimatedCost: Number(req.estimatedCost || 0),
    ...req,
  };

  const updated = [newReq, ...requests];
  saveStoredRequests(updated);

  // If critical/high priority, mark room as Maintenance
  if ((newReq.priority === 'Critical' || newReq.priority === 'High') && newReq.roomNumber) {
    await updateRoomStatus(newReq.roomNumber, 'Maintenance');
  }

  return newReq;
}

export async function updateMaintenanceRequest(id: string, updates: Partial<MaintenanceRequest>): Promise<MaintenanceRequest | null> {
  const requests = getStoredRequests();
  const index = requests.findIndex((r) => r.id === id);
  if (index === -1) return null;

  const current = requests[index];
  const updatedReq: MaintenanceRequest = { ...current, ...updates };

  if (updates.status === 'Completed' && !updatedReq.completedDate) {
    updatedReq.completedDate = new Date().toISOString().split('T')[0];
    // Return room to available if it was in maintenance
    if (updatedReq.roomNumber) {
      await updateRoomStatus(updatedReq.roomNumber, 'Available');
    }
  }

  requests[index] = updatedReq;
  saveStoredRequests(requests);
  return updatedReq;
}

export async function deleteMaintenanceRequest(id: string): Promise<boolean> {
  const requests = getStoredRequests();
  const filtered = requests.filter((r) => r.id !== id);
  saveStoredRequests(filtered);
  return true;
}
