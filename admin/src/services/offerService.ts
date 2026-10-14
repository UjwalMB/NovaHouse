/**
 * NOVA HOUSE Admin Portal · Offers Service
 * Synchronizes promotional offers with Supabase PostgreSQL (public.offers)
 */

import { getSupabase } from './supabase';
import { initialOffers } from '../data/offers';
import { Offer } from '../types';

const STORAGE_KEY = 'nova_admin_offers';

function getStoredOffers(): Offer[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as Offer[];
    } catch (e) {}
  }
  return [...initialOffers];
}

function saveStoredOffers(offers: Offer[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(offers));
}

let offersCache: Offer[] = getStoredOffers();

export async function getOffers(): Promise<Offer[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('offers').select('*').order('created_at', { ascending: false });
      if (!error && data && data.length > 0) {
        const mapped: Offer[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          tagline: row.tagline || '',
          description: row.description || '',
          discount: row.discount || '',
          code: row.code || '',
          validFrom: row.valid_from || '',
          validUntil: row.valid_until || '',
          applicableRooms: row.applicable_rooms || ['All Rooms'],
          terms: row.terms || '',
          image: row.image || '',
          status: row.status || 'Active',
          claimedCount: Number(row.claimed_count || 0),
        }));
        offersCache = mapped;
        saveStoredOffers(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase offers query fallback:', e);
    }
  }
  return [...offersCache];
}

export async function saveOffer(offer: Partial<Offer>): Promise<Offer> {
  const id = offer.id || `OFF-${Date.now()}`;
  const applicable = Array.isArray(offer.applicableRooms)
    ? offer.applicableRooms
    : typeof offer.applicableRooms === 'string'
    ? (offer.applicableRooms as string).split(',').map((s) => s.trim())
    : ['All Suites'];

  const updated: Offer = {
    id,
    name: offer.name || 'Special Promotional Offer',
    tagline: offer.tagline || '',
    description: offer.description || '',
    discount: offer.discount || '10% Off',
    code: offer.code || 'PROMO10',
    validFrom: offer.validFrom || new Date().toISOString().split('T')[0],
    validUntil: offer.validUntil || '2026-12-31',
    applicableRooms: applicable,
    terms: offer.terms || 'Direct website reservation.',
    image: offer.image || 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
    status: (offer.status as any) || 'Active',
    claimedCount: offer.claimedCount || 0,
  };

  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('offers').upsert([
        {
          id: updated.id,
          name: updated.name,
          tagline: updated.tagline,
          description: updated.description,
          discount: updated.discount,
          code: updated.code,
          valid_from: updated.validFrom,
          valid_until: updated.validUntil,
          applicable_rooms: updated.applicableRooms,
          terms: updated.terms,
          image: updated.image,
          status: updated.status,
          claimed_count: updated.claimedCount,
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.warn('Supabase offer upsert error:', e);
    }
  }

  offersCache = [updated, ...offersCache.filter((o) => o.id !== updated.id)];
  saveStoredOffers(offersCache);
  return updated;
}

export async function deleteOffer(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('offers').delete().eq('id', id);
    } catch (e) {}
  }
  offersCache = offersCache.filter((o) => o.id !== id);
  saveStoredOffers(offersCache);
  return true;
}
