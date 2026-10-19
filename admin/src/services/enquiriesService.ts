import { Enquiry } from '../types';
import { initialEnquiries } from '../data/enquiries';

const STORAGE_KEY = 'nova_admin_enquiries';

function getStoredEnquiries(): Enquiry[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialEnquiries));
  return [...initialEnquiries];
}

function saveStoredEnquiries(enqs: Enquiry[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(enqs));
}

export async function getEnquiries(): Promise<Enquiry[]> {
  return getStoredEnquiries();
}

export async function updateEnquiryStatus(id: string, status: string): Promise<Enquiry | null> {
  const list = getStoredEnquiries();
  const idx = list.findIndex((e) => e.id === id);
  if (idx === -1) return null;
  list[idx].status = status;
  saveStoredEnquiries(list);
  return list[idx];
}

export async function createEnquiry(enq: Partial<Enquiry>): Promise<Enquiry> {
  const list = getStoredEnquiries();
  const newEnq: Enquiry = {
    id: `ENQ-${Math.floor(200 + Math.random() * 800)}`,
    name: enq.name || 'Inquiring Patron',
    email: enq.email || 'guest@example.com',
    phone: enq.phone || '+91 98450 00000',
    subject: enq.subject || 'Reservation Clarification',
    message: enq.message || '',
    date: new Date().toISOString().split('T')[0],
    status: enq.status || 'New',
    priority: enq.priority || 'Medium',
    notes: enq.notes || '',
    ...enq,
  };
  const updated = [newEnq, ...list];
  saveStoredEnquiries(updated);
  return newEnq;
}
