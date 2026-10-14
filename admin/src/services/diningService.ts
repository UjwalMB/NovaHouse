/**
 * NOVA HOUSE Admin Portal · Dining & Menu Service
 * Synchronizes restaurant menu items and timings with Supabase (public.dining_menu)
 */

import { getSupabase } from './supabase';
import { initialDining } from '../data/dining';
import { MenuItem } from '../types';

const STORAGE_KEY = 'nova_admin_dining_menu';

function getStoredItems(): MenuItem[] {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored) as MenuItem[];
    } catch (e) {}
  }
  return [...initialDining.menuItems] as any[];
}

function saveStoredItems(items: MenuItem[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
}

let itemsCache: MenuItem[] = getStoredItems();

export async function getMenuItems(): Promise<MenuItem[]> {
  const sb = getSupabase();
  if (sb) {
    try {
      const { data, error } = await sb.from('dining_menu').select('*').order('created_at', { ascending: true });
      if (!error && data && data.length > 0) {
        const mapped: MenuItem[] = data.map((row: any) => ({
          id: row.id,
          name: row.name,
          category: row.category,
          description: row.description || '',
          price: Number(row.price || 0),
          availability: row.availability || 'Available',
          isChefSpecial: Boolean(row.is_chef_special),
          image: row.image || '',
        }));
        itemsCache = mapped;
        saveStoredItems(mapped);
        return mapped;
      }
    } catch (e) {
      console.warn('Supabase menu query fallback:', e);
    }
  }
  return [...itemsCache];
}

export async function saveMenuItem(item: Partial<MenuItem>): Promise<MenuItem> {
  const id = item.id || `D-${Date.now()}`;
  const updated: MenuItem = {
    id,
    name: item.name || 'Artisanal Dish',
    category: item.category || 'Main Course',
    description: item.description || '',
    price: Number(item.price || 500),
    availability: (item.availability as any) || 'Available',
    isChefSpecial: Boolean(item.isChefSpecial),
    image: item.image || 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  };

  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('dining_menu').upsert([
        {
          id: updated.id,
          name: updated.name,
          category: updated.category,
          description: updated.description,
          price: updated.price,
          availability: updated.availability,
          is_chef_special: updated.isChefSpecial,
          image: updated.image,
          updated_at: new Date().toISOString(),
        },
      ]);
    } catch (e) {
      console.warn('Supabase menu item upsert error:', e);
    }
  }

  itemsCache = [updated, ...itemsCache.filter((i) => i.id !== updated.id)];
  saveStoredItems(itemsCache);
  return updated;
}

export async function updateItemAvailability(id: string, nextStatus: string): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('dining_menu').update({ availability: nextStatus, updated_at: new Date().toISOString() }).eq('id', id);
    } catch (e) {}
  }

  itemsCache = itemsCache.map((i) => i.id === id ? { ...i, availability: nextStatus as any } : i);
  saveStoredItems(itemsCache);
  return true;
}

export async function deleteMenuItem(id: string): Promise<boolean> {
  const sb = getSupabase();
  if (sb) {
    try {
      await sb.from('dining_menu').delete().eq('id', id);
    } catch (e) {}
  }
  itemsCache = itemsCache.filter((i) => i.id !== id);
  saveStoredItems(itemsCache);
  return true;
}
