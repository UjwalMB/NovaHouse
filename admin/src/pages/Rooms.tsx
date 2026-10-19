import React, { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Users,
  Check,
  LayoutGrid,
  LayoutList,
  Layers,
  Bed,
  Maximize2,
  Sparkles,
  Wrench,
  ShieldAlert,
  Eye,
  SlidersHorizontal,
} from 'lucide-react';
import { useRooms } from '../hooks/useRooms';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';
import Drawer from '../components/ui/Drawer';
import Modal from '../components/ui/Modal';
import { Room } from '../types';
import { getRoomTypes, saveRoomType, RoomTypeConfig } from '../services/roomTypeService';

const allAmenitiesList = [
  'King Bed',
  'Twin Beds',
  'Queen Bed',
  'Wi-Fi',
  'Air Conditioning',
  'TV',
  'Mini Bar',
  'Room Service',
  'City View',
  'Courtyard View',
  'Garden View',
  'Breakfast',
  'Bathtub',
  'Balcony',
  'Private Terrace',
  'Work Desk',
  'Butler Service',
  'Airport Chauffeur',
  'Private Bar',
];

const ROOM_STATUSES = [
  'Available',
  'Occupied',
  'Reserved',
  'Dirty',
  'Cleaning',
  'Inspected',
  'Maintenance',
  'Out of Service',
] as const;

interface RoomFormData {
  name: string;
  type: string;
  category: string;
  roomNumber: string;
  floor: string;
  capacity: number;
  bedType: string;
  size: string;
  price: number;
  discountPrice?: number;
  status: string;
  image: string;
  description: string;
  amenities: string[];
}

