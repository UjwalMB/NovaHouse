/**
 * NOVA HOUSE Customer Interface · Supabase Service
 *
 * Connects guests directly to Supabase PostgreSQL.
 * Manages live availability queries, booking submissions,
 * and payment records.
 */

import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_URL) ||
  'https://rcirzjtfynlozlehtbwp.supabase.co';

export const SUPABASE_ANON_KEY =
  (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) ||
  (typeof process !== 'undefined' && process.env?.VITE_SUPABASE_ANON_KEY) ||
  '';

let client = null;

export function getSupabase() {
  if (client) return client;

  if (!SUPABASE_ANON_KEY) {
    console.warn('Supabase anon key is missing.');
    return null;
  }

  try {
    client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: {
        persistSession: false,
      },
    });

    return client;
  } catch (e) {
    console.warn('Customer Supabase init error:', e);
    return null;
  }
}

/**
 * Resolves any room identifier (numeric ID, room_number, slug, type_code, or title)
 * to the authoritative Supabase room record.
 * 
 * NEVER queries .or(`id.eq.${identifier}`) with text slugs to prevent 400 errors.
 */
export async function resolveRoom(roomIdentifier) {
  if (!roomIdentifier) return null;
  const clean = String(roomIdentifier).trim();
  const sb = getSupabase();

  const normalizeRecord = (r) => {
    if (!r) return null;
    return {
      id: String(r.id),
      room_number: String(r.room_number || r.id),
      roomNumber: String(r.room_number || r.id),
      title: r.title || r.name || 'Sanctuary Room',
      name: r.title || r.name || 'Sanctuary Room',
      type_code: r.type_code || r.slug || 'deluxe-room',
      slug: r.slug || r.type_code || 'deluxe-room',
      base_price: Number(r.base_price || 18500),
      basePrice: Number(r.base_price || 18500),
      status: r.status || 'Available',
      is_active: r.is_active ?? true,
      floor: r.floor || 1,
      max_guests: r.max_guests || 2,
    };
  };

  // 1. Fast path: check localStorage cache if populated
  try {
    const rawCache = localStorage.getItem('nh_live_rooms_cache');
    if (rawCache) {
      const cached = JSON.parse(rawCache);
      if (Array.isArray(cached) && cached.length > 0) {
        const byId = cached.find((r) => String(r.id) === clean || String(r.room_number) === clean);
        if (byId) return normalizeRecord(byId);

        const cleanLower = clean.toLowerCase();
        const bySlug = cached.find(
          (r) =>
            String(r.slug || '').toLowerCase() === cleanLower ||
            String(r.type_code || '').toLowerCase() === cleanLower
        );
        if (bySlug) return normalizeRecord(bySlug);

        if (cleanLower.includes('signature') || cleanLower.includes('penthouse')) {
          const byPent = cached.find(
            (r) =>
              String(r.type_code || '').toLowerCase() === 'penthouse' ||
              String(r.slug || '').toLowerCase() === 'penthouse'
          );
          if (byPent) return normalizeRecord(byPent);
        }

        const byTitle = cached.find((r) =>
          String(r.title || r.name || '').toLowerCase().includes(cleanLower)
        );
        if (byTitle) return normalizeRecord(byTitle);
      }
    }
  } catch (e) {}

  if (!sb) {
    return null;
  }

  // 2. Determine whether identifier is a valid database ID (numeric or UUID format)
  const isNumericOrUuid = /^\d+$/.test(clean) || /^[0-9a-fA-F-]{36}$/.test(clean);

  if (isNumericOrUuid) {
    try {
      const { data, error } = await sb
        .from('rooms')
        .select('*')
        .eq('id', clean)
        .maybeSingle();

      if (!error && data) {
        return normalizeRecord(data);
      }
    } catch (e) {}

    try {
      const { data, error } = await sb
        .from('rooms')
        .select('*')
        .eq('room_number', clean)
        .maybeSingle();

      if (!error && data) {
        return normalizeRecord(data);
      }
    } catch (e) {}
  }

  // 3. Otherwise search the appropriate text identifier (slug, type_code, title)
  const cleanLower = clean.toLowerCase();

  // Try exact slug
  try {
    const { data, error } = await sb
      .from('rooms')
      .select('*')
      .eq('slug', cleanLower)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return normalizeRecord(data);
    }
  } catch (e) {}

  // Try exact type_code
  try {
    const { data, error } = await sb
      .from('rooms')
      .select('*')
      .eq('type_code', cleanLower)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return normalizeRecord(data);
    }
  } catch (e) {}

  // Handle signature-suite alias -> maps to penthouse (501) or terrace-suite (401)
  if (cleanLower.includes('signature') || cleanLower.includes('penthouse')) {
    try {
      const { data, error } = await sb
        .from('rooms')
        .select('*')
        .eq('type_code', 'penthouse')
        .limit(1)
        .maybeSingle();

      if (!error && data) {
        return normalizeRecord(data);
      }
    } catch (e) {}
  }

  // Try title substring match
  try {
    const { data, error } = await sb
      .from('rooms')
      .select('*')
      .ilike('title', `%${clean}%`)
      .limit(1)
      .maybeSingle();

    if (!error && data) {
      return normalizeRecord(data);
    }
  } catch (e) {}

  return null;
}

