import React, { useState, useEffect, useMemo } from 'react';
import {
  Mail,
  Phone,
  Eye,
} from 'lucide-react';
import { initialGuests } from '../data/guests';
import { getGuests } from '../services/guestService';
import { useBookings } from '../hooks/useBookings';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';
import Drawer from '../components/ui/Drawer';
import Button from '../components/ui/Button';
import { Guest } from '../types';

export default function Guests() {
  const { bookings } = useBookings();
  const [baseGuests, setBaseGuests] = useState<Guest[]>(initialGuests);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  useEffect(() => {
    async function load() {
      try {
        const live = await getGuests();
        if (live && live.length > 0) {
          setBaseGuests(live);
        }
      } catch (e) {}
    }
    load();
  }, []);

  // Merge base guests with any live bookings made by customers
  const guests = useMemo(() => {
    const guestMap = new Map<string, Guest>();

    // 1. Seed with base guests
    baseGuests.forEach((g) => {
      const key = (g.email || g.phone || g.id).toLowerCase();
      guestMap.set(key, { ...g });
    });

    // 2. Enrich/Upsert from all customer bookings
    bookings.forEach((b) => {
      if (!b.guestName && !b.guestEmail && !b.guestPhone) return;
      const key = (b.guestEmail || b.guestPhone || b.id).toLowerCase();
      if (guestMap.has(key)) {
        const existing = guestMap.get(key)!;
        const historySet = new Set(existing.history || []);
        historySet.add(b.id);
        const stays = historySet.size;
        guestMap.set(key, {
          ...existing,
          name: b.guestName || existing.name,
          phone: b.guestPhone || existing.phone,
          email: b.guestEmail || existing.email,
          country: b.guestCountry || existing.country,
          totalStays: Math.max(existing.totalStays, stays),
          totalSpent: (existing.totalSpent || 0) + (b.totalAmount || 0),
          lastStay: b.checkIn > existing.lastStay ? b.checkIn : existing.lastStay,
          notes: b.specialRequests ? `${existing.notes ? existing.notes + ' · ' : ''}Special Req: ${b.specialRequests}` : existing.notes,
          history: Array.from(historySet),
        });
      } else {
        const isVip = (b.totalAmount || 0) >= 100000;
        guestMap.set(key, {
          id: `gst_${b.id}`,
          name: b.guestName || 'Patron Guest',
          email: b.guestEmail || '',
          phone: b.guestPhone || '',
          country: b.guestCountry || 'India',
          city: 'Bengaluru',
          totalStays: 1,
          totalSpent: b.totalAmount || 0,
          lastStay: b.checkIn || new Date().toISOString().split('T')[0],
          status: isVip ? 'VIP' : 'New Guest',
          tier: isVip ? 'VIP Member' : 'Member',
          preferences: [b.roomType, 'Direct Online Reservation'],
          notes: b.specialRequests || 'Direct web reservation',
          history: [b.id],
        });
      }
    });

    return Array.from(guestMap.values());
  }, [baseGuests, bookings]);

  // Selected Guest Drawer
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);

  // Filter calculations
  const filteredGuests = useMemo(() => {
    return guests.filter((g) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        g.name.toLowerCase().includes(q) ||
        g.email.toLowerCase().includes(q) ||
        g.phone.toLowerCase().includes(q) ||
        g.country.toLowerCase().includes(q);

      const matchesTier =
        tierFilter === 'all' ||
        g.status.toLowerCase() === tierFilter.toLowerCase();

      return matchesSearch && matchesTier;
    });
  }, [guests, searchQuery, tierFilter]);

  const columns: Column<Guest>[] = [
    {
      header: 'Guest',
      key: 'name',
      render: (g: Guest) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#111111] text-[#A58A5C] flex items-center justify-center font-serif text-xs font-semibold shrink-0">
            {g.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div>
            <div className="font-medium text-[#111111]">{g.name}</div>
            <div className="text-[10px] text-[#A58A5C] font-mono">{g.tier}</div>
          </div>
        </div>
      ),
    },
    {
      header: 'Email',
      key: 'email',
      render: (g: Guest) => <span className="font-mono text-xs">{g.email}</span>,
    },
    {
      header: 'Phone',
      key: 'phone',
      render: (g: Guest) => <span className="font-mono text-xs">{g.phone}</span>,
    },
    {
      header: 'Country',
      key: 'country',
      render: (g: Guest) => (
        <span className="text-xs">
          {g.city ? `${g.city}, ` : ''}{g.country}
        </span>
      ),
    },
    {
      header: 'Total Stays',
      key: 'totalStays',
      render: (g: Guest) => (
        <span className="font-mono text-xs font-semibold text-[#111111]">
          {g.totalStays} Stays
        </span>
      ),
    },
    {
      header: 'Last Stay',
      key: 'lastStay',
      render: (g: Guest) => <span className="font-mono text-xs text-[#77736C]">{g.lastStay}</span>,
    },
    {
      header: 'Status',
      key: 'status',
      render: (g: Guest) => <StatusBadge status={g.status} />,
    },
    {
      header: 'Actions',
      key: 'actions',
      align: 'right',
      render: (g: Guest) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedGuest(g);
          }}
          className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs"
          title="View Guest CRM Profile"
        >
          <Eye size={15} />
        </button>
      ),
    },
  ];

  const tierOptions = [
    { label: 'All Patrons', value: 'all', count: guests.length },
    { label: 'VIP Members', value: 'VIP', count: guests.filter((g) => g.status === 'VIP').length },
    { label: 'Regulars', value: 'Regular', count: guests.filter((g) => g.status === 'Regular').length },
    { label: 'New Guests', value: 'New Guest', count: guests.filter((g) => g.status === 'New Guest').length },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Guest Relations & Loyalty CRM
          </span>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Guest Directory & Profiles
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Maintain guest histories, bespoke suite preferences, and VIP patron dossiers.
          </p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="overflow-x-auto pb-1">
        <FilterBar
          options={tierOptions}
          activeValue={tierFilter}
          onChange={setTierFilter}
        />
      </div>

      {/* Search Bar */}
      <div className="admin-card p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-80">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by patron name, country, email..."
          />
        </div>
        <div className="text-xs font-mono text-[#77736C]">
          Showing <strong className="text-[#111111]">{filteredGuests.length}</strong> of {guests.length} guest records
        </div>
      </div>

      {/* Table */}
      <div className="admin-card">
        <DataTable
          columns={columns}
          data={filteredGuests}
          onRowClick={(g) => setSelectedGuest(g)}
        />
      </div>

      {/* Guest Detail Drawer */}
      <Drawer
        isOpen={!!selectedGuest}
        onClose={() => setSelectedGuest(null)}
        title={selectedGuest?.name || ''}
        subtitle={`${selectedGuest?.tier} · ${selectedGuest?.status}`}
        width="max-w-md"
        footer={
          <Button
            variant="secondary"
            size="sm"
            onClick={() => setSelectedGuest(null)}
          >
            Close Dossier
          </Button>
        }
      >
        {selectedGuest && (
          <div className="space-y-6 text-xs font-mono">
            {/* Patron Profile Header */}
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-[#111111] text-[#A58A5C] flex items-center justify-center font-serif text-base font-semibold shrink-0">
                {selectedGuest.name.split(' ').map((n) => n[0]).join('')}
              </div>
              <div>
                <div className="font-serif text-base font-normal text-[#111111]">
                  {selectedGuest.name}
                </div>
                <div className="text-[11px] text-[#A58A5C]">{selectedGuest.tier}</div>
                <div className="text-[10px] text-[#77736C]">{selectedGuest.city}, {selectedGuest.country}</div>
              </div>
            </div>

            {/* Lifetime Metrics */}
            <div className="grid grid-cols-2 gap-3 p-4 bg-[#FFFFFF] border border-[#E2DDD5] rounded-xs">
              <div>
                <span className="text-[#77736C] block text-[10px] uppercase">Lifetime Stays</span>
                <span className="font-serif text-xl text-[#111111]">{selectedGuest.totalStays}</span>
              </div>
              <div>
                <span className="text-[#77736C] block text-[10px] uppercase">Cumulative Spend</span>
                <span className="font-serif text-xl text-[#111111]">
                  ₹ {selectedGuest.totalSpent?.toLocaleString()}
                </span>
              </div>
            </div>

            {/* Contact Details */}
            <div className="space-y-2">
              <span className="text-[#77736C] block text-[10px] uppercase tracking-wider font-semibold">
                Direct Contact
              </span>
              <div className="p-3 bg-[#FAF8F5] rounded-xs border border-[#ECE8E0] space-y-1.5">
                <div className="flex items-center gap-2">
                  <Mail size={13} className="text-[#A58A5C]" />
                  <span>{selectedGuest.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={13} className="text-[#A58A5C]" />
                  <span>{selectedGuest.phone}</span>
                </div>
              </div>
            </div>

            {/* Preferences */}
            <div className="space-y-2">
              <span className="text-[#77736C] block text-[10px] uppercase tracking-wider font-semibold">
                Tailored Sanctuary Preferences
              </span>
              <div className="flex flex-wrap gap-1.5">
                {selectedGuest.preferences?.map((pref, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 bg-[#F6F2EA] text-[#111111] border border-[#A58A5C]/30 rounded-xs text-[11px]"
                  >
                    ✓ {pref}
                  </span>
                ))}
              </div>
            </div>

            {/* Concierge Notes */}
            <div className="space-y-2">
              <span className="text-[#77736C] block text-[10px] uppercase tracking-wider font-semibold">
                Internal Concierge Notes
              </span>
              <p className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs font-sans text-xs text-[#111111] leading-relaxed">
                {selectedGuest.notes}
              </p>
            </div>

            {/* Historic Booking References */}
            <div className="space-y-2">
              <span className="text-[#77736C] block text-[10px] uppercase tracking-wider font-semibold">
                Historic Reservations
              </span>
              <div className="flex flex-wrap gap-2">
                {selectedGuest.history?.map((resId) => (
                  <span
                    key={resId}
                    className="px-2 py-1 bg-[#FAF8F5] border border-[#E2DDD5] text-xs font-mono font-semibold text-[#111111]"
                  >
                    #{resId}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  );
}
