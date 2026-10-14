/**
 * NOVA HOUSE Customer Interface · Dining Menu Service
 * Fetches live dishes, categories, and prices directly from Supabase (public.dining_menu)
 * with real-time cross-tab synchronization with the hotel Admin panel.
 */

import { getSupabase } from './supabase';

const FALLBACK_MENU = [
  { id: 'D01', name: 'Mysore Charcoal Smoked Idli', category: 'Breakfast', description: 'Slow fermented heirloom red rice idlis with smoked ghee tempering and stone-ground coconut shallot chutney.', price: 650, availability: 'Available', isChefSpecial: true },
  { id: 'D02', name: 'Coorg Robusta French Toast', category: 'Breakfast', description: 'Brioche soaked in shade-grown Coorg espresso custard, served with wild Western Ghats mountain honey.', price: 850, availability: 'Available', isChefSpecial: false },
  { id: 'D03', name: 'Charred Byadgi Chili Prawns', category: 'Starters', description: 'Tiger prawns blistered over coconut charcoal, tossed in native cold-pressed coconut oil, curry leaves, and Byadgi emulsion.', price: 1450, availability: 'Available', isChefSpecial: true },
  { id: 'D04', name: 'Tender Jackfruit Tartare', category: 'Starters', description: 'Smoked green jackfruit, fermented lime kosambari, crisp amaranth crackers, and toasted black cumin.', price: 950, availability: 'Available', isChefSpecial: false },
  { id: 'D05', name: 'Kundapura Spiced Sea Bass', category: 'Main Course', description: 'Pan-seared coastal sea bass wrapped in charred banana leaf with roasted coriander, sour kokum, and neer dosa.', price: 2200, availability: 'Available', isChefSpecial: true },
  { id: 'D06', name: 'Hearth-Roasted Wild Mushroom Polenta', category: 'Main Course', description: 'Slow-cooked sorghum porridge, foraged Kodagu black morels, browned cashew butter, and crisp sage leaves.', price: 1750, availability: 'Available', isChefSpecial: false },
  { id: 'D07', name: 'Bannur Lamb Shank Pepper Pot', category: 'Main Course', description: '12-hour braised Bannur heritage lamb in tellicherry black pepper broth, served with flaky malabar parotta.', price: 2600, availability: 'Available', isChefSpecial: true },
  { id: 'D08', name: 'Filter Coffee Chocolate Mille-Feuille', category: 'Desserts', description: 'Caramelized puff pastry, dark chocolate ganache infused with estate chicory coffee, and roasted hazelnut gelato.', price: 850, availability: 'Available', isChefSpecial: false },
  { id: 'D09', name: 'Jaggery & Cardamom Soufflé', category: 'Desserts', description: 'Warm organic palm jaggery soufflé served with warm spiced coconut cream anglaise.', price: 800, availability: 'Available', isChefSpecial: true },
  { id: 'D10', name: 'Richmond botanical Highball', category: 'Beverages', description: 'Indian artisanal dry gin, vetiver cordial, clarified cucumber water, and pink peppercorn tonic.', price: 1100, availability: 'Available', isChefSpecial: true },
  { id: 'D11', name: 'Smoked Tamarind Old Fashioned', category: 'Beverages', description: 'Single malt whisky, charred tamarind jaggery syrup, Angostura bitters, and dried orange wheel.', price: 1350, availability: 'Available', isChefSpecial: false },
];

function getStoredDining() {
  try {
    const raw = localStorage.getItem('nova_admin_dining_menu');
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  try {
    const rawLive = localStorage.getItem('nh_live_dining_cache');
    if (rawLive) {
      const parsed = JSON.parse(rawLive);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  return null;
}

function normalizeMenuItem(d) {
  return {
    id: d.id,
    name: d.name || 'Artisanal Dish',
    category: d.category || 'Main Course',
    description: d.description || '',
    price: Number(d.price || 0),
    availability: d.availability || 'Available',
    isChefSpecial: Boolean(d.isChefSpecial ?? d.is_chef_special),
    image: d.image || '',
  };
}

export async function fetchLiveDiningMenu() {
  const sb = getSupabase();

  if (sb) {
    try {
      const { data, error } = await sb
        .from('dining_menu')
        .select('*')
        .order('category', { ascending: true });

      if (!error && data && data.length > 0) {
        try {
          localStorage.setItem('nh_live_dining_cache', JSON.stringify(data));
        } catch (e) {}
        return data.map(normalizeMenuItem);
      }
    } catch (e) {
      console.warn('Supabase menu query fallback:', e);
    }
  }

  // Fallback to localStorage cross-app cache
  const stored = getStoredDining();
  if (stored) {
    return stored.map(normalizeMenuItem);
  }

  return FALLBACK_MENU;
}

export function subscribeToDiningMenu(callback) {
  const sb = getSupabase();
  if (!sb) return () => {};

  const channel = sb
    .channel(`customer:dining_${Math.random().toString(36).substring(2, 7)}`)
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'dining_menu' },
      async () => {
        const updated = await fetchLiveDiningMenu();
        if (callback) callback(updated);
      }
    )
    .subscribe();

  return () => {
    sb.removeChannel(channel);
  };
}

