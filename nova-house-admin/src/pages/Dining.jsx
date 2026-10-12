import React, { useState, useMemo } from 'react';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Clock,
  Wine,
  Save,
  Check,
  Ban,
  Sparkles,
} from 'lucide-react';
import { initialDining } from '../data/dining';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import StatusBadge from '../components/ui/StatusBadge';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';

const categories = ['All', 'Breakfast', 'Starters', 'Main Course', 'Desserts', 'Beverages'];

export default function Dining() {
  const { addToast } = useToast();
  const [diningState, setDiningState] = useState(initialDining);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Restaurant details edit state
  const [restaurantForm, setRestaurantForm] = useState(initialDining.restaurant);
  const [hoursForm, setHoursForm] = useState(initialDining.restaurant.openingHours);

  // Menu item modal state
  const [isItemDrawerOpen, setIsItemDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    name: '',
    category: 'Main Course',
    description: '',
    price: 1200,
    availability: 'Available',
    isChefSpecial: false,
    image: 'https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=600&q=80',
  });

  // Save Restaurant Profile
  const handleSaveRestaurant = (e) => {
    e.preventDefault();
    setDiningState((prev) => ({
      ...prev,
      restaurant: {
        ...prev.restaurant,
        ...restaurantForm,
        openingHours: { ...hoursForm },
      },
    }));
    addToast('EMBER restaurant profile & timings saved.');
  };

  // Open Add Item
  const handleOpenAddItem = () => {
    setEditingItem(null);
    setItemForm({
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

  // Open Edit Item
  const handleOpenEditItem = (item) => {
    setEditingItem(item);
    setItemForm({ ...item });
    setIsItemDrawerOpen(true);
  };

  // Toggle Availability
  const handleToggleAvailability = (item) => {
    const nextStatus = item.availability === 'Available' ? 'Low Stock' : item.availability === 'Low Stock' ? 'Unavailable' : 'Available';
    setDiningState((prev) => ({
      ...prev,
      menuItems: prev.menuItems.map((m) =>
        m.id === item.id ? { ...m, availability: nextStatus } : m
      ),
    }));
    addToast(`"${item.name}" marked as ${nextStatus}.`);
  };

  // Delete Menu Item
  const handleDeleteItem = (id, name) => {
    if (window.confirm(`Delete "${name}" from EMBER menu?`)) {
      setDiningState((prev) => ({
        ...prev,
        menuItems: prev.menuItems.filter((m) => m.id !== id),
      }));
      addToast(`"${name}" deleted from menu.`);
    }
  };

  // Save Menu Item
  const handleSaveItem = (e) => {
    e.preventDefault();
    if (editingItem) {
      setDiningState((prev) => ({
        ...prev,
        menuItems: prev.menuItems.map((m) =>
          m.id === editingItem.id ? { ...m, ...itemForm } : m
        ),
      }));
      addToast(`Menu item "${itemForm.name}" updated.`);
    } else {
      const created = {
        ...itemForm,
        id: `D${Date.now()}`,
      };
      setDiningState((prev) => ({
        ...prev,
        menuItems: [created, ...prev.menuItems],
      }));
      addToast(`Menu item "${itemForm.name}" added.`);
    }
    setIsItemDrawerOpen(false);
  };

  // Filtered Menu Items
  const filteredItems = useMemo(() => {
    return diningState.menuItems.filter((m) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        m.name.toLowerCase().includes(q) ||
        m.description.toLowerCase().includes(q) ||
        m.category.toLowerCase().includes(q);

      const matchesCat =
        activeCategory === 'All' || m.category.toLowerCase() === activeCategory.toLowerCase();

      return matchesSearch && matchesCat;
    });
  }, [diningState.menuItems, searchQuery, activeCategory]);

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Gastronomy & Culinary Operations
          </span>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            EMBER Restaurant & Dining CMS
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Manage restaurant hours, tasting menus, hearth gastronomy, and apothecary cocktails.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={handleOpenAddItem}
        >
          Add Menu Dish
        </Button>
      </div>

      {/* EMBER Restaurant Core Configuration Card */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
              Flagship Hearth Dining
            </span>
            <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
              Restaurant Profile & Operating Hours
            </h3>
          </div>
          <Button variant="gold" size="sm" icon={Save} onClick={handleSaveRestaurant}>
            Save Changes
          </Button>
        </div>

        <form onSubmit={handleSaveRestaurant} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="form-group !mb-0">
                <label className="form-label">Restaurant Concept Name</label>
                <input
                  type="text"
                  value={restaurantForm.name}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })}
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Tagline</label>
                <input
                  type="text"
                  value={restaurantForm.tagline}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, tagline: e.target.value })}
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Executive Chef & Culinary Direction</label>
                <input
                  type="text"
                  value={restaurantForm.chef}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, chef: e.target.value })}
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Editorial Description</label>
                <textarea
                  rows={3}
                  value={restaurantForm.description}
                  onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })}
                  className="form-textarea text-xs"
                />
              </div>
            </div>

            {/* Operating Hours Grid */}
            <div className="space-y-4 bg-[#FAF8F5] p-5 border border-[#ECE8E0] rounded-xs">
              <span className="font-mono text-xs uppercase tracking-widest text-[#77736C] block font-semibold">
                Daily Operating Service Periods
              </span>

              <div className="grid grid-cols-2 gap-3 text-xs font-mono">
                <div className="form-group !mb-0">
                  <label className="text-[10px] uppercase text-[#77736C]">Breakfast Hours</label>
                  <input
                    type="text"
                    value={hoursForm.breakfast}
                    onChange={(e) => setHoursForm({ ...hoursForm, breakfast: e.target.value })}
                    className="form-input text-xs font-mono mt-1"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="text-[10px] uppercase text-[#77736C]">Lunch Service</label>
                  <input
                    type="text"
                    value={hoursForm.lunch}
                    onChange={(e) => setHoursForm({ ...hoursForm, lunch: e.target.value })}
                    className="form-input text-xs font-mono mt-1"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="text-[10px] uppercase text-[#77736C]">Dinner Service</label>
                  <input
                    type="text"
                    value={hoursForm.dinner}
                    onChange={(e) => setHoursForm({ ...hoursForm, dinner: e.target.value })}
                    className="form-input text-xs font-mono mt-1"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="text-[10px] uppercase text-[#77736C]">Apothecary Bar</label>
                  <input
                    type="text"
                    value={hoursForm.bar}
                    onChange={(e) => setHoursForm({ ...hoursForm, bar: e.target.value })}
                    className="form-input text-xs font-mono mt-1"
                  />
                </div>
              </div>

              <div className="pt-2 text-[11px] text-[#77736C] font-mono flex items-center justify-between">
                <span>Dining Cover Capacity: <strong>{restaurantForm.coverCapacity} Seats</strong></span>
                <span>Cellar: <strong>400 Biodynamic Labels</strong></span>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Menu Management Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="font-serif text-xl font-light uppercase text-[#111111]">
            Menu Dishes & Gastronomic Items
          </h3>
          <div className="w-full sm:w-72">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search dishes, ingredients..."
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap items-center gap-2">
          {categories.map((cat) => {
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider rounded-xs border transition-all ${
                  isActive
                    ? 'bg-[#111111] text-[#F4F1EB] border-[#111111] font-semibold shadow-xs'
                    : 'bg-[#FFFFFF] text-[#55514B] border-[#E2DDD5] hover:border-[#CDC7BC]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Menu Items Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="admin-card overflow-hidden flex flex-col justify-between"
            >
              <div>
                <div className="relative h-44 overflow-hidden border-b border-[#ECE8E0]">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-[#111111]/85 backdrop-blur-md px-2.5 py-1 text-[10px] font-mono text-[#F4F1EB] rounded-xs uppercase tracking-wider">
                    {item.category}
                  </div>
                  {item.isChefSpecial && (
                    <div className="absolute top-3 right-3 bg-[#A58A5C] text-[#111111] px-2 py-0.5 text-[9px] font-mono font-bold uppercase rounded-xs shadow-xs">
                      Special
                    </div>
                  )}
                  <div className="absolute bottom-2.5 right-2.5">
                    <StatusBadge status={item.availability} />
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="font-serif text-base font-light text-[#111111]">
                      {item.name}
                    </h4>
                    <span className="font-mono text-xs font-bold text-[#111111] shrink-0">
                      ₹ {item.price.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-[#77736C] leading-relaxed line-clamp-2">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="p-3 bg-[#FAF8F5] border-t border-[#ECE8E0] flex items-center justify-between text-xs">
                <button
                  onClick={() => handleToggleAvailability(item)}
                  className="font-mono text-[11px] text-[#A58A5C] hover:underline"
                >
                  Toggle Availability
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

      {/* Add / Edit Dish Drawer */}
      <Drawer
        isOpen={isItemDrawerOpen}
        onClose={() => setIsItemDrawerOpen(false)}
        title={editingItem ? `Edit ${itemForm.name}` : 'Add Menu Creation'}
        subtitle="EMBER Gastronomy"
        width="max-w-md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsItemDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSaveItem}>
              {editingItem ? 'Update Dish' : 'Add Dish to Menu'}
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
              placeholder="e.g. Kundapura Spiced Sea Bass"
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
            <label className="form-label">Availability Status</label>
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
            <label className="form-label">Culinary Description</label>
            <textarea
              rows={3}
              value={itemForm.description}
              onChange={(e) => setItemForm({ ...itemForm, description: e.target.value })}
              className="form-textarea text-xs"
              placeholder="Heirloom ingredients, cooking techniques, flavour profile..."
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-mono">
              <input
                type="checkbox"
                checked={itemForm.isChefSpecial}
                onChange={(e) => setItemForm({ ...itemForm, isChefSpecial: e.target.checked })}
                className="accent-[#A58A5C]"
              />
              <span>Mark as Chef's Signature Tasting Special</span>
            </label>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
