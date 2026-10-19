import { Invoice, Receipt, Settlement } from '../types';
import { initialInvoices, initialReceipts, initialSettlements } from '../data/finance';

const INV_KEY = 'nova_admin_invoices';
const REC_KEY = 'nova_admin_receipts';
const STL_KEY = 'nova_admin_settlements';

function getStoredInvoices(): Invoice[] {
  const s = localStorage.getItem(INV_KEY);
  if (s) {
    try { return JSON.parse(s); } catch (e) {}
  }
  localStorage.setItem(INV_KEY, JSON.stringify(initialInvoices));
  return [...initialInvoices];
}

function saveStoredInvoices(invs: Invoice[]) {
  localStorage.setItem(INV_KEY, JSON.stringify(invs));
}

function getStoredReceipts(): Receipt[] {
  const s = localStorage.getItem(REC_KEY);
  if (s) {
    try { return JSON.parse(s); } catch (e) {}
  }
  localStorage.setItem(REC_KEY, JSON.stringify(initialReceipts));
  return [...initialReceipts];
}

function saveStoredReceipts(recs: Receipt[]) {
  localStorage.setItem(REC_KEY, JSON.stringify(recs));
}

function getStoredSettlements(): Settlement[] {
  const s = localStorage.getItem(STL_KEY);
  if (s) {
    try { return JSON.parse(s); } catch (e) {}
  }
  localStorage.setItem(STL_KEY, JSON.stringify(initialSettlements));
  return [...initialSettlements];
}

function saveStoredSettlements(stls: Settlement[]) {
  localStorage.setItem(STL_KEY, JSON.stringify(stls));
}

export async function getInvoices(): Promise<Invoice[]> {
  return getStoredInvoices();
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  const invs = getStoredInvoices();
  return invs.find((i) => i.id === id || i.invoiceNumber === id) || null;
}

export async function createInvoice(inv: Partial<Invoice>): Promise<Invoice> {
  const invs = getStoredInvoices();
  const subtotal = inv.items?.reduce((s, item) => s + item.amount, 0) || inv.subtotal || 0;
  const cgst = Math.round(subtotal * 0.09);
  const sgst = Math.round(subtotal * 0.09);
  const totalTaxes = cgst + sgst;
  const discount = inv.discount || 0;
  const grandTotal = subtotal + totalTaxes - discount;

  const newInv: Invoice = {
    id: `INV-${Date.now().toString().slice(-4)}`,
    invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    guestName: inv.guestName || 'Patron Guest',
    guestEmail: inv.guestEmail || '',
    guestPhone: inv.guestPhone || '',
    companyName: inv.companyName,
    gstin: inv.gstin,
    roomNumber: inv.roomNumber || '101',
    issueDate: inv.issueDate || new Date().toISOString().split('T')[0],
    dueDate: inv.dueDate || new Date(Date.now() + 3 * 86400000).toISOString().split('T')[0],
    items: inv.items || [
      { id: '1', description: 'Room Sanctuary Stay Tariff', category: 'Room Tariff', quantity: 1, unitPrice: subtotal, amount: subtotal },
    ],
    subtotal,
    cgst,
    sgst,
    totalTaxes,
    discount,
    grandTotal,
    status: inv.status || 'Pending',
    paymentMethod: inv.paymentMethod || 'Online Gateway',
    notes: inv.notes || '',
    ...inv,
  };

  const updated = [newInv, ...invs];
  saveStoredInvoices(updated);

  // If created as Paid, auto-generate Receipt!
  if (newInv.status === 'Paid') {
    await createReceipt({
      invoiceId: newInv.id,
      bookingId: newInv.bookingId,
      guestName: newInv.guestName,
      guestEmail: newInv.guestEmail,
      amountPaid: newInv.grandTotal,
      paymentMethod: newInv.paymentMethod,
    });
  }

  return newInv;
}

export async function updateInvoiceStatus(id: string, status: 'Paid' | 'Pending' | 'Overdue' | 'Cancelled'): Promise<Invoice | null> {
  const invs = getStoredInvoices();
  const idx = invs.findIndex((i) => i.id === id);
  if (idx === -1) return null;
  invs[idx].status = status;
  saveStoredInvoices(invs);

  if (status === 'Paid') {
    await createReceipt({
      invoiceId: invs[idx].id,
      bookingId: invs[idx].bookingId,
      guestName: invs[idx].guestName,
      guestEmail: invs[idx].guestEmail,
      amountPaid: invs[idx].grandTotal,
      paymentMethod: invs[idx].paymentMethod,
    });
  }

  return invs[idx];
}

export async function getReceipts(): Promise<Receipt[]> {
  return getStoredReceipts();
}

export async function createReceipt(rec: Partial<Receipt>): Promise<Receipt> {
  const recs = getStoredReceipts();
  const newRec: Receipt = {
    id: `REC-${Date.now().toString().slice(-4)}`,
    receiptNumber: `RCP-2026-${Math.floor(100 + Math.random() * 900)}`,
    invoiceId: rec.invoiceId,
    bookingId: rec.bookingId,
    paymentId: rec.paymentId || `pay_${Math.random().toString(36).substring(2, 9)}`,
    guestName: rec.guestName || 'Patron Guest',
    guestEmail: rec.guestEmail,
    amountPaid: Number(rec.amountPaid || 0),
    currency: rec.currency || 'INR',
    paymentMethod: rec.paymentMethod || 'Online Payment',
    paidAt: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
    transactionRef: `RZP-TRX-${Math.floor(100000 + Math.random() * 900000)}`,
    receivedBy: rec.receivedBy || 'Automated Payment Capture',
    notes: rec.notes || 'Official electronic payment acknowledgement.',
    ...rec,
  };

  const updated = [newRec, ...recs];
  saveStoredReceipts(updated);
  return newRec;
}

export async function getSettlements(): Promise<Settlement[]> {
  return getStoredSettlements();
}

export async function reconcileSettlement(id: string, utrNumber: string): Promise<Settlement | null> {
  const stls = getStoredSettlements();
  const idx = stls.findIndex((s) => s.id === id);
  if (idx === -1) return null;
  stls[idx].status = 'Reconciled';
  stls[idx].utrNumber = utrNumber;
  saveStoredSettlements(stls);
  return stls[idx];
}