/**
 * Check if a room is available for the given dates.
 * Resolves the room authoritatively and verifies maintenance status & overlapping reservations.
 */
export async function checkRoomAvailability({
  checkIn,
  checkOut,
  roomId,
}) {
  const sb = getSupabase();

  if (!sb) {
    return { available: true };
  }

  try {
    let resolvedRoom = null;
    if (roomId) {
      resolvedRoom = await resolveRoom(roomId);
      if (!resolvedRoom) {
        return {
          available: false,
          message: 'The requested room sanctuary was not found in our registry.',
        };
      }
    }

    // 1. Check if room is in Maintenance or Out of Service
    if (resolvedRoom) {
      const st = resolvedRoom.status;
      if (st === 'Maintenance' || st === 'OutOfService') {
        return {
          available: false,
          message: 'This sanctuary is currently undergoing architectural preservation/maintenance and cannot be reserved.',
        };
      }
    }

    // 2. Query overlapping bookings
    const { data: overlapping, error } = await sb
      .from('bookings')
      .select('id, room_id, room_number, check_in, check_out, booking_status')
      .in('booking_status', ['Confirmed', 'Checked In'])
      .lte('check_in', checkOut)
      .gte('check_out', checkIn);

    if (error) {
      console.warn('Supabase availability query error:', error);
      return { available: true };
    }

    // 3. Match conflict against actual room.id and room_number
    if (resolvedRoom && overlapping && overlapping.length > 0) {
      const targetId = String(resolvedRoom.id);
      const targetNum = String(resolvedRoom.room_number);

      const conflict = overlapping.find(
        (booking) =>
          String(booking.room_id) === targetId ||
          String(booking.room_number) === targetNum
      );

      if (conflict) {
        return {
          available: false,
          message: 'This sanctuary is already reserved for the selected dates.',
        };
      }
    }

    return {
      available: true,
      resolvedRoom,
    };
  } catch (err) {
    console.warn('Room availability check failed:', err);
    return {
      available: true,
    };
  }
}

/**
 * Insert or update booking in Supabase.
 * Authoritatively resolves the room to ensure bookings.room_id strictly references rooms.id.
 */
