import { GuestCommunication } from '../types';
import { initialCommunications } from '../data/guestCommunication';

const STORAGE_KEY = 'nova_admin_guest_communications';

function getStoredComms(): GuestCommunication[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialCommunications));
  return [...initialCommunications];
}

function saveStoredComms(comms: GuestCommunication[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(comms));
}

export async function getGuestCommunications(): Promise<GuestCommunication[]> {
  return getStoredComms();
}

export async function sendGuestCommunication(msg: Partial<GuestCommunication>): Promise<GuestCommunication> {
  const comms = getStoredComms();
  const newMsg: GuestCommunication = {
    id: `COM-${Math.floor(900 + Math.random() * 100)}`,
    guestName: msg.guestName || 'Patron Guest',
    channel: msg.channel || 'Email',
    type: msg.type || 'Custom Message',
    subject: msg.subject || 'Update regarding your stay at NOVA HOUSE',
    content: msg.content || '',
    sentBy: msg.sentBy || 'Front Desk Administration',
    sentAt: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
    status: 'Delivered',
    ...msg,
  };

  const updated = [newMsg, ...comms];
  saveStoredComms(updated);
  return newMsg;
}

export async function deleteGuestCommunication(id: string): Promise<boolean> {
  const comms = getStoredComms();
  const filtered = comms.filter((c) => c.id !== id);
  saveStoredComms(filtered);
  return true;
}
