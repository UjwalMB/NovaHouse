import React, { useState, useMemo } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  BedDouble,
  Users,
  Image as ImageIcon,
  Check,
  Search,
  Filter,
} from 'lucide-react';
import { useRooms } from '../hooks/useRooms';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable from '../components/ui/DataTable';
import Modal from '../components/ui/Modal';
import Drawer from '../components/ui/Drawer';

const allAmenitiesList = [
  'King Bed',
  'Wi-Fi',
  'Air Conditioning',
  'TV',
  'Mini Bar',
  'Room Service',
  'City View',
  'Breakfast',
  'Bathtub',
  'Balcony',
  'Work Desk',
  'Butler Service',
];

export default function Rooms() {
  const { rooms, loading, createRoom, updateRoom, deleteRoom } = useRooms();
  const { addToast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Modal / Drawer state for Add/Edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);

  const initialFormState = {
    name: '',
    type: 'Deluxe Room',
    roomNumber: '',
    floor: '1st Floor',
    capacity: 2,
    bedType: 'King Bed',
    size: '42 m²',
    price: 18500,
    discountPrice: 16500,
    status: 'Available',
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    description: '',
    amenities: ['King Bed', 'Wi-Fi', 'Air Conditioning', 'Breakfast'],
  };

  const [formData, setFormData] = useState(initialFormState);

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setFormData(initialFormState);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      ...room,
      amenities: room.amenities || [],
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id, name) => {
    if (window.confirm(`Are you sure you want to remove room "${name}" from inventory?`)) {
      await deleteRoom(id);
      addToast(`Room ${name} removed from inventory.`);
    }
  };

  const handleAmenityToggle = (amenity) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(amenity);
      return {
        ...prev,
        amenities: exists
          ? prev.amenities.filter((a) => a !== amenity)
          : [...prev.amenities, amenity],
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (editingRoom) {
      await updateRoom(editingRoom.id, formData);
      addToast(`Room ${formData.name} updated successfully.`);
    } else {
      await createRoom(formData);
      addToast(`New room ${formData.name} added to inventory.`);
    }
    setIsDrawerOpen(false);
  };

  // Filter calculations
  const filteredRooms = useMemo(() => {
    return rooms.filter((r) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.roomNumber.toLowerCase().includes(q) ||
        r.type.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === 'all' ||
        r.status.toLowerCase() === statusFilter.toLowerCase();

      const matchesCategory =
        categoryFilter === 'all' ||
        (r.category && r.category.toLowerCase() === categoryFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [rooms, searchQuery, statusFilter, categoryFilter]);

  const columns = [
    {
      header: 'Room',
      key: 'name',
      render: (r) => (
        <div className="flex items-center gap-3">
          <img
            src={r.image}
            alt={r.name}
            className="w-12 h-10 object-cover rounded-xs border border-[#E2DDD5]"
          />
          <div>
            <div className="font-serif text-sm font-medium text-[#111111]">{r.name}</div>
            <div className="text-[10px] font-mono text-[#A58A5C]">Key #{r.roomNumber}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'type',
      render: (r) => <span className="text-xs font-mono">{r.type}</span>,
    },
    {
      header: 'Floor',
      key: 'floor',
      render: (r) => <span className="text-xs font-mono">{r.floor}</span>,
    },
    {
      header: 'Capacity',
      key: 'capacity',
      render: (r) => (
        <span className="text-xs font-mono flex items-center gap-1">
          <Users size={12} className="text-[#A58A5C]" />
          <span>{r.capacity} Guests</span>
        </span>
      ),
    },
    {
      header: 'Base Tariff',
      key: 'price',
      render: (r) => (
        <div>
          <span className="font-mono text-xs font-semibold text-[#111111]">
            ₹ {r.price.toLocaleString()}
          </span>
          <span className="text-[10px] text-[#77736C] block">/ night</span>
        </div>
      ),
    },
    {
      header: 'Status',
      key: 'status',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (r) => (
        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => handleOpenEdit(r)}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs"
            title="Edit Sanctuary"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(r.id, r.name)}
            className="p-1.5 text-[#77736C] hover:text-[#962828] hover:bg-[#FDF0F0] rounded-xs"
            title="Delete Room"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ];

  const statusOptions = [
    { label: 'All', value: 'all', count: rooms.length },
    { label: 'Available', value: 'Available', count: rooms.filter((r) => r.status === 'Available').length },
    { label: 'Occupied', value: 'Occupied', count: rooms.filter((r) => r.status === 'Occupied').length },
    { label: 'Reserved', value: 'Reserved', count: rooms.filter((r) => r.status === 'Reserved').length },
    { label: 'Cleaning', value: 'Cleaning', count: rooms.filter((r) => r.status === 'Cleaning').length },
    { label: 'Maintenance', value: 'Maintenance', count: rooms.filter((r) => r.status === 'Maintenance').length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Inventory & Asset Management
          </span>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Rooms & Suites Inventory
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Configure room types, amenities, tariffs, and maintenance availability.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Add Room Key
        </Button>
      </div>

      {/* Filter Tabs */}
      <div className="overflow-x-auto pb-1">
        <FilterBar
          options={statusOptions}
          activeValue={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* Search Bar */}
      <div className="admin-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search room number, name, type..."
          />
        </div>
        <div className="text-xs font-mono text-[#77736C]">
          Showing <strong className="text-[#111111]">{filteredRooms.length}</strong> of {rooms.length} sanctuary keys
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        <DataTable
          columns={columns}
          data={filteredRooms}
          loading={loading}
          onRowClick={(r) => handleOpenEdit(r)}
        />
      </div>

      {/* Add / Edit Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingRoom ? `Edit Sanctuary ${formData.roomNumber}` : 'Add New Room Key'}
        subtitle="Inventory Allocation"
        width="max-w-xl"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSubmit}>
              {editingRoom ? 'Update Room' : 'Save Room Key'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group !mb-0">
              <label className="form-label">Room Name</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Deluxe Courtyard 105"
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Room Number / Key</label>
              <input
                type="text"
                required
                value={formData.roomNumber}
                onChange={(e) => setFormData({ ...formData, roomNumber: e.target.value })}
                placeholder="e.g. 105"
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Room Type</label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="form-select text-xs"
              >
                <option>Deluxe Room</option>
                <option>Premier Room</option>
                <option>Junior Suite</option>
                <option>Executive Suite</option>
                <option>Terrace Suite</option>
                <option>Penthouse</option>
                <option>Studio</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Floor Location</label>
              <select
                value={formData.floor}
                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                className="form-select text-xs font-mono"
              >
                <option>1st Floor</option>
                <option>2nd Floor</option>
                <option>3rd Floor</option>
                <option>4th Floor</option>
                <option>5th Floor</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Maximum Guests</label>
              <select
                value={formData.capacity}
                onChange={(e) => setFormData({ ...formData, capacity: Number(e.target.value) })}
                className="form-select text-xs font-mono"
              >
                <option value={1}>1 Guest</option>
                <option value={2}>2 Guests</option>
                <option value={3}>3 Guests</option>
                <option value={4}>4 Guests</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Bed Configuration</label>
              <input
                type="text"
                value={formData.bedType}
                onChange={(e) => setFormData({ ...formData, bedType: e.target.value })}
                placeholder="King Bed / Twin Beds"
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Room Dimensions</label>
              <input
                type="text"
                value={formData.size}
                onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                placeholder="e.g. 48 m²"
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Operational Status</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="form-select text-xs font-mono"
              >
                <option>Available</option>
                <option>Occupied</option>
                <option>Reserved</option>
                <option>Cleaning</option>
                <option>Maintenance</option>
                <option>Blocked</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Base Tariff (₹ / Night)</label>
              <input
                type="number"
                required
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Discount Tariff (₹ / Night)</label>
              <input
                type="number"
                value={formData.discountPrice}
                onChange={(e) => setFormData({ ...formData, discountPrice: Number(e.target.value) })}
                className="form-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Cover Photography URL</label>
            <input
              type="url"
              value={formData.image}
              onChange={(e) => setFormData({ ...formData, image: e.target.value })}
              className="form-input text-xs"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Architectural Description</label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Description of finishes, natural lighting, and views..."
              className="form-textarea text-xs"
            />
          </div>

          {/* Amenities Multi-Check */}
          <div className="pt-2">
            <label className="form-label block mb-2">Sanctuary Amenities & Features</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {allAmenitiesList.map((amenity) => {
                const isSelected = formData.amenities.includes(amenity);
                return (
                  <button
                    key={amenity}
                    type="button"
                    onClick={() => handleAmenityToggle(amenity)}
                    className={`flex items-center gap-2 p-2 rounded-xs border text-xs text-left transition-colors ${
                      isSelected
                        ? 'border-[#A58A5C] bg-[#F6F2EA] text-[#111111] font-medium'
                        : 'border-[#E2DDD5] bg-[#FFFFFF] text-[#77736C] hover:border-[#CDC7BC]'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-xs flex items-center justify-center text-[10px] ${
                        isSelected ? 'bg-[#A58A5C] text-white' : 'border border-[#CDC7BC]'
                      }`}
                    >
                      {isSelected && <Check size={10} />}
                    </div>
                    <span>{amenity}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </form>
      </Drawer>
    </div>
  );
}