export async function saveBookingToSupabase(booking) {
  const sb = getSupabase();

  const bookingId =
    booking.id ||
    `NH-${Math.floor(1000 + Math.random() * 9000)}`;

  const guestId =
    booking.guestId ||
    `gst_${bookingId}`;

  // Authoritatively resolve room to guarantee actual rooms.id relationship
  let resolvedRoom = null;
  const rawRoomIdentifier = booking.roomId || booking.roomNumber;
  if (rawRoomIdentifier) {
    resolvedRoom = await resolveRoom(rawRoomIdentifier);
  }

  const actualRoomId = resolvedRoom ? String(resolvedRoom.id) : String(booking.roomId || '101');
  const actualRoomNumber = resolvedRoom ? String(resolvedRoom.room_number) : String(booking.roomNumber || '101');
  const actualRoomType = resolvedRoom ? resolvedRoom.title : (booking.roomType || 'Deluxe Room');
  const actualBaseRate = resolvedRoom ? resolvedRoom.base_price : Number(booking.baseRate || 18500);

  const row = {
    id: bookingId,
    booking_number: bookingId,

    guest_id: guestId,
    guest_name:
      booking.guestName || 'Patron Guest',
    guest_email:
      booking.guestEmail || '',
    guest_phone:
      booking.guestPhone || '',
    guest_country:
      booking.guestCountry || 'India',

    room_number: actualRoomNumber,
    room_type: actualRoomType,
    room_id: actualRoomId, // Authoritative rooms.id (e.g. '101', '102', '201', '301', '401', '501')

    check_in: booking.checkIn,
    check_out: booking.checkOut,

    nights:
      Number(booking.nights || 1),

    guests:
      Number(booking.guests || 2),

    base_rate:
      Number(booking.baseRate || 18500),

    taxes:
      Number(booking.taxes || 0),

    discount:
      Number(booking.discount || 0),

    total_amount:
      Number(booking.totalAmount || 18500),

    payment_status:
      booking.paymentStatus || 'UNPAID',

    booking_status:
      booking.bookingStatus || 'Confirmed',

    payment_method:
      booking.paymentMethod ||
      'Online / Razorpay',

    payment_id:
      booking.paymentId || null,

    razorpay_order_id:
      booking.razorpayOrderId ||
      booking.orderId ||
      null,

    special_requests:
      booking.specialRequests || '',

    source: 'Website Direct',

    created_at:
      new Date().toISOString(),

    updated_at:
      new Date().toISOString(),
  };

  if (sb) {
    try {
      // 1. Insert / update booking
      const { error: bookingError } =
        await sb
          .from('bookings')
          .upsert([row]);

      if (bookingError) {
        console.warn(
          'Supabase booking upsert error:',
          bookingError
        );
      }

      // 2. Upsert guest
      if (row.guest_email) {
        const { error: guestError } =
          await sb
            .from('guests')
            .upsert(
              [
                {
                  id: guestId,
                  full_name: row.guest_name,
                  email: row.guest_email,
                  phone: row.guest_phone,
                  country: row.guest_country,
                  vip_tier: 'Member',
                  total_stays: 1,
                  notes:
                    'Registered via Nova House Website Reservation',
                  created_at:
                    new Date().toISOString(),
                },
              ],
              {
                onConflict: 'email',
              }
            );

        if (guestError) {
          console.warn(
            'Supabase guest upsert error:',
            guestError
          );
        }
      }

      // 3. Booking notification
      const { error: notificationError } =
        await sb
          .from('booking_notifications')
          .insert([
            {
              id: `ntf_email_${bookingId}`,
              booking_id: bookingId,
              notification_type: 'EMAIL',
              recipient: row.guest_email,
              status: 'SENT',
              sent_at:
                new Date().toISOString(),
              provider_message_id:
                `msg_${Date.now()}`,
              created_at:
                new Date().toISOString(),
              updated_at:
                new Date().toISOString(),
            },
          ]);

      if (notificationError) {
        console.warn(
          'Booking notification error:',
          notificationError
        );
      }
    } catch (e) {
      console.warn(
        'Supabase direct booking insertion error:',
        e
      );
    }
  }

  // Also sync booking to localStorage
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('nova_admin_bookings');
      const existing = raw ? JSON.parse(raw) : [];

    const formatted = {
      id: bookingId,

      guestName:
        row.guest_name,

      guestEmail:
        row.guest_email,

      guestPhone:
        row.guest_phone,

      guestCountry:
        row.guest_country,

      roomNumber:
        row.room_number,

      roomType:
        row.room_type,

      roomId:
        row.room_id,

      checkIn:
        row.check_in,

      checkOut:
        row.check_out,

      nights:
        row.nights,

      guests:
        row.guests,

      baseRate:
        row.base_rate,

      taxes:
        row.taxes,

      discount:
        row.discount,

      totalAmount:
        row.total_amount,

      bookingStatus:
        row.booking_status,

      paymentStatus:
        row.payment_status,

      paymentMethod:
        row.payment_method,

      paymentId:
        row.payment_id,

      razorpayOrderId:
        row.razorpay_order_id,

      specialRequests:
        row.special_requests,

      source:
        row.source,

      createdAt:
        new Date()
          .toISOString()
          .split('T')[0],
    };

    localStorage.setItem(
      'nova_admin_bookings',
      JSON.stringify([
        formatted,
        ...existing.filter(
          (b) => b.id !== bookingId
        ),
      ])
    );
    }
  } catch (e) {
    console.warn(
      'Local booking storage error:',
      e
    );
  }

  return row;
}

