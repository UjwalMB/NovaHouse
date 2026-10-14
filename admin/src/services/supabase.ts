/**
 * NOVA HOUSE Admin Portal · Supabase Client & Service Integration
 * Connects directly to Supabase PostgreSQL (project: rcirzjtfynlozlehtbwp).
 * Transparently translates DB snake_case to frontend camelCase with
 * graceful offline/cache fallback.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Booking, Room, Guest, NotificationLog } from '../types';
import { PaymentDisplayRecord } from './paymentService';
import { initialBookings } from '../data/bookings';
import { initialRooms } from '../data/rooms';
import { initialGuests } from '../data/guests';

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || 'https://rcirzjtfynlozlehtbwp.supabase.co';
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (client) return client;
  if (!SUPABASE_ANON_KEY) {
    // If no key yet, return null so fallback cache handles requests gracefully
    return null;
  }
  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { persistSession: false },
    });
    return client;
  } catch (e) {
    console.warn('Failed to initialize Supabase client:', e);
    return null;
  }
}

// ============================================================================
// DATA MAPPERS (PostgreSQL snake_case <--> Frontend camelCase)
// ============================================================================

export function mapBookingFromDb(row: any): Booking {
  return {
    id: row.id,
    guestName: row.guest_name || 'Valued Guest',
    guestEmail: row.guest_email || '',
    guestPhone: row.guest_phone || '',
    guestCountry: row.guest_country || 'India',
    roomNumber: String(row.room_number || '101'),
    roomType: row.room_type || 'Deluxe Room',
    roomId: String(row.room_id || row.room_number || '101'),
    checkIn: row.check_in || '',
    checkOut: row.check_out || '',
    nights: Number(row.nights || 1),
    guests: Number(row.guests || 2),
    baseRate: Number(row.base_rate || 18500),
    taxes: Number(row.taxes || 0),
    discount: Number(row.discount || 0),
    totalAmount: Number(row.total_amount || 18500),
    paymentStatus: row.payment_status || 'UNPAID',
    bookingStatus: row.booking_status || 'Confirmed',
    paymentMethod: row.payment_method || 'Online / Razorpay',
    paymentId: row.payment_id || undefined,
    razorpayOrderId: row.razorpay_order_id || undefined,
    specialRequests: row.special_requests || '',
    source: row.source || 'Website Direct',
    createdAt: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '',
  };
}

export function mapBookingToDb(b: Partial<Booking>): any {
  const row: Record<string, any> = {};
  if (b.id !== undefined) row.id = b.id;
  if (b.guestName !== undefined) row.guest_name = b.guestName;
  if (b.guestEmail !== undefined) row.guest_email = b.guestEmail;
  if (b.guestPhone !== undefined) row.guest_phone = b.guestPhone;
  if (b.guestCountry !== undefined) row.guest_country = b.guestCountry;
  if (b.roomNumber !== undefined) row.room_number = String(b.roomNumber);
  if (b.roomType !== undefined) row.room_type = b.roomType;
  if (b.roomId !== undefined) row.room_id = String(b.roomId);
  if (b.checkIn !== undefined) row.check_in = b.checkIn;
  if (b.checkOut !== undefined) row.check_out = b.checkOut;
  if (b.nights !== undefined) row.nights = b.nights;
  if (b.guests !== undefined) row.guests = b.guests;
  if (b.baseRate !== undefined) row.base_rate = b.baseRate;
  if (b.taxes !== undefined) row.taxes = b.taxes;
  if (b.discount !== undefined) row.discount = b.discount;
  if (b.totalAmount !== undefined) row.total_amount = b.totalAmount;
  if (b.paymentStatus !== undefined) row.payment_status = b.paymentStatus;
  if (b.bookingStatus !== undefined) row.booking_status = b.bookingStatus;
  if (b.paymentMethod !== undefined) row.payment_method = b.paymentMethod;
  if (b.paymentId !== undefined) row.payment_id = b.paymentId;
  if (b.razorpayOrderId !== undefined) row.razorpay_order_id = b.razorpayOrderId;
  if (b.specialRequests !== undefined) row.special_requests = b.specialRequests;
  if (b.source !== undefined) row.source = b.source;
  return row;
}

export function mapRoomFromDb(row: any): Room {
  const existing = initialRooms.find((r) => r.id === String(row.id));
  return {
    id: String(row.id),
    name: row.title || (existing?.name ?? `Room ${row.room_number}`),
    roomNumber: String(row.room_number || row.id),
    type: existing?.type || row.type_code || 'Deluxe Room',
    category: existing?.category || (row.type_code?.includes('suite') ? 'Suites' : 'Rooms'),
    floor: `${row.floor || 1}st Floor`,
    capacity: row.max_guests || 2,
    bedType: existing?.bedType || 'King Bed',
    size: existing?.size || '42 m²',
    price: Number(row.base_price || 18500),
    status: row.status || 'Available',
    amenities: existing?.amenities || ['High-speed Wi-Fi', 'Balcony', 'Ensuite Bathroom'],
    image: existing?.image || 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=800&q=80',
    description: existing?.description || row.title || 'Luxurious sanctuary space.',
  };
}

export function mapGuestFromDb(row: any): Guest {
  return {
    id: String(row.id),
    name: row.full_name || 'Patron Guest',
    email: row.email || '',
    phone: row.phone || '',
    country: row.country || 'India',
    city: 'Bengaluru',
    totalStays: Number(row.total_stays || 1),
    totalSpent: 0,
    lastStay: row.created_at ? new Date(row.created_at).toISOString().split('T')[0] : '2026-10-12',
    status: 'Active',
    tier: row.vip_tier || 'Member',
    preferences: ['Quiet Sanctuary Room', 'High Floor'],
    notes: row.notes || '',
    history: [],
  };
}

export function mapPaymentFromDb(row: any): PaymentDisplayRecord {
  const dateStr = row.created_at ? new Date(row.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '12 Oct 2026';
  return {
    id: row.id,
    paymentId: row.razorpay_payment_id || row.id,
    bookingId: row.booking_id,
    orderId: row.razorpay_order_id,
    guestName: row.email || 'Patron Guest',
    guestEmail: row.email || '',
    guestPhone: row.contact || '',
    roomType: 'Sanctuary Suite',
    amount: Number(row.amount || 0),
    amountPaise: row.amount_paise,
    currency: row.currency || 'INR',
    status: row.status || 'PAID',
    method: row.method || 'Online Payment',
    date: dateStr,
    createdAt: row.created_at || new Date().toISOString(),
    refundId: row.refund_id || undefined,
    refundAmount: Number(row.refund_amount || 0),
  };
}

// ============================================================================
// SUPABASE LIVE QUERIES WITH FALLBACK
// ============================================================================

export async function fetchLiveBookings(): Promise<Booking[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('bookings').select('*').order('created_at', { ascending: false });
    if (error || !data) {
      console.warn('Supabase bookings query error:', error);
      return null;
    }
    return data.map(mapBookingFromDb);
  } catch (err) {
    console.warn('Supabase bookings network error:', err);
    return null;
  }
}

export async function insertLiveBooking(b: Partial<Booking>): Promise<Booking | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const dbPayload = mapBookingToDb(b);
    const { data, error } = await sb.from('bookings').insert([dbPayload]).select().single();
    if (error || !data) {
      console.warn('Supabase booking insert error:', error);
      return null;
    }
    return mapBookingFromDb(data);
  } catch (err) {
    console.warn('Supabase booking insert exception:', err);
    return null;
  }
}

export async function updateLiveBooking(id: string, updates: Partial<Booking>): Promise<Booking | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const dbPayload = mapBookingToDb(updates);
    const { data, error } = await sb.from('bookings').update(dbPayload).eq('id', id).select().single();
    if (error || !data) {
      console.warn('Supabase booking update error:', error);
      return null;
    }
    return mapBookingFromDb(data);
  } catch (err) {
    console.warn('Supabase booking update exception:', err);
    return null;
  }
}

export async function deleteLiveBooking(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('bookings').delete().eq('id', id);
    return !error;
  } catch (err) {
    return false;
  }
}

export async function fetchLiveRooms(): Promise<Room[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('rooms').select('*').order('room_number', { ascending: true });
    if (error || !data || data.length === 0) return null;
    return data.map(mapRoomFromDb);
  } catch (err) {
    return null;
  }
}

export async function updateLiveRoom(id: string, updates: Partial<Room>): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const payload: Record<string, any> = {};
    if (updates.status) payload.status = updates.status;
    if (updates.price) payload.base_price = updates.price;
    if (updates.name) payload.title = updates.name;
    const { error } = await sb.from('rooms').update(payload).eq('id', id);
    return !error;
  } catch (err) {
    return false;
  }
}

export async function fetchLiveGuests(): Promise<Guest[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('guests').select('*').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return null;
    return data.map(mapGuestFromDb);
  } catch (err) {
    return null;
  }
}

export async function fetchLivePayments(): Promise<PaymentDisplayRecord[] | null> {
  const sb = getSupabase();
  if (!sb) return null;
  try {
    const { data, error } = await sb.from('payments').select('*').order('created_at', { ascending: false });
    if (error || !data || data.length === 0) return null;
    return data.map(mapPaymentFromDb);
  } catch (err) {
    return null;
  }
}

export async function updateLivePaymentRefund(paymentId: string, refundId: string, amount: number): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    const { error } = await sb.from('payments').update({
      status: 'REFUNDED',
      refund_id: refundId,
      refund_amount: amount,
    }).or(`id.eq.${paymentId},razorpay_payment_id.eq.${paymentId}`);
    return !error;
  } catch (err) {
    return false;
  }
}

export async function updateLivePaymentSettlement(bookingId: string, paymentId?: string, method = 'POS Card'): Promise<boolean> {
  const sb = getSupabase();
  if (!sb) return false;
  try {
    await sb.from('bookings').update({ payment_status: 'PAID' }).eq('id', bookingId);
    if (paymentId) {
      await sb.from('payments').update({ status: 'PAID', method }).or(`id.eq.${paymentId},booking_id.eq.${bookingId}`);
    }
    return true;
  } catch (err) {
    return false;
  }
}

export async function fetchLiveBookingNotifications(bookingId: string): Promise<NotificationLog[]> {
  const sb = getSupabase();
  if (!sb) return [];
  try {
    const { data, error } = await sb.from('booking_notifications').select('*').eq('booking_id', bookingId);
    if (error || !data) return [];
    return data.map((n: any) => ({
      id: n.id,
      booking_id: n.booking_id,
      channel: n.notification_type === 'EMAIL' ? 'email' : 'sms',
      recipient: n.recipient,
      message_type: 'Booking Confirmation',
      status: n.status || 'SENT',
      payload: {},
      provider_response: { messageId: n.provider_message_id },
      error_message: n.error_message || undefined,
      attempts: 1,
      created_at: n.created_at || new Date().toISOString(),
    }));
  } catch (err) {
    return [];
  }
}

export function subscribeToTable(
  tableName: string,
  callback: (payload: any) => void
): () => void {
  const sb = getSupabase();
  if (!sb) return () => {};

  const channel = sb
    .channel(`admin:${tableName}_channel_${Math.random().toString(36).substring(2, 7)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: tableName },
      (payload) => {
        if (callback) callback(payload);
      }
    )
    .subscribe();

  return () => {
    sb.removeChannel(channel);
  };
}

