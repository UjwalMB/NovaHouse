import { GuestDocument, VerificationStatus, DocumentType } from '../types';
import { initialGuestDocuments } from '../data/guestDocuments';

const STORAGE_KEY = 'nova_admin_guest_documents';

function getStoredDocs(): GuestDocument[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialGuestDocuments));
  return [...initialGuestDocuments];
}

function saveStoredDocs(docs: GuestDocument[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(docs));
}

export async function getGuestDocuments(): Promise<GuestDocument[]> {
  return getStoredDocs();
}

export async function getDocumentsByGuestId(guestId: string): Promise<GuestDocument[]> {
  const all = getStoredDocs();
  return all.filter((d) => d.guestId === guestId || d.guestName.toLowerCase().includes(guestId.toLowerCase()));
}

export async function uploadGuestDocument(doc: Partial<GuestDocument>): Promise<GuestDocument> {
  const docs = getStoredDocs();
  const newDoc: GuestDocument = {
    id: `DOC-${Math.floor(1000 + Math.random() * 9000)}`,
    guestId: doc.guestId || `gst_${Date.now()}`,
    guestName: doc.guestName || 'Patron Guest',
    documentType: (doc.documentType as DocumentType) || 'Passport',
    documentNumber: doc.documentNumber || '•••• ••••',
    nationality: doc.nationality || 'Indian',
    expiryDate: doc.expiryDate,
    uploadDate: new Date().toISOString().split('T')[0],
    verificationStatus: (doc.verificationStatus as VerificationStatus) || 'Pending',
    fileName: doc.fileName || 'uploaded_document.pdf',
    notes: doc.notes || '',
    ...doc,
  };

  const updated = [newDoc, ...docs];
  saveStoredDocs(updated);
  return newDoc;
}

export async function updateDocumentVerification(
  id: string,
  status: VerificationStatus,
  verifiedBy = 'Front Office Manager',
  notes?: string
): Promise<GuestDocument | null> {
  const docs = getStoredDocs();
  const index = docs.findIndex((d) => d.id === id);
  if (index === -1) return null;

  docs[index].verificationStatus = status;
  docs[index].verifiedBy = verifiedBy;
  docs[index].verifiedAt = new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' });
  if (notes) docs[index].notes = notes;

  saveStoredDocs(docs);
  return docs[index];
}

export async function deleteGuestDocument(id: string): Promise<boolean> {
  const docs = getStoredDocs();
  const filtered = docs.filter((d) => d.id !== id);
  saveStoredDocs(filtered);
  return true;
}
