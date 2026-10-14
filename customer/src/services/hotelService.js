/**
 * NOVA HOUSE Customer Interface · Hotel Configuration Service
 * Fetches dynamic hotel settings, timings, cancellation policies, and announcements
 * directly from Supabase (public.hotel_config) with real-time updates.
 */

import { getSupabase } from './supabase';

const DEFAULT_CONFIG = {
  name: 'NOVA HOUSE',
  tagline: 'A Place To Pause',
  location: 'Richmond Town, Bengaluru, India',
  email: 'concierge@novahouse.com',
  phone: '+91 80 4965 8800',
  checkInTime: '14:00',
  checkOutTime: '11:00',
  cancellationPolicy: 'Full refund up to 48 hours prior to check-in. 50% refund within 24-48 hours.',
  taxPercentage: 18,
  currency: 'INR',
  specialAnnouncement: 'Welcome to NOVA HOUSE. Experience our open charcoal hearth at EMBER.',
};

export async function fetchHotelConfig() {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('hotel_config')
        .select('*')
        .eq('key', 'hotel_info')
        .single();

      if (!error && data && data.data) {
        return {
          ...DEFAULT_CONFIG,
          ...data.data,
        };
      }
    } catch (err) {
      console.warn('Failed to fetch hotel config from Supabase:', err);
    }
  }

  // Check cached config if offline
  try {
    const raw = localStorage.getItem('nova_hotel_config');
    if (raw) {
      return { ...DEFAULT_CONFIG, ...JSON.parse(raw) };
    }
  } catch (e) {}

  return DEFAULT_CONFIG;
}

export function subscribeToHotelConfig(callback) {
  const sb = getSupabase();
  if (!sb) return () => {};

  const channel = sb
    .channel('customer:hotel_config')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'hotel_config' },
      async () => {
        const updated = await fetchHotelConfig();
        if (callback) callback(updated);
      }
    )
    .subscribe();

  return () => {
    sb.removeChannel(channel);
  };
}
