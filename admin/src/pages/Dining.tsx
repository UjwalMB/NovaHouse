import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  UtensilsCrossed,
  LayoutGrid,
  ClipboardList,
  BookOpen,
  BellRing,
  Plus,
  Edit2,
  Trash2,
  Save,
  CheckCircle2,
  Clock,
  UserCheck,
  Eye,
  Check,
  DollarSign,
  Coffee,
  Wine,
} from 'lucide-react';
import { initialDining } from '../data/dining';
import {
  getMenuItems,
  saveMenuItem,
  updateItemAvailability,
  deleteMenuItem,
  getTables,
  updateTable,
  getRestaurantOrders,
  createRestaurantOrder,
  updateRestaurantOrderStatus,
  getRoomServiceOrders,
  createRoomServiceOrder,
  updateRoomServiceStatus,
} from '../services/diningService';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import StatusBadge from '../components/ui/StatusBadge';
import Drawer from '../components/ui/Drawer';
import Modal from '../components/ui/Modal';
import DataTable, { Column } from '../components/ui/DataTable';
import {
  MenuItem,
  RestaurantTable,
  RestaurantOrder,
  RoomServiceOrder,
  OrderStatus,
} from '../types';

const menuCategories = ['All', 'Breakfast', 'Starters', 'Main Course', 'Desserts', 'Beverages'];