export default function Rooms() {
  const { rooms, loading, createRoom, updateRoom, deleteRoom } = useRooms();
  const { addToast } = useToast();

  // View Mode: 'grid' vs 'table'
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [floorFilter, setFloorFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  // Room Types Config State
  const [roomTypes, setRoomTypes] = useState<RoomTypeConfig[]>([]);
  const [isRoomTypesModalOpen, setIsRoomTypesModalOpen] = useState(false);
  const [editingRoomType, setEditingRoomType] = useState<RoomTypeConfig | null>(null);

  useEffect(() => {
    setRoomTypes(getRoomTypes());
  }, []);

  // Modal / Drawer state for Add/Edit
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  // Room Details Drawer
  const [selectedRoomDetails, setSelectedRoomDetails] = useState<Room | null>(null);

  const initialFormState: RoomFormData = {
    name: '',
    type: 'Deluxe Room',
    category: 'Rooms',
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

  const [formData, setFormData] = useState<RoomFormData>(initialFormState);

  const handleOpenAdd = () => {
    setEditingRoom(null);
    setFormData(initialFormState);
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      type: room.type,
      category: room.category || 'Rooms',
      roomNumber: room.roomNumber,
      floor: room.floor,
      capacity: room.capacity,
      bedType: room.bedType,
      size: room.size,
      price: room.price,
      discountPrice: room.discountPrice,
      status: room.status,
      image: room.image,
      description: room.description,
      amenities: room.amenities || [],
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to remove room "${name}" from inventory?`)) {
      await deleteRoom(id);
      addToast(`Room ${name} removed from inventory.`);
      if (selectedRoomDetails?.id === id) {
        setSelectedRoomDetails(null);
      }
    }
  };

  const handleQuickStatusChange = async (room: Room, newStatus: string) => {
    await updateRoom(room.id, { status: newStatus as any });
    addToast(`Room #${room.roomNumber} status changed to ${newStatus}.`);
    if (selectedRoomDetails?.id === room.id) {
      setSelectedRoomDetails({ ...selectedRoomDetails, status: newStatus });
    }
  };

  const handleAmenityToggle = (amenity: string) => {
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

  const handleSubmit = async (e: React.FormEvent) => {
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

  // Save Room Type
  const handleSaveRoomType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRoomType) return;
    const updated = saveRoomType(editingRoomType);
    setRoomTypes(updated);
    addToast(`Room type "${editingRoomType.name}" saved.`);
    setEditingRoomType(null);
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

      const matchesFloor =
        floorFilter === 'all' ||
        r.floor.toLowerCase() === floorFilter.toLowerCase();

      const matchesType =
        typeFilter === 'all' ||
        r.type.toLowerCase() === typeFilter.toLowerCase();

      return matchesSearch && matchesStatus && matchesFloor && matchesType;
    });
  }, [rooms, searchQuery, statusFilter, floorFilter, typeFilter]);

  const columns: Column<Room>[] = [
    {
      header: 'Sanctuary Key & Room',
      key: 'name',
      render: (r: Room) => (
        <div className="flex items-center gap-3">
          <img
            src={r.image}
            alt={r.name}
            className="w-12 h-10 object-cover rounded-xs border border-[#E2DDD5] shrink-0"
          />
          <div>
            <div className="font-serif text-sm font-medium text-[#111111]">{r.name}</div>
            <div className="text-[10px] font-mono text-[#A58A5C]">Key #{r.roomNumber} · {r.floor}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Type',
      key: 'type',
      render: (r: Room) => (
        <div>
          <span className="text-xs font-serif text-[#111111]">{r.type}</span>
          <span className="block text-[10px] text-[#77736C] font-mono">{r.category || 'Rooms'}</span>
        </div>
      ),
    },
    {
      header: 'Dimensions & Specs',
      key: 'capacity',
      render: (r: Room) => (
        <div className="text-xs font-mono text-[#55514B] space-y-0.5">
          <div className="flex items-center gap-1">
            <Users size={11} className="text-[#A58A5C]" />
            <span>{r.capacity} Guests</span>
          </div>
          <div className="text-[10px] text-[#77736C]">{r.bedType} · {r.size}</div>
        </div>
      ),
    },
    {
      header: 'Tariff Rate',
      key: 'price',
      render: (r: Room) => (
        <div>
          <span className="font-mono text-xs font-semibold text-[#111111]">
            ₹ {r.price.toLocaleString()}
          </span>
          <span className="text-[10px] text-[#77736C] block">/ night</span>
        </div>
      ),
    },
    {
      header: 'Operational Status',
      key: 'status',
      render: (r: Room) => (
        <div onClick={(e) => e.stopPropagation()} className="flex items-center gap-2">
          <select
            value={r.status}
            onChange={(e) => handleQuickStatusChange(r, e.target.value)}
            className="text-xs font-mono py-1 px-2 border border-[#E2DDD5] bg-[#FFFFFF] rounded-xs cursor-pointer focus:outline-none focus:border-[#A58A5C]"
          >
            {ROOM_STATUSES.map((st) => (
              <option key={st} value={st}>
                {st}
              </option>
            ))}
          </select>
          <StatusBadge status={r.status} />
        </div>
      ),
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (r: Room) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setSelectedRoomDetails(r)}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs transition-colors cursor-pointer"
            title="Inspect Details"
          >
            <Eye size={14} />
          </button>
          <button
            onClick={() => handleOpenEdit(r)}
            className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs transition-colors cursor-pointer"
            title="Edit Sanctuary"
          >
            <Edit2 size={14} />
          </button>
          <button
            onClick={() => handleDelete(r.id, r.name)}
            className="p-1.5 text-[#77736C] hover:text-[#962828] hover:bg-[#FDF0F0] rounded-xs transition-colors cursor-pointer"
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
    { label: 'Dirty', value: 'Dirty', count: rooms.filter((r) => r.status === 'Dirty').length },
    { label: 'Cleaning', value: 'Cleaning', count: rooms.filter((r) => r.status === 'Cleaning').length },
    { label: 'Inspected', value: 'Inspected', count: rooms.filter((r) => r.status === 'Inspected').length },
    { label: 'Maintenance', value: 'Maintenance', count: rooms.filter((r) => r.status === 'Maintenance').length },
    { label: 'Out of Service', value: 'Out of Service', count: rooms.filter((r) => r.status === 'Out of Service').length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header with Title and Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Inventory & Asset Management
          </span>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Rooms & Suites Inventory
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Configure sanctuary specifications, live room racks, tariffs, and operational states.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* View Toggle */}
          <div className="inline-flex rounded-xs border border-[#E2DDD5] bg-[#FFFFFF] p-0.5">
            <button
              type="button"
              onClick={() => setViewMode('grid')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-xs transition-colors cursor-pointer ${
                viewMode === 'grid'
                  ? 'bg-[#111111] text-[#FFFFFF]'
                  : 'text-[#77736C] hover:text-[#111111]'
              }`}
            >
              <LayoutGrid size={13} />
              <span>Room Rack</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-xs transition-colors cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-[#111111] text-[#FFFFFF]'
                  : 'text-[#77736C] hover:text-[#111111]'
              }`}
            >
              <LayoutList size={13} />
              <span>Table View</span>
            </button>
          </div>

          <Button
            variant="secondary"
            size="sm"
            icon={Layers}
            onClick={() => setIsRoomTypesModalOpen(true)}
          >
            Room Types
          </Button>

          <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
            Add Room Key
          </Button>
        </div>
      </div>

      {/* Filter Tabs for all 8 Statuses */}
      <div className="overflow-x-auto pb-1">
        <FilterBar
          options={statusOptions}
          activeValue={statusFilter}
          onChange={setStatusFilter}
        />
      </div>

      {/* Search and Secondary Filter Row */}
      <div className="admin-card p-4 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="w-full md:w-80">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search room number, name, type..."
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Floor Filter */}
          <select
            value={floorFilter}
            onChange={(e) => setFloorFilter(e.target.value)}
            className="form-select !py-2 text-xs font-mono"
          >
            <option value="all">All Floors</option>
            <option value="1st Floor">1st Floor</option>
            <option value="2nd Floor">2nd Floor</option>
            <option value="3rd Floor">3rd Floor</option>
            <option value="4th Floor">4th Floor</option>
            <option value="5th Floor">5th Floor</option>
          </select>

          {/* Room Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-select !py-2 text-xs font-mono"
          >
            <option value="all">All Room Types</option>
            <option value="Deluxe Room">Deluxe Room</option>
            <option value="Premier Room">Premier Room</option>
            <option value="Junior Suite">Junior Suite</option>
            <option value="Executive Suite">Executive Suite</option>
            <option value="Terrace Suite">Terrace Suite</option>
            <option value="Penthouse">Penthouse</option>
            <option value="Studio">Studio</option>
          </select>
        </div>
      </div>

      {/* VIEW: VISUAL ROOM RACK / GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {filteredRooms.map((room) => {
            return (
              <div
                key={room.id}
                className="admin-card overflow-hidden group hover:border-[#A58A5C]/60 transition-all flex flex-col justify-between"
              >
                {/* Photo & Header Badge */}
                <div className="relative h-44 overflow-hidden bg-[#111111]">
                  <img
                    src={room.image}
                    alt={room.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-95"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                  {/* Room Number & Floor Top Left */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#111111]/90 backdrop-blur-xs text-[#FAF8F5] border border-white/20 rounded-xs">
                      #{room.roomNumber}
                    </span>
                    <span className="font-mono text-[10px] px-2 py-0.5 bg-[#FAF8F5]/90 backdrop-blur-xs text-[#111111] rounded-xs font-semibold">
                      {room.floor}
                    </span>
                  </div>

                  {/* Status Badge Top Right */}
                  <div className="absolute top-3 right-3">
                    <StatusBadge status={room.status} />
                  </div>

                  {/* Bottom Image Info */}
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between text-white">
                    <div>
                      <h4 className="font-serif text-base font-light tracking-wide text-white drop-shadow-xs">
                        {room.name}
                      </h4>
                      <span className="text-[11px] font-mono text-[#E2DDD5] opacity-90">
                        {room.type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Card Content & Specs */}
                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono text-[#55514B] pb-3 border-b border-[#ECE8E0]">
                    <div className="flex items-center gap-1.5">
                      <Users size={12} className="text-[#A58A5C]" />
                      <span>{room.capacity} Guests</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Bed size={12} className="text-[#A58A5C]" />
                      <span className="truncate">{room.bedType}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Maximize2 size={12} className="text-[#A58A5C]" />
                      <span>{room.size}</span>
                    </div>
                    <div>
                      <span className="text-[#77736C]">Tariff: </span>
                      <strong className="text-[#111111]">₹{room.price.toLocaleString()}</strong>
                    </div>
                  </div>

                  {/* Live Status Switcher */}
                  <div className="space-y-1">
                    <label className="text-[10px] font-mono text-[#77736C] uppercase block">
                      Operational Status:
                    </label>
                    <select
                      value={room.status}
                      onChange={(e) => handleQuickStatusChange(room, e.target.value)}
                      className="w-full text-xs font-mono py-1.5 px-2 border border-[#E2DDD5] bg-[#FAF8F5] rounded-xs cursor-pointer focus:outline-none focus:border-[#A58A5C]"
                    >
                      {ROOM_STATUSES.map((st) => (
                        <option key={st} value={st}>
                          {st}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#ECE8E0]">
                    <button
                      type="button"
                      onClick={() => setSelectedRoomDetails(room)}
                      className="text-xs font-mono text-[#A58A5C] hover:text-[#111111] flex items-center gap-1 cursor-pointer"
                    >
                      <Eye size={12} />
                      <span>Dossier</span>
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(room)}
                        className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs cursor-pointer"
                        title="Edit Sanctuary"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(room.id, room.name)}
                        className="p-1.5 text-[#77736C] hover:text-[#962828] hover:bg-[#FDF0F0] rounded-xs cursor-pointer"
                        title="Delete Room"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* VIEW: TABLE VIEW */}
      {viewMode === 'table' && (
        <div className="admin-card">
          <DataTable
            columns={columns}
            data={filteredRooms}
            loading={loading}
            onRowClick={(r) => handleOpenEdit(r)}
          />
        </div>
      )}

      {/* Room Details Drawer */}
      <Drawer
        isOpen={!!selectedRoomDetails}
        onClose={() => setSelectedRoomDetails(null)}
        title={selectedRoomDetails ? `Sanctuary #${selectedRoomDetails.roomNumber}` : ''}
        subtitle={`${selectedRoomDetails?.type} · ${selectedRoomDetails?.floor}`}
        width="max-w-xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedRoomDetails(null)}
            >
              Close
            </Button>
            <Button
              variant="primary"
              size="sm"
              icon={Edit2}
              onClick={() => {
                if (selectedRoomDetails) handleOpenEdit(selectedRoomDetails);
              }}
            >
              Edit Sanctuary
            </Button>
          </div>
        }
      >
        {selectedRoomDetails && (
          <div className="space-y-6 text-xs font-mono">
            {/* Cover Photo */}
            <div className="relative h-56 rounded-xs overflow-hidden border border-[#E2DDD5]">
              <img
                src={selectedRoomDetails.image}
                alt={selectedRoomDetails.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-3 right-3">
                <StatusBadge status={selectedRoomDetails.status} />
              </div>
            </div>

            {/* Title & Tariff Specs */}
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-serif text-lg text-[#111111]">
                    {selectedRoomDetails.name}
                  </h3>
                  <span className="text-[11px] text-[#A58A5C]">
                    Key #{selectedRoomDetails.roomNumber} · {selectedRoomDetails.floor}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-serif text-xl font-semibold text-[#111111]">
                    ₹ {selectedRoomDetails.price.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-[#77736C] block">/ night standard</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[#ECE8E0] text-[11px]">
                <div>
                  <span className="text-[#77736C] block text-[10px] uppercase">Capacity</span>
                  <strong>{selectedRoomDetails.capacity} Guests</strong>
                </div>
                <div>
                  <span className="text-[#77736C] block text-[10px] uppercase">Bed Setup</span>
                  <strong>{selectedRoomDetails.bedType}</strong>
                </div>
                <div>
                  <span className="text-[#77736C] block text-[10px] uppercase">Dimensions</span>
                  <strong>{selectedRoomDetails.size}</strong>
                </div>
              </div>
            </div>

            {/* Quick Status Control */}
            <div className="p-3 border border-[#E2DDD5] rounded-xs space-y-2">
              <span className="text-[10px] text-[#77736C] uppercase block font-semibold">
                Set Operational Status
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {ROOM_STATUSES.map((st) => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => handleQuickStatusChange(selectedRoomDetails, st)}
                    className={`px-2 py-1.5 rounded-xs text-[10px] border font-mono transition-all cursor-pointer ${
                      selectedRoomDetails.status === st
                        ? 'bg-[#111111] text-[#FFFFFF] border-[#111111] font-bold'
                        : 'bg-[#FAF8F5] hover:bg-[#FFFFFF] border-[#E2DDD5] text-[#55514B]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1">
              <span className="text-[#77736C] block text-[10px] uppercase font-semibold">
                Architectural Narrative
              </span>
              <p className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs font-sans text-xs text-[#111111] leading-relaxed">
                {selectedRoomDetails.description || 'Custom crafted sanctuary with warm acoustic treatment and hand-finished stone.'}
              </p>
            </div>

            {/* Amenities */}
            <div className="space-y-2">
              <span className="text-[#77736C] block text-[10px] uppercase font-semibold">
                Features & Included Comforts
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedRoomDetails.amenities?.map((am, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-[#F6F2EA] border border-[#A58A5C]/30 text-[#111111] rounded-xs text-[11px]"
                  >
                    ✓ {am}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>

      {/* Room Types Management Modal */}
      <Modal
        isOpen={isRoomTypesModalOpen}
        onClose={() => {
          setIsRoomTypesModalOpen(false);
          setEditingRoomType(null);
        }}
        title="Room Type Configuration"
        subtitle="Sanctuary Categories, Tariffs & Capacities"
      >
        <div className="space-y-6">
          {!editingRoomType ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#ECE8E0]">
                <span className="text-xs font-mono text-[#77736C]">
                  Configured categories across NOVA HOUSE inventory.
                </span>
                <Button
                  variant="primary"
                  size="sm"
                  icon={Plus}
                  onClick={() =>
                    setEditingRoomType({
                      id: `rt_${Date.now()}`,
                      name: '',
                      category: 'Rooms',
                      basePrice: 20000,
                      weekendPrice: 24000,
                      capacity: 2,
                      bedType: 'King Bed',
                      size: '45 m²',
                      description: '',
                      amenities: ['King Bed', 'Wi-Fi', 'Air Conditioning', 'Breakfast'],
                    })
                  }
                >
                  New Type
                </Button>
              </div>

              <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                {roomTypes.map((rt) => {
                  const keyCount = rooms.filter((r) => r.type === rt.name).length;
                  return (
                    <div
                      key={rt.id}
                      className="p-3.5 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs flex items-center justify-between gap-4 font-mono text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-sm font-semibold text-[#111111]">
                            {rt.name}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 bg-[#FFFFFF] border border-[#E2DDD5] text-[#A58A5C] rounded-xs">
                            {rt.category}
                          </span>
                        </div>
                        <div className="text-[11px] text-[#77736C]">
                          Base: ₹{rt.basePrice.toLocaleString()} · Weekend: ₹{rt.weekendPrice.toLocaleString()} · Max {rt.capacity} Guests · {rt.bedType}
                        </div>
                        <div className="text-[10px] text-[#55514B]">
                          Inventory: <strong className="text-[#111111]">{keyCount} Active Keys</strong> in Hotel
                        </div>
                      </div>

                      <Button
                        variant="secondary"
                        size="sm"
                        icon={Edit2}
                        onClick={() => setEditingRoomType({ ...rt })}
                      >
                        Edit
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Edit / Create Room Type Form */
            <form onSubmit={handleSaveRoomType} className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="form-group !mb-0">
                  <label className="form-label">Category Name</label>
                  <input
                    type="text"
                    required
                    value={editingRoomType.name}
                    onChange={(e) =>
                      setEditingRoomType({ ...editingRoomType, name: e.target.value })
                    }
                    placeholder="e.g. Royal Pavilion Suite"
                    className="form-input text-xs"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Classification</label>
                  <select
                    value={editingRoomType.category}
                    onChange={(e) =>
                      setEditingRoomType({
                        ...editingRoomType,
                        category: e.target.value as any,
                      })
                    }
                    className="form-select text-xs font-mono"
                  >
                    <option value="Rooms">Rooms</option>
                    <option value="Suites">Suites</option>
                  </select>
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Base Tariff (₹ / nt)</label>
                  <input
                    type="number"
                    required
                    value={editingRoomType.basePrice}
                    onChange={(e) =>
                      setEditingRoomType({
                        ...editingRoomType,
                        basePrice: Number(e.target.value),
                      })
                    }
                    className="form-input text-xs font-mono"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Weekend Tariff (₹ / nt)</label>
                  <input
                    type="number"
                    required
                    value={editingRoomType.weekendPrice}
                    onChange={(e) =>
                      setEditingRoomType({
                        ...editingRoomType,
                        weekendPrice: Number(e.target.value),
                      })
                    }
                    className="form-input text-xs font-mono"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Guest Capacity</label>
                  <input
                    type="number"
                    min={1}
                    max={10}
                    required
                    value={editingRoomType.capacity}
                    onChange={(e) =>
                      setEditingRoomType({
                        ...editingRoomType,
                        capacity: Number(e.target.value),
                      })
                    }
                    className="form-input text-xs font-mono"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Default Bed Setup</label>
                  <input
                    type="text"
                    required
                    value={editingRoomType.bedType}
                    onChange={(e) =>
                      setEditingRoomType({
                        ...editingRoomType,
                        bedType: e.target.value,
                      })
                    }
                    className="form-input text-xs"
                  />
                </div>
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Description</label>
                <textarea
                  rows={2}
                  value={editingRoomType.description}
                  onChange={(e) =>
                    setEditingRoomType({
                      ...editingRoomType,
                      description: e.target.value,
                    })
                  }
                  className="form-textarea text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECE8E0]">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setEditingRoomType(null)}
                >
                  Back to List
                </Button>
                <Button variant="primary" size="sm" type="submit">
                  Save Room Type
                </Button>
              </div>
            </form>
          )}
        </div>
      </Modal>

      {/* Add / Edit Room Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingRoom ? `Edit Sanctuary #${formData.roomNumber}` : 'Add New Room Key'}
        subtitle="Inventory Allocation & Specs"
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
                onChange={(e) => {
                  const selType = roomTypes.find((t) => t.name === e.target.value);
                  setFormData({
                    ...formData,
                    type: e.target.value,
                    price: selType ? selType.basePrice : formData.price,
                    bedType: selType ? selType.bedType : formData.bedType,
                    capacity: selType ? selType.capacity : formData.capacity,
                  });
                }}
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
                {ROOM_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
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
                value={formData.discountPrice || 0}
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
                    className={`flex items-center gap-2 p-2 rounded-xs border text-xs text-left transition-colors cursor-pointer ${
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
