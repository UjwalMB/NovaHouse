/**
 * NOVA HOUSE Customer Interface · Promotional Offers Service
 * Fetches active promotions directly from Supabase (public.offers)
 * with real-time cross-tab synchronization and validates promo codes during checkout.
 */

import { getSupabase } from './supabase';

const FALLBACK_OFFERS = [
  {
    id: 'OFF-01',
    name: 'Weekend Urban Sanctuary Escape',
    discount: '15% Off Room Rate',
    code: 'SANCTUARY15',
    percentage: 15,
    tagline: 'Curated weekend relaxation with private terrace breakfast.',
    status: 'Active',
  },
  {
    id: 'OFF-02',
    name: 'Architectural Long Stay Residency',
    discount: '25% Off Stays of 5+ Nights',
    code: 'RESIDENCY25',
    percentage: 25,
    tagline: 'Deep restoration and dedicated workspace for extended stays.',
    status: 'Active',
  },
  {
    id: 'OFF-03',
    name: 'The Gastronomic Hearth Experience',
    discount: '₹ 5,000 Dining Credit',
    code: 'EMBERHEARTH',
    fixedDiscount: 5000,
    tagline: 'Complimentary tasting menu pairing at EMBER Restaurant.',
    status: 'Active',
  },
];

function getStoredOffers() {
  try {
    const raw = localStorage.getItem('nova_admin_offers');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  try {
    const rawLive = localStorage.getItem('nh_live_offers_cache');
    if (rawLive) {
      const parsed = JSON.parse(rawLive);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  return null;
}

function normalizeOffer(o) {
  let percentage = 0;
  let fixedDiscount = 0;
  const discountStr = String(o.discount || '');

  const percentMatch = discountStr.match(/(\d+)%/);
  if (percentMatch) {
    percentage = parseInt(percentMatch[1], 10);
  }

  const fixedMatch = discountStr.match(/₹\s*([\d,]+)/);
  if (fixedMatch) {
    fixedDiscount = parseInt(fixedMatch[1].replace(/,/g, ''), 10);
  }

  return {
    id: o.id,
    name: o.name || 'Special Promotional Offer',
    tagline: o.tagline || o.description || 'Exclusive guest privilege',
    description: o.description || '',
    discount: o.discount || (percentage ? `${percentage}% Off` : 'Special Rate'),
    code: (o.code || '').trim().toUpperCase(),
    percentage: percentage || (fixedDiscount ? 0 : 10),
    fixedDiscount,
    validUntil: o.validUntil || o.valid_until || '2026-12-31',
    applicableRooms: o.applicableRooms || o.applicable_rooms || ['All Rooms'],
    image: o.image || '',
    status: o.status || 'Active',
  };
}

export async function fetchActiveOffers() {
  const sb = getSupabase();

  if (sb) {
    try {
      const { data, error } = await sb
        .from('offers')
        .select('*')
        .eq('status', 'Active')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        try {
          localStorage.setItem('nh_live_offers_cache', JSON.stringify(data));
        } catch (e) {}
        return data.map(normalizeOffer);
      }
    } catch (e) {
      console.warn('Supabase offers query fallback:', e);
    }
  }

  // Fallback to localStorage cross-app cache
  const stored = getStoredOffers();
  if (stored) {
    const activeOnly = stored.filter((o) => (o.status || 'Active').toLowerCase() === 'active');
    if (activeOnly.length > 0) {
      return activeOnly.map(normalizeOffer);
    }
  }

  return FALLBACK_OFFERS;
}

export async function validatePromoCode(code) {
  if (!code) return null;
  const cleanCode = code.trim().toUpperCase();
  const offers = await fetchActiveOffers();
  const matched = offers.find((o) => (o.code || '').trim().toUpperCase() === cleanCode);
  return matched || null;
}

export function subscribeToOffers(callback) {
  const sb = getSupabase();
  if (!sb) return () => {};

  const channel = sb
    .channel(`customer:offers_${Math.random().toString(36).substring(2, 7)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'offers' },
      async () => {
        const updated = await fetchActiveOffers();
        if (callback) callback(updated);
      }
    )
    .subscribe();

  return () => {
    sb.removeChannel(channel);
  };
}

