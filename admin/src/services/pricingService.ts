/**
 * NOVA HOUSE Admin Portal · Pricing & Tariff Service
 * Updates room base rates and multipliers directly in Supabase (public.rooms & public.hotel_config)
 */

import { getSupabase } from './supabase';
import { Room } from '../types';

export interface RoomPricing {
  id: string;
  roomType: string;
  basePrice: number;
  weekendPrice: number;
  peakPrice: number;
  discountPercentage: number;
  currentPrice: number;
}

const STORAGE_KEY = 'nova_admin_room_pricings';

const defaultPricings: RoomPricing[] = [
  { id: 'PRC-01', roomType: 'Deluxe Room', basePrice: 18500, weekendPrice: 21500, peakPrice: 25000, discountPercentage: 10, currentPrice: 16650 },
  { id: 'PRC-02', roomType: 'Premier Room', basePrice: 24000, weekendPrice: 28000, peakPrice: 32000, discountPercentage: 8, currentPrice: 22080 },
  { id: 'PRC-03', roomType: 'Junior Suite (Nova Suite)', basePrice: 38000, weekendPrice: 44000, peakPrice: 52000, discountPercentage: 12, currentPrice: 33440 },
  { id: 'PRC-04', roomType: 'Terrace Garden Suite', basePrice: 48000, weekendPrice: 56000, peakPrice: 65000, discountPercentage: 10, currentPrice: 43200 },
  { id: 'PRC-05', roomType: 'The Bengaluru Penthouse', basePrice: 85000, weekendPrice: 98000, peakPrice: 120000, discountPercentage: 15, currentPrice: 72250 },
  { id: 'PRC-06', roomType: 'Courtyard Verandah', basePrice: 16500, weekendPrice: 19000, peakPrice: 22000, discountPercentage: 10, currentPrice: 14850 },
];

export async function getPricings(): Promise<RoomPricing[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb
        .from('hotel_config')
        .select('data')
        .eq('key', 'pricing_matrix')
        .single();
      if (!error && data && Array.isArray(data.data) && data.data.length > 0) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data.data));
        return data.data;
      }
    } catch (e) {}
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {}
  }
  return defaultPricings;
}

export async function savePricing(pricing: RoomPricing): Promise<void> {
  const pricings = await getPricings();
  const updated = pricings.map((p) => (p.id === pricing.id ? pricing : p));
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  // Sync to Supabase rooms table matching this room category / type
  const sb = getSupabase();
  if (sb) {
    try {
      // Update room base_price in Supabase
      if (pricing.roomType.includes('Courtyard')) {
        await sb.from('rooms').update({ base_price: pricing.basePrice }).ilike('type_code', '%courtyard%');
      } else if (pricing.roomType.includes('Deluxe')) {
        await sb.from('rooms').update({ base_price: pricing.basePrice }).ilike('type_code', '%deluxe%');
      } else if (pricing.roomType.includes('Premier')) {
        await sb.from('rooms').update({ base_price: pricing.basePrice }).ilike('type_code', '%premier%');
      } else if (pricing.roomType.includes('Nova Suite')) {
        await sb.from('rooms').update({ base_price: pricing.basePrice }).ilike('type_code', '%nova-suite%');
      } else if (pricing.roomType.includes('Terrace')) {
        await sb.from('rooms').update({ base_price: pricing.basePrice }).ilike('type_code', '%terrace%');
      } else if (pricing.roomType.includes('Penthouse')) {
        await sb.from('rooms').update({ base_price: pricing.basePrice }).ilike('type_code', '%penthouse%');
      }

      // Also persist to hotel_config for instant consumer retrieval
      await sb.from('hotel_config').upsert([
        {
          key: 'pricing_matrix',
          data: updated,
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.warn('Supabase pricing sync error:', e);
    }
  }
}