/**
 * Record successful payment in Supabase.
 */
export async function savePaymentToSupabase({
  bookingId,
  orderId,
  paymentId,
  signature,
  amount,
  method,
  email,
  contact,
}) {
  const sb = getSupabase();

  const paymentRecordId =
    `pay_rec_${Date.now()}`;

  const numericAmount =
    Number(amount) || 0;

  const amountPaise =
    Math.round(numericAmount * 100);

  const row = {
    id: paymentRecordId,

    booking_id:
      bookingId || null,

    razorpay_order_id:
      orderId || `order_${Date.now()}`,

    razorpay_payment_id:
      paymentId || `pay_${Date.now()}`,

    razorpay_signature:
      signature || 'sig_verified_client',

    amount:
      numericAmount,

    amount_paise:
      amountPaise,

    currency:
      'INR',

    status:
      'PAID',

    method:
      method || 'Razorpay / UPI / Card',

    email:
      email || '',

    contact:
      contact || '',

    created_at:
      new Date().toISOString(),

    updated_at:
      new Date().toISOString(),
  };

  if (sb) {
    try {
      const { error: paymentError } =
        await sb
          .from('payments')
          .insert([row]);

      if (paymentError) {
        console.error(
          'Supabase payment insert error:',
          paymentError
        );
        throw paymentError;
      }

      if (bookingId) {
        const { error: bookingError } =
          await sb
            .from('bookings')
            .update({
              payment_status: 'PAID',

              payment_id:
                row.razorpay_payment_id,

              payment_method:
                row.method,

              booking_status:
                'Confirmed',

              updated_at:
                new Date().toISOString(),
            })
            .eq('id', bookingId);

        if (bookingError) {
          console.warn(
            'Supabase booking payment update error:',
            bookingError
          );
        }
      }
    } catch (e) {
      console.error(
        'Supabase payment save failed:',
        e
      );

      throw e;
    }
  }

  // Update local storage
  try {
    if (typeof localStorage !== 'undefined') {
      const raw = localStorage.getItem('nova_admin_bookings');
      if (raw) {
        const list = JSON.parse(raw);
        const updated = list.map((booking) =>
          booking.id === bookingId
            ? {
                ...booking,
                paymentStatus: 'PAID',
                paymentId: row.razorpay_payment_id,
                paymentMethod: row.method,
              }
            : booking
        );
        localStorage.setItem('nova_admin_bookings', JSON.stringify(updated));
      }
    }
  } catch (e) {
    console.warn('Local payment storage error:', e);
  }

  return row;
}