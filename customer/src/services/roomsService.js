/**
 * NOVA HOUSE Customer Interface · Rooms & Pricing Service
 * Synchronizes room inventory, pricing, and availability directly from Supabase (public.rooms)
 * with real-time localStorage fallback for immediate bidirectional cross-tab reactivity.
 */

import { getSupabase } from './supabase';
import { ROOMS_DATA } from '../data/hotelData';

function getFallbackPrices() {
  // Check admin pricing matrix cache
  try {
    const rawPricing = localStorage.getItem('nova_admin_room_pricings');
    if (rawPricing) {
      const parsed = JSON.parse(rawPricing);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  // Check admin rooms cache
  try {
    const rawRooms = localStorage.getItem('nova_admin_rooms');
    if (rawRooms) {
      const parsed = JSON.parse(rawRooms);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  // Check direct live rooms cache
  try {
    const rawLive = localStorage.getItem('nh_live_rooms_cache');
    if (rawLive) {
      const parsed = JSON.parse(rawLive);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  return null;
}

function mergeRoomData(editorialRooms, dbOrCachedRooms) {
  if (!dbOrCachedRooms || !Array.isArray(dbOrCachedRooms) || dbOrCachedRooms.length === 0) {
    return editorialRooms;
  }

  return editorialRooms.map((room) => {
    const matched = dbOrCachedRooms.find((item) => {
      const rId = String(item.id || '').toLowerCase();
      const rType = String(item.type_code || item.roomType || item.type || '').toLowerCase();
      const rTitle = String(item.title || item.name || '').toLowerCase();
      const edId = String(room.id || '').toLowerCase();
      const edTitle = String(room.title || '').toLowerCase();

      return (
        rId === edId ||
        rType === edId ||
        (rType && edTitle.includes(rType)) ||
        (edTitle && rTitle && (edTitle.includes(rTitle) || rTitle.includes(edTitle))) ||
        (edId.includes('signature') && (rType === 'penthouse' || rType === 'terrace-suite'))
      );
    });

    if (matched) {
      const rawPrice = matched.base_price ?? matched.basePrice ?? matched.currentPrice ?? matched.price ?? room.numericPrice;
      const livePrice = Number(rawPrice);
      const status = matched.status || 'Available';
      const isAvailable = status === 'Available';

      return {
        ...room,
        numericPrice: livePrice,
        pricePerNight: `₹ ${livePrice.toLocaleString('en-IN')}`,
        status,
        isAvailable,
        dbId: String(matched.id),
        actualRoomId: String(matched.id),
        roomNumber: String(matched.room_number || matched.id),
        typeCode: matched.type_code,
        slug: matched.slug || matched.type_code,
      };
    }
    return room;
  });
}

export { resolveRoom } from './supabase';


export async function fetchLiveRoomsCatalog() {
  const sb = getSupabase();

  if (sb) {
    try {
      const { data: dbRooms, error } = await sb
        .from('rooms')
        .select('*')
        .order('room_number', { ascending: true });

      if (!error && dbRooms && dbRooms.length > 0) {
        try {
          localStorage.setItem('nh_live_rooms_cache', JSON.stringify(dbRooms));
        } catch (e) {}
        return mergeRoomData(ROOMS_DATA, dbRooms);
      }
    } catch (err) {
      console.warn('Supabase rooms query fallback:', err);
    }
  }

  // Fallback to localStorage cross-app cache
  const cached = getFallbackPrices();
  if (cached) {
    return mergeRoomData(ROOMS_DATA, cached);
  }

  return ROOMS_DATA;
}

export function subscribeToLiveRooms(callback) {
  const sb = getSupabase();
  if (!sb) return () => {};

  const channel = sb
    .channel(`customer:rooms_${Math.random().toString(36).substring(2, 7)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'rooms' },
      async () => {
        const updated = await fetchLiveRoomsCatalog();
        if (callback) callback(updated);
      }
    )
    .subscribe();

  return () => {
    sb.removeChannel(channel);
  };
}