export default function Dining() {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();

  // Determine active tab from current URL path
  const currentSubpath = location.pathname.split('/admin/dining/')[1] || 'tables';
  const activeTab = ['tables', 'orders', 'menu', 'room-service'].includes(currentSubpath)
    ? currentSubpath
    : 'tables';

  const handleTabChange = (tab: string) => {
    navigate(`/admin/dining/${tab}`);
  };

  // State
  const [tables, setTables] = useState<RestaurantTable[]>([]);
  const [orders, setOrders] = useState<RestaurantOrder[]>([]);
  const [roomServiceOrders, setRoomServiceOrders] = useState<RoomServiceOrder[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Restaurant profile
  const [restaurantForm, setRestaurantForm] = useState(initialDining.restaurant);
  const [hoursForm, setHoursForm] = useState(initialDining.restaurant.openingHours);

  // Menu Search & Filters
  const [menuSearch, setMenuSearch] = useState('');
  const [selectedMenuCategory, setSelectedMenuCategory] = useState('All');

  // Drawers & Modals
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [itemForm, setItemForm] = useState<MenuItem>({
    id: '',
    name: '',
    category: 'Main Course',
    description: '',
    price: 1200,
    availability: 'Available',
    isChefSpecial: false,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  });

  // Table reservation modal
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [isTableModalOpen, setIsTableModalOpen] = useState(false);
  const [tableReserveForm, setTableReserveForm] = useState({
    status: 'Reserved' as RestaurantTable['status'],
    reservedFor: '',
    reservationTime: '08:00 PM',
  });

  // New Restaurant Order Modal
  const [isNewOrderModalOpen, setIsNewOrderModalOpen] = useState(false);
  const [orderForm, setOrderForm] = useState({
    tableNumber: 'T-01',
    guestName: '',
    roomNumber: '',
    serverName: 'Vikram Nair',
    selectedItems: [] as { menuItemId: string; name: string; price: number; quantity: number }[],
    paymentStatus: 'UNPAID' as 'PAID' | 'UNPAID' | 'BILLED_TO_ROOM',
  });

  // New Room Service Modal
  const [isNewRSModalOpen, setIsNewRSModalOpen] = useState(false);
  const [rsForm, setRsForm] = useState({
    roomNumber: '101',
    guestName: '',
    deliveryTimeEstimated: '30 mins',
    assignedStaff: 'Butler Rajesh',
    selectedItems: [] as { menuItemId: string; name: string; price: number; quantity: number }[],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [tList, oList, rsList, mList] = await Promise.all([
        getTables(),
        getRestaurantOrders(),
        getRoomServiceOrders(),
        getMenuItems(),
      ]);
      setTables(tList);
      setOrders(oList);
      setRoomServiceOrders(rsList);
      setMenuItems(mList);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Save Restaurant Profile
  const handleSaveRestaurant = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('EMBER restaurant profile & timings saved.');
  };

  // Menu Handlers
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemForm({
      id: '',
      name: '',
      category: 'Main Course',
      description: '',
      price: 1200,
      availability: 'Available',
      isChefSpecial: false,
      image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
    });
    setIsItemDrawerOpen(true);
  };

  const handleOpenEditItem = (item: MenuItem) => {
    setEditingItem(item);
    setItemForm({ ...item });
    setIsItemDrawerOpen(true);
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    const nextStatus = item.availability === 'Available' ? 'Low Stock' : item.availability === 'Low Stock' ? 'Unavailable' : 'Available';
    await updateItemAvailability(item.id, nextStatus);
    setMenuItems(menuItems.map((m) => (m.id === item.id ? { ...m, availability: nextStatus } : m)));
    addToast(`"${item.name}" marked as ${nextStatus}.`);
  };

  const handleDeleteItem = async (id: string, name: string) => {
    if (window.confirm(`Delete "${name}" from EMBER menu?`)) {
      await deleteMenuItem(id);
      setMenuItems(menuItems.filter((m) => m.id !== id));
      addToast(`"${name}" deleted from menu.`);
    }
  };

  const handleSaveItem = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...itemForm,
      id: editingItem ? editingItem.id : undefined,
    };
    const saved = await saveMenuItem(payload);
    setMenuItems([saved, ...menuItems.filter((m) => m.id !== saved.id)]);
    addToast(`Menu item "${saved.name}" updated successfully.`);
    setIsItemDrawerOpen(false);
  };

  // Table Status Management
  const handleOpenTableModal = (t: RestaurantTable) => {
    setSelectedTable(t);
    setTableReserveForm({
      status: t.status,
      reservedFor: t.reservedFor || '',
      reservationTime: t.reservationTime || '08:00 PM',
    });
    setIsTableModalOpen(true);
  };

  const handleSaveTableStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    const updated = await updateTable(selectedTable.id, {
      status: tableReserveForm.status,
      reservedFor: tableReserveForm.status === 'Reserved' ? tableReserveForm.reservedFor : undefined,
      reservationTime: tableReserveForm.status === 'Reserved' ? tableReserveForm.reservationTime : undefined,
    });
    if (updated) {
      setTables(tables.map((t) => (t.id === selectedTable.id ? updated : t)));
      addToast(`Table ${selectedTable.tableNumber} status updated to ${tableReserveForm.status}.`);
      setIsTableModalOpen(false);
    }
  };

  // Orders Management
  const handleUpdateOrderStatus = async (orderId: string, status: OrderStatus) => {
    const updated = await updateRestaurantOrderStatus(orderId, status);
    if (updated) {
      setOrders(orders.map((o) => (o.id === orderId ? updated : o)));
      addToast(`Order #${updated.orderNumber} status changed to ${status}.`);
      // Reload tables to show available if order completed
      getTables().then(setTables);
    }
  };

  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = orderForm.selectedItems.length > 0 ? orderForm.selectedItems : [
      { menuItemId: '1', name: 'Charcoal Smoked Lamb Chops', price: 1650, quantity: 2 },
      { menuItemId: '2', name: 'Kokum & Jasmine Spritz', price: 650, quantity: 2 },
    ];

    const newOrder = await createRestaurantOrder({
      tableNumber: orderForm.tableNumber,
      guestName: orderForm.guestName || 'Walk-in Patron',
      roomNumber: orderForm.roomNumber,
      serverName: orderForm.serverName,
      items,
      paymentStatus: orderForm.paymentStatus,
    });

    setOrders([newOrder, ...orders]);
    addToast(`Order #${newOrder.orderNumber} generated for Table ${newOrder.tableNumber}.`);
    setIsNewOrderModalOpen(false);
    getTables().then(setTables);
  };

  // Room Service Management
  const handleUpdateRSStatus = async (id: string, status: OrderStatus) => {
    const updated = await updateRoomServiceStatus(id, status);
    if (updated) {
      setRoomServiceOrders(roomServiceOrders.map((rs) => (rs.id === id ? updated : rs)));
      addToast(`Room Service #${updated.orderNumber} marked as ${status}.`);
    }
  };

  const handleCreateRS = async (e: React.FormEvent) => {
    e.preventDefault();
    const items = rsForm.selectedItems.length > 0 ? rsForm.selectedItems : [
      { menuItemId: '1', name: 'Heirloom Tomato & Burrata Tartine', price: 950, quantity: 1 },
      { menuItemId: '2', name: 'Single Origin Cold Brew', price: 450, quantity: 2 },
    ];

    const newRS = await createRoomServiceOrder({
      roomNumber: rsForm.roomNumber,
      guestName: rsForm.guestName || 'In-House Guest',
      deliveryTimeEstimated: rsForm.deliveryTimeEstimated,
      assignedStaff: rsForm.assignedStaff,
      items,
      paymentStatus: 'BILLED_TO_ROOM',
    });

    setRoomServiceOrders([newRS, ...roomServiceOrders]);
    addToast(`In-Suite Dining order #${newRS.orderNumber} dispatched to Room #${newRS.roomNumber}.`);
    setIsNewRSModalOpen(false);
  };

  // Filtered menu items
  const filteredMenuItems = useMemo(() => {
    return menuItems.filter((m) => {
      const q = menuSearch.toLowerCase().trim();
      const matchSearch = !q || m.name.toLowerCase().includes(q) || m.description.toLowerCase().includes(q);
      const matchCat = selectedMenuCategory === 'All' || m.category.toLowerCase() === selectedMenuCategory.toLowerCase();
      return matchSearch && matchCat;
    });
  }, [menuItems, menuSearch, selectedMenuCategory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Gastronomic Operations · EMBER & In-Room Dining
          </span>
          <h1 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Dining Management
          </h1>
          <p className="text-xs text-[#77736C] mt-1">
            Restaurant floor plan, table reservations, live KDS kitchen orders, artisanal menus, and in-suite room service.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {activeTab === 'tables' && (
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsNewOrderModalOpen(true)}>
              New Table Order
            </Button>
          )}
          {activeTab === 'orders' && (
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsNewOrderModalOpen(true)}>
              Create Order
            </Button>
          )}
          {activeTab === 'menu' && (
            <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAddItem}>
              Add Menu Dish
            </Button>
          )}
          {activeTab === 'room-service' && (
            <Button variant="primary" size="sm" icon={Plus} onClick={() => setIsNewRSModalOpen(true)}>
              New Room Service
            </Button>
          )}
        </div>
      </div>

      {/* SUBMODULE NAVIGATION TABS (Tables, Orders, Menu, Room Service) */}
      <div className="flex border-b border-[#ECE8E0] gap-2 overflow-x-auto">
        <button
          onClick={() => handleTabChange('tables')}
          className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'tables'
              ? 'border-[#A58A5C] text-[#111111] font-bold bg-[#FAF8F5]'
              : 'border-transparent text-[#77736C] hover:text-[#111111]'
          }`}
        >
          <LayoutGrid size={14} className="text-[#A58A5C]" />
          <span>Tables Layout</span>
          <span className="px-1.5 py-0.2 bg-[#ECE8E0] rounded-xs text-[10px] font-semibold text-[#111111]">
            {tables.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('orders')}
          className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'orders'
              ? 'border-[#A58A5C] text-[#111111] font-bold bg-[#FAF8F5]'
              : 'border-transparent text-[#77736C] hover:text-[#111111]'
          }`}
        >
          <ClipboardList size={14} className="text-[#A58A5C]" />
          <span>Kitchen & Floor Orders</span>
          <span className="px-1.5 py-0.2 bg-[#ECE8E0] rounded-xs text-[10px] font-semibold text-[#111111]">
            {orders.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('menu')}
          className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'menu'
              ? 'border-[#A58A5C] text-[#111111] font-bold bg-[#FAF8F5]'
              : 'border-transparent text-[#77736C] hover:text-[#111111]'
          }`}
        >
          <BookOpen size={14} className="text-[#A58A5C]" />
          <span>Artisanal Menu</span>
          <span className="px-1.5 py-0.2 bg-[#ECE8E0] rounded-xs text-[10px] font-semibold text-[#111111]">
            {menuItems.length}
          </span>
        </button>

        <button
          onClick={() => handleTabChange('room-service')}
          className={`px-4 py-2.5 text-xs font-mono uppercase tracking-wider border-b-2 transition-all flex items-center gap-2 cursor-pointer whitespace-nowrap ${
            activeTab === 'room-service'
              ? 'border-[#A58A5C] text-[#111111] font-bold bg-[#FAF8F5]'
              : 'border-transparent text-[#77736C] hover:text-[#111111]'
          }`}
        >
          <BellRing size={14} className="text-[#A58A5C]" />
          <span>Room Service</span>
          <span className="px-1.5 py-0.2 bg-[#ECE8E0] rounded-xs text-[10px] font-semibold text-[#111111]">
            {roomServiceOrders.length}
          </span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. TABLES SUBMODULE */}
      {/* ========================================================================= */}
      {activeTab === 'tables' && (
        <div className="space-y-6">
          {/* Table KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="admin-card p-4 border-l-4 border-emerald-600">
              <span className="font-mono text-[10px] uppercase text-[#77736C] block">Available Tables</span>
              <span className="font-serif text-2xl font-light text-emerald-800">
                {tables.filter((t) => t.status === 'Available').length} Tables
              </span>
              <span className="text-[10px] text-[#77736C] block mt-1">Ready for seating</span>
            </div>

            <div className="admin-card p-4 border-l-4 border-blue-600">
              <span className="font-mono text-[10px] uppercase text-[#77736C] block">Occupied Dining</span>
              <span className="font-serif text-2xl font-light text-blue-800">
                {tables.filter((t) => t.status === 'Occupied').length} Tables
              </span>
              <span className="text-[10px] text-[#77736C] block mt-1">Guests dining</span>
            </div>

            <div className="admin-card p-4 border-l-4 border-purple-600">
              <span className="font-mono text-[10px] uppercase text-[#77736C] block">Reserved Covers</span>
              <span className="font-serif text-2xl font-light text-purple-800">
                {tables.filter((t) => t.status === 'Reserved').length} Tables
              </span>
              <span className="text-[10px] text-[#77736C] block mt-1">Booked for dinner service</span>
            </div>
          </div>

          {/* Table Floor Grid grouped by Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tables.map((table) => {
              let statusBorder = 'border-emerald-300 bg-emerald-50/50';
              let badgeColor = 'bg-emerald-100 text-emerald-800 border-emerald-300';
              if (table.status === 'Occupied') {
                statusBorder = 'border-blue-300 bg-blue-50/50';
                badgeColor = 'bg-blue-100 text-blue-800 border-blue-300';
              }
              if (table.status === 'Reserved') {
                statusBorder = 'border-purple-300 bg-purple-50/50';
                badgeColor = 'bg-purple-100 text-purple-800 border-purple-300';
              }

              return (
                <div
                  key={table.id}
                  onClick={() => handleOpenTableModal(table)}
                  className={`p-4 border rounded-xs transition-all hover:shadow-xs cursor-pointer space-y-3 ${statusBorder}`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-base font-bold text-[#111111]">
                      Table {table.tableNumber}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-mono font-bold rounded-xs border uppercase ${badgeColor}`}>
                      {table.status}
                    </span>
                  </div>

                  <div className="text-xs space-y-1">
                    <div className="text-[#55514B] font-mono">
                      Capacity: <strong>{table.capacity} Guests</strong>
                    </div>
                    <div className="text-[#77736C] text-[11px] font-sans">
                      Section: {table.section}
                    </div>
                  </div>

                  {table.status === 'Reserved' && table.reservedFor && (
                    <div className="p-2 bg-purple-100/60 border border-purple-200 rounded-xs text-[11px] text-purple-900 font-mono">
                      Reserved for: <strong>{table.reservedFor}</strong> ({table.reservationTime})
                    </div>
                  )}

                  {table.status === 'Occupied' && table.currentOrderId && (
                    <div className="p-2 bg-blue-100/60 border border-blue-200 rounded-xs text-[11px] text-blue-900 font-mono">
                      Active Order: <strong>{table.currentOrderId}</strong>
                    </div>
                  )}

                  <div className="pt-2 border-t border-[#ECE8E0] flex items-center justify-between text-xs font-mono">
                    <span className="text-[#A58A5C]">Click to update</span>
                    <Edit2 size={12} className="text-[#77736C]" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ORDERS SUBMODULE */}
      {/* ========================================================================= */}
      {activeTab === 'orders' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {orders.map((order) => (
              <div key={order.id} className="admin-card p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#111111] block">
                        Order #{order.orderNumber}
                      </span>
                      <span className="text-xs text-[#A58A5C] font-mono">
                        Table {order.tableNumber} {order.roomNumber && `· Room #${order.roomNumber}`}
                      </span>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  <div className="text-xs text-[#77736C] pt-1">
                    Server: <strong className="text-[#111111]">{order.serverName}</strong> · {order.createdAt}
                  </div>

                  {/* Order items */}
                  <div className="py-2.5 my-2 border-y border-[#ECE8E0] space-y-1.5 text-xs font-mono">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-[#111111]">
                          {item.quantity}x {item.name}
                        </span>
                        <span className="text-[#77736C]">₹ {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-[#77736C]">
                      <span>Subtotal:</span>
                      <span>₹ {order.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#77736C]">
                      <span>Taxes (18% GST):</span>
                      <span>₹ {order.taxes.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-[#111111] pt-1 border-t border-dashed border-[#ECE8E0]">
                      <span>Total Bill:</span>
                      <span>₹ {order.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Status Transitions */}
                <div className="pt-3 border-t border-[#ECE8E0] space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-[#77736C]">Billing:</span>
                    <span className="font-semibold text-[#111111]">{order.paymentStatus}</span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {order.status === 'New' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(order.id, 'Accepted')}
                      >
                        Accept Order
                      </Button>
                    )}
                    {order.status === 'Accepted' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(order.id, 'Preparing')}
                      >
                        Send to Kitchen
                      </Button>
                    )}
                    {order.status === 'Preparing' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(order.id, 'Ready')}
                      >
                        Mark Ready
                      </Button>
                    )}
                    {order.status === 'Ready' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateOrderStatus(order.id, 'Delivered')}
                      >
                        Serve Table
                      </Button>
                    )}
                    {order.status === 'Delivered' && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={CheckCircle2}
                        onClick={() => handleUpdateOrderStatus(order.id, 'Completed')}
                      >
                        Settle & Free Table
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. MENU SUBMODULE */}
      {/* ========================================================================= */}
      {activeTab === 'menu' && (
        <div className="space-y-6">
          {/* EMBER Restaurant Core Configuration Card */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
                  Flagship Hearth Dining
                </span>
                <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
                  EMBER Restaurant Profile & Operating Hours
                </h3>
              </div>
              <Button variant="gold" size="sm" icon={Save} onClick={handleSaveRestaurant}>
                Save Timings
              </Button>
            </div>

            <form onSubmit={handleSaveRestaurant} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="form-group !mb-0">
                    <label className="form-label">Restaurant Concept</label>
                    <input
                      type="text"
                      value={restaurantForm.name}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                  <div className="form-group !mb-0">
                    <label className="form-label">Executive Chef</label>
                    <input
                      type="text"
                      value={restaurantForm.chef}
                      onChange={(e) => setRestaurantForm({ ...restaurantForm, chef: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-mono bg-[#FAF8F5] p-4 border border-[#ECE8E0] rounded-xs">
                  <div>
                    <label className="text-[10px] text-[#77736C] uppercase">Breakfast</label>
                    <input
                      type="text"
                      value={hoursForm.breakfast}
                      onChange={(e) => setHoursForm({ ...hoursForm, breakfast: e.target.value })}
                      className="form-input text-xs font-mono mt-1"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#77736C] uppercase">Dinner</label>
                    <input
                      type="text"
                      value={hoursForm.dinner}
                      onChange={(e) => setHoursForm({ ...hoursForm, dinner: e.target.value })}
                      className="form-input text-xs font-mono mt-1"
                    />
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Menu Search & Category Filter */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-2">
              {menuCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedMenuCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-xs border transition-all cursor-pointer ${
                    selectedMenuCategory === cat
                      ? 'bg-[#111111] text-[#F4F1EB] border-[#111111] font-semibold'
                      : 'bg-white text-[#55514B] border-[#E2DDD5] hover:border-[#CDC7BC]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="w-full sm:w-72">
              <SearchBar
                value={menuSearch}
                onChange={setMenuSearch}
                placeholder="Search dishes, ingredients..."
              />
            </div>
          </div>

          {/* Menu Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredMenuItems.map((item) => (
              <div key={item.id} className="admin-card overflow-hidden flex flex-col justify-between">
                <div>
                  <div className="relative h-44 overflow-hidden border-b border-[#ECE8E0]">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-[#111111]/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-[#F4F1EB] rounded-xs uppercase">
                      {item.category}
                    </div>
                    {item.isChefSpecial && (
                      <div className="absolute top-3 right-3 bg-[#A58A5C] text-[#111111] px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-xs">
                        Chef's Special
                      </div>
                    )}
                    <div className="absolute bottom-2.5 right-2.5">
                      <StatusBadge status={item.availability} />
                    </div>
                  </div>

                  <div className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-serif text-base font-light text-[#111111]">{item.name}</h4>
                      <span className="font-mono text-xs font-bold text-[#111111] shrink-0">
                        ₹ {item.price?.toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#77736C] leading-relaxed line-clamp-2">
                      {item.description}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-[#FAF8F5] border-t border-[#ECE8E0] flex items-center justify-between text-xs">
                  <button
                    onClick={() => handleToggleAvailability(item)}
                    className="font-mono text-[11px] text-[#A58A5C] hover:underline cursor-pointer"
                  >
                    Toggle Stock
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditItem(item)}
                      className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs"
                      title="Edit Dish"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id, item.name)}
                      className="p-1.5 text-[#77736C] hover:text-[#962828] hover:bg-[#FDF0F0] rounded-xs"
                      title="Delete Dish"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. ROOM SERVICE SUBMODULE */}
      {/* ========================================================================= */}
      {activeTab === 'room-service' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roomServiceOrders.map((rs) => (
              <div key={rs.id} className="admin-card p-4 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="font-mono text-xs font-bold text-[#111111] block">
                        Room Service #{rs.orderNumber}
                      </span>
                      <span className="font-serif text-sm font-medium text-[#A58A5C]">
                        Room Key #{rs.roomNumber} · {rs.guestName}
                      </span>
                    </div>
                    <StatusBadge status={rs.status} />
                  </div>

                  <div className="text-xs text-[#77736C] font-mono pt-1">
                    ETA: <strong>{rs.deliveryTimeEstimated}</strong> · Assigned: {rs.assignedStaff}
                  </div>

                  {/* Items */}
                  <div className="py-2.5 my-2 border-y border-[#ECE8E0] space-y-1.5 text-xs font-mono">
                    {rs.items.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center">
                        <span className="text-[#111111]">{item.quantity}x {item.name}</span>
                        <span className="text-[#77736C]">₹ {(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 text-xs font-mono">
                    <div className="flex justify-between text-[#77736C]">
                      <span>Subtotal:</span>
                      <span>₹ {rs.subtotal.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-[#77736C]">
                      <span>Delivery & Tray Surcharge:</span>
                      <span>₹ {rs.deliveryCharge.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-sm font-bold text-[#111111] pt-1 border-t border-dashed border-[#ECE8E0]">
                      <span>Total (Billed to Room):</span>
                      <span>₹ {rs.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Status Transitions */}
                <div className="pt-3 border-t border-[#ECE8E0] space-y-2">
                  <div className="flex flex-wrap gap-1">
                    {rs.status === 'New' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateRSStatus(rs.id, 'Preparing')}
                      >
                        Preparing in Kitchen
                      </Button>
                    )}
                    {rs.status === 'Preparing' && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleUpdateRSStatus(rs.id, 'Delivered')}
                      >
                        Butler Out for Delivery
                      </Button>
                    )}
                    {rs.status === 'Delivered' && (
                      <Button
                        variant="primary"
                        size="sm"
                        icon={CheckCircle2}
                        onClick={() => handleUpdateRSStatus(rs.id, 'Completed')}
                      >
                        Delivered to Suite
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODALS & DRAWERS */}
      {/* ========================================================================= */}

      {/* Table Reservation Modal */}
      <Modal
        isOpen={isTableModalOpen}
        onClose={() => setIsTableModalOpen(false)}
        title={selectedTable ? `Manage Table ${selectedTable.tableNumber}` : ''}
        subtitle="Floor Seating & Reservation"
      >
        <form onSubmit={handleSaveTableStatus} className="space-y-4">
          <div className="space-y-3 text-xs">
            <div className="form-group !mb-0">
              <label className="form-label">Table Status</label>
              <select
                value={tableReserveForm.status}
                onChange={(e) => setTableReserveForm({ ...tableReserveForm, status: e.target.value as any })}
                className="form-select text-xs font-mono"
              >
                <option value="Available">Available</option>
                <option value="Occupied">Occupied (Seated)</option>
                <option value="Reserved">Reserved</option>
              </select>
            </div>

            {tableReserveForm.status === 'Reserved' && (
              <>
                <div className="form-group !mb-0">
                  <label className="form-label">Reserved Guest Name</label>
                  <input
                    type="text"
                    required
                    value={tableReserveForm.reservedFor}
                    onChange={(e) => setTableReserveForm({ ...tableReserveForm, reservedFor: e.target.value })}
                    placeholder="e.g. Rahul Bajaj VIP Party"
                    className="form-input text-xs"
                  />
                </div>
                <div className="form-group !mb-0">
                  <label className="form-label">Reservation Time</label>
                  <input
                    type="text"
                    value={tableReserveForm.reservationTime}
                    onChange={(e) => setTableReserveForm({ ...tableReserveForm, reservationTime: e.target.value })}
                    className="form-input text-xs font-mono"
                  />
                </div>
              </>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE8E0]">
            <Button variant="secondary" size="sm" onClick={() => setIsTableModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Update Table
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add / Edit Menu Item Drawer */}
      <Drawer
        isOpen={isItemDrawerOpen}
        onClose={() => setIsItemDrawerOpen(false)}
        title={editingItem ? `Edit ${itemForm.name}` : 'Add Artisanal Creation'}
        subtitle="EMBER Gastronomy & Bar"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsItemDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveItem}>
              {editingItem ? 'Update Dish' : 'Add to Menu'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSaveItem} className="space-y-4">
          <div className="form-group !mb-0">
            <label className="form-label">Dish Title</label>
            <input
              type="text"
              required
              value={itemForm.name}
              onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
              className="form-input text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group !mb-0">
              <label className="form-label">Category</label>
              <select
                value={itemForm.category}
                onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
                className="form-select text-xs font-mono"
              >
                <option>Breakfast</option>
                <option>Starters</option>
                <option>Main Course</option>
                <option>Desserts</option>
                <option>Beverages</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Price (₹)</label>
              <input
                type="number"
                required
                value={itemForm.price}
                onChange={(e) => setItemForm({ ...itemForm, price: Number(e.target.value) })}
                className="form-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Availability</label>
            <select
              value={itemForm.availability}
              onChange={(e) => setItemForm({ ...itemForm, availability: e.target.value })}
              className="form-select text-xs font-mono"
            >
              <option>Available</option>
              <option>Low Stock</option>
              <option>Unavailable</option>
            </select>
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Photography Image URL</label>
            <input
              type="url"
              value={itemForm.image}
              onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
              className="form-input text-xs"
            />
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Culinary Story / Ingredients</label>
            <textarea
              rows={3}
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              className="form-textarea text-xs"
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-mono">
              <input
                type="checkbox"
                checked={Boolean(itemForm.isChefSpecial)}
                onChange={(e) => setItemForm({ ...itemForm, isChefSpecial: e.target.checked })}
                className="accent-[#A58A5C]"
              />
              <span>Highlight as Chef's Signature Tasting Special</span>
            </label>
          </div>
        </form>
      </Drawer>

      {/* New Restaurant Order Modal */}
      <Modal
        isOpen={isNewOrderModalOpen}
        onClose={() => setIsNewOrderModalOpen(false)}
        title="Create Restaurant Order"
        subtitle="EMBER POS Dispatch"
      >
        <form onSubmit={handleCreateOrder} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="form-group !mb-0">
              <label className="form-label">Table Number</label>
              <select
                value={orderForm.tableNumber}
                onChange={(e) => setOrderForm({ ...orderForm, tableNumber: e.target.value })}
                className="form-select text-xs font-mono"
              >
                {tables.map((t) => (
                  <option key={t.id} value={t.tableNumber}>
                    Table {t.tableNumber} ({t.section} - {t.capacity}p)
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">In-House Room # (Optional)</label>
              <input
                type="text"
                value={orderForm.roomNumber}
                onChange={(e) => setOrderForm({ ...orderForm, roomNumber: e.target.value })}
                placeholder="e.g. 201"
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Guest / Party Name</label>
              <input
                type="text"
                value={orderForm.guestName}
                onChange={(e) => setOrderForm({ ...orderForm, guestName: e.target.value })}
                placeholder="Patron Name"
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Server</label>
              <input
                type="text"
                value={orderForm.serverName}
                onChange={(e) => setOrderForm({ ...orderForm, serverName: e.target.value })}
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0 col-span-2">
              <label className="form-label">Billing Settlement</label>
              <select
                value={orderForm.paymentStatus}
                onChange={(e) => setOrderForm({ ...orderForm, paymentStatus: e.target.value as any })}
                className="form-select text-xs font-mono"
              >
                <option value="UNPAID">Unpaid (Cash / Card at end of meal)</option>
                <option value="BILLED_TO_ROOM">Billed Directly to Hotel Room Dossier</option>
                <option value="PAID">Pre-paid / Settle Now</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE8E0]">
            <Button variant="secondary" size="sm" onClick={() => setIsNewOrderModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Fire Order to Kitchen
            </Button>
          </div>
        </form>
      </Modal>

      {/* New Room Service Modal */}
      <Modal
        isOpen={isNewRSModalOpen}
        onClose={() => setIsNewRSModalOpen(false)}
        title="Dispatch In-Suite Dining"
        subtitle="Butler Room Service"
      >
        <form onSubmit={handleCreateRS} className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="form-group !mb-0">
              <label className="form-label">Destination Suite / Room</label>
              <input
                type="text"
                required
                value={rsForm.roomNumber}
                onChange={(e) => setRsForm({ ...rsForm, roomNumber: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Guest Name</label>
              <input
                type="text"
                value={rsForm.guestName}
                onChange={(e) => setRsForm({ ...rsForm, guestName: e.target.value })}
                placeholder="In-House Patron"
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Estimated Delivery Time</label>
              <input
                type="text"
                value={rsForm.deliveryTimeEstimated}
                onChange={(e) => setRsForm({ ...rsForm, deliveryTimeEstimated: e.target.value })}
                placeholder="30 mins"
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Assigned Butler</label>
              <input
                type="text"
                value={rsForm.assignedStaff}
                onChange={(e) => setRsForm({ ...rsForm, assignedStaff: e.target.value })}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-3 border-t border-[#ECE8E0]">
            <Button variant="secondary" size="sm" onClick={() => setIsNewRSModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Dispatch Room Service
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
