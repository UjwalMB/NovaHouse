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

// ============================================================================
// TABLES, RESTAURANT ORDERS & ROOM SERVICE SERVICES
// ============================================================================

import { RestaurantTable, RestaurantOrder, RoomServiceOrder, OrderStatus } from '../types';
import { initialTables, initialRestaurantOrders, initialRoomServiceOrders } from '../data/dining';

const TABLES_KEY = 'nova_admin_dining_tables';
const ORDERS_KEY = 'nova_admin_dining_orders';
const RS_KEY = 'nova_admin_room_service_orders';

function getStoredTables(): RestaurantTable[] {
  const stored = localStorage.getItem(TABLES_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  localStorage.setItem(TABLES_KEY, JSON.stringify(initialTables));
  return [...(initialTables as RestaurantTable[])];
}

function saveStoredTables(tables: RestaurantTable[]) {
  localStorage.setItem(TABLES_KEY, JSON.stringify(tables));
}

function getStoredOrders(): RestaurantOrder[] {
  const stored = localStorage.getItem(ORDERS_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  localStorage.setItem(ORDERS_KEY, JSON.stringify(initialRestaurantOrders));
  return [...(initialRestaurantOrders as RestaurantOrder[])];
}

function saveStoredOrders(orders: RestaurantOrder[]) {
  localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
}

function getStoredRS(): RoomServiceOrder[] {
  const stored = localStorage.getItem(RS_KEY);
  if (stored) {
    try { return JSON.parse(stored); } catch (e) {}
  }
  localStorage.setItem(RS_KEY, JSON.stringify(initialRoomServiceOrders));
  return [...(initialRoomServiceOrders as RoomServiceOrder[])];
}

function saveStoredRS(orders: RoomServiceOrder[]) {
  localStorage.setItem(RS_KEY, JSON.stringify(orders));
}

export async function getTables(): Promise<RestaurantTable[]> {
  return getStoredTables();
}

export async function updateTable(id: string, updates: Partial<RestaurantTable>): Promise<RestaurantTable | null> {
  const tables = getStoredTables();
  const idx = tables.findIndex((t) => t.id === id);
  if (idx === -1) return null;
  tables[idx] = { ...tables[idx], ...updates };
  saveStoredTables(tables);
  return tables[idx];
}

export async function getRestaurantOrders(): Promise<RestaurantOrder[]> {
  return getStoredOrders();
}

export async function createRestaurantOrder(order: Partial<RestaurantOrder>): Promise<RestaurantOrder> {
  const orders = getStoredOrders();
  const subtotal = order.items?.reduce((s, i) => s + i.price * i.quantity, 0) || 0;
  const taxes = Math.round(subtotal * 0.18);
  const total = subtotal + taxes;

  const newOrder: RestaurantOrder = {
    id: `ORD-${Date.now().toString().slice(-4)}`,
    orderNumber: `EMB-${Math.floor(9000 + Math.random() * 1000)}`,
    tableNumber: order.tableNumber || 'T-01',
    guestName: order.guestName,
    roomNumber: order.roomNumber,
    items: order.items || [],
    subtotal,
    taxes,
    total,
    status: order.status || 'New',
    paymentStatus: order.paymentStatus || 'UNPAID',
    createdAt: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
    serverName: order.serverName || 'Staff Server',
    specialInstructions: order.specialInstructions,
    ...order,
  };

  const updated = [newOrder, ...orders];
  saveStoredOrders(updated);

  // Update table status to Occupied
  if (newOrder.tableNumber) {
    const tables = getStoredTables();
    const tIdx = tables.findIndex((t) => t.tableNumber === newOrder.tableNumber);
    if (tIdx !== -1) {
      tables[tIdx].status = 'Occupied';
      tables[tIdx].currentOrderId = newOrder.id;
      saveStoredTables(tables);
    }
  }

  return newOrder;
}

export async function updateRestaurantOrderStatus(id: string, status: OrderStatus): Promise<RestaurantOrder | null> {
  const orders = getStoredOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx].status = status;
  if (status === 'Completed' || status === 'Cancelled') {
    // Free up table
    const tables = getStoredTables();
    const tIdx = tables.findIndex((t) => t.currentOrderId === id || t.tableNumber === orders[idx].tableNumber);
    if (tIdx !== -1) {
      tables[tIdx].status = 'Available';
      tables[tIdx].currentOrderId = undefined;
      saveStoredTables(tables);
    }
  }
  saveStoredOrders(orders);
  return orders[idx];
}

export async function getRoomServiceOrders(): Promise<RoomServiceOrder[]> {
  return getStoredRS();
}

export async function createRoomServiceOrder(order: Partial<RoomServiceOrder>): Promise<RoomServiceOrder> {
  const orders = getStoredRS();
  const subtotal = order.items?.reduce((s, i) => s + i.price * i.quantity, 0) || 0;
  const taxes = Math.round(subtotal * 0.18);
  const deliveryCharge = 350;
  const total = subtotal + taxes + deliveryCharge;

  const newOrder: RoomServiceOrder = {
    id: `RS-${Date.now().toString().slice(-4)}`,
    orderNumber: `RS-${Math.floor(8000 + Math.random() * 1000)}`,
    roomNumber: order.roomNumber || '101',
    guestName: order.guestName || 'In-House Guest',
    guestPhone: order.guestPhone,
    bookingId: order.bookingId,
    items: order.items || [],
    subtotal,
    taxes,
    deliveryCharge,
    total,
    status: order.status || 'New',
    paymentStatus: order.paymentStatus || 'BILLED_TO_ROOM',
    createdAt: new Date().toLocaleString('en-US', { dateStyle: 'short', timeStyle: 'short' }),
    deliveryTimeEstimated: order.deliveryTimeEstimated || '30-40 mins',
    assignedStaff: order.assignedStaff || 'Butler Team',
    specialInstructions: order.specialInstructions,
    ...order,
  };

  const updated = [newOrder, ...orders];
  saveStoredRS(updated);
  return newOrder;
}

export async function updateRoomServiceStatus(id: string, status: OrderStatus): Promise<RoomServiceOrder | null> {
  const orders = getStoredRS();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx === -1) return null;
  orders[idx].status = status;
  saveStoredRS(orders);
  return orders[idx];
}

