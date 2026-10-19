import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Mail,
  Phone,
  Eye,
  Plus,
  Download,
  Calendar,
  CreditCard,
  FileText,
  MessageSquare,
  ShieldCheck,
  Send,
  User,
  Star,
  MapPin,
  Clock,
  ExternalLink,
} from 'lucide-react';
import { initialGuests } from '../data/guests';
import { getGuests, createGuest } from '../services/guestService';
import { useBookings } from '../hooks/useBookings';
import { getGuestDocuments, uploadGuestDocument } from '../services/guestDocumentService';
import { getGuestCommunications, sendGuestCommunication } from '../services/guestCommunicationService';
import { getInvoices, getReceipts } from '../services/financeService';
import { useToast } from '../components/ui/Toast';
import SearchBar from '../components/ui/SearchBar';
import FilterBar from '../components/ui/FilterBar';
import StatusBadge from '../components/ui/StatusBadge';
import DataTable, { Column } from '../components/ui/DataTable';
import Drawer from '../components/ui/Drawer';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';
import { Guest, Booking, GuestDocument, GuestCommunication, Invoice, Receipt } from '../types';

export default function Guests() {
  const navigate = useNavigate();
  const { bookings } = useBookings();
  const { addToast } = useToast();

  const [baseGuests, setBaseGuests] = useState<Guest[]>(initialGuests);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState('all');

  // Related data for Guest 360
  const [allDocs, setAllDocs] = useState<GuestDocument[]>([]);
  const [allComms, setAllComms] = useState<GuestCommunication[]>([]);
  const [allInvoices, setAllInvoices] = useState<Invoice[]>([]);
  const [allReceipts, setAllReceipts] = useState<Receipt[]>([]);

  // Selected Guest & Active Tab for 360 View
  const [selectedGuest, setSelectedGuest] = useState<Guest | null>(null);
  const [active360Tab, setActive360Tab] = useState<'profile' | 'history' | 'finance' | 'documents' | 'communications'>('profile');

  // Add Guest Modal State
  const [isAddGuestOpen, setIsAddGuestOpen] = useState(false);
  const [newGuestForm, setNewGuestForm] = useState({
    name: '',
    email: '',
    phone: '',
    country: 'India',
    city: 'Bengaluru',
    tier: 'Member',
    preferences: 'Quiet wing, high floor',
    notes: 'Direct client profile',
  });

  // Quick Message Modal State
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [messageForm, setMessageForm] = useState({
    channel: 'Email' as 'Email' | 'SMS' | 'WhatsApp',
    type: 'Stay Courtesy' as any,
    subject: 'A warm note from NOVA HOUSE Concierge',
    content: '',
  });

  // Quick Add KYC Modal State
  const [isKycModalOpen, setIsKycModalOpen] = useState(false);
  const [kycForm, setKycForm] = useState({
    documentType: 'Passport' as any,
    documentNumber: '',
    nationality: 'Indian',
    expiryDate: '2030-12-31',
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [liveGuests, docs, comms, invs, recs] = await Promise.all([
          getGuests(),
          getGuestDocuments(),
          getGuestCommunications(),
          getInvoices(),
          getReceipts(),
        ]);
        if (liveGuests && liveGuests.length > 0) {
          setBaseGuests(liveGuests);
        }
        setAllDocs(docs);
        setAllComms(comms);
        setAllInvoices(invs);
        setAllReceipts(recs);
      } catch (e) {}
    }
    loadData();
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

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['ID,Name,Email,Phone,City,Country,TotalStays,TotalSpent,Tier,Status,LastStay'];
    const rows = filteredGuests.map(
      (g) =>
        `"${g.id}","${g.name}","${g.email}","${g.phone}","${g.city || ''}","${g.country}",${g.totalStays},${g.totalSpent},"${g.tier}","${g.status}","${g.lastStay}"`
    );
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Nova_House_Guests_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    addToast('Guest CRM directory exported successfully.');
  };

  // Add Guest Submit
  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    const created = await createGuest({
      name: newGuestForm.name,
      email: newGuestForm.email,
      phone: newGuestForm.phone,
      country: newGuestForm.country,
      city: newGuestForm.city,
      tier: newGuestForm.tier,
      status: newGuestForm.tier.includes('VIP') ? 'VIP' : 'New Guest',
      preferences: newGuestForm.preferences.split(',').map((p) => p.trim()),
      notes: newGuestForm.notes,
      totalStays: 0,
      totalSpent: 0,
      lastStay: new Date().toISOString().split('T')[0],
      history: [],
    });
    setBaseGuests((prev) => [created, ...prev]);
    addToast(`Guest profile created for ${created.name}.`);
    setIsAddGuestOpen(false);
  };

  // Send Communication to Guest
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest) return;

    const newComm = await sendGuestCommunication({
      guestId: selectedGuest.id,
      guestName: selectedGuest.name,
      channel: messageForm.channel,
      type: messageForm.type,
      subject: messageForm.subject,
      content: messageForm.content,
      sentBy: 'Front Desk Concierge',
    });

    setAllComms((prev) => [newComm, ...prev]);
    addToast(`${messageForm.channel} sent to ${selectedGuest.name}.`);
    setIsMessageModalOpen(false);
    setMessageForm({
      channel: 'Email',
      type: 'Stay Courtesy',
      subject: 'A warm note from NOVA HOUSE Concierge',
      content: '',
    });
  };

  // Add KYC Document to Guest
  const handleAddKyc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedGuest) return;

    const newDoc = await uploadGuestDocument({
      guestId: selectedGuest.id,
      guestName: selectedGuest.name,
      documentType: kycForm.documentType,
      documentNumber: kycForm.documentNumber,
      nationality: kycForm.nationality,
      expiryDate: kycForm.expiryDate,
      verificationStatus: 'Verified',
      verifiedBy: 'Front Desk Manager',
    });

    setAllDocs((prev) => [newDoc, ...prev]);
    addToast(`${kycForm.documentType} recorded for ${selectedGuest.name}.`);
    setIsKycModalOpen(false);
  };

  // Guest 360: Filtered relations
  const guestBookings = useMemo(() => {
    if (!selectedGuest) return [];
    return bookings.filter((b) => {
      const matchEmail = b.guestEmail && b.guestEmail.toLowerCase() === selectedGuest.email?.toLowerCase();
      const matchPhone = b.guestPhone && b.guestPhone === selectedGuest.phone;
      const matchName = b.guestName && b.guestName.toLowerCase() === selectedGuest.name.toLowerCase();
      const matchHistory = selectedGuest.history?.includes(b.id);
      return matchEmail || matchPhone || matchName || matchHistory;
    });
  }, [selectedGuest, bookings]);

  const guestDocs = useMemo(() => {
    if (!selectedGuest) return [];
    return allDocs.filter(
      (d) =>
        d.guestId === selectedGuest.id ||
        d.guestName.toLowerCase().includes(selectedGuest.name.toLowerCase())
    );
  }, [selectedGuest, allDocs]);

  const guestComms = useMemo(() => {
    if (!selectedGuest) return [];
    return allComms.filter(
      (c) =>
        c.guestId === selectedGuest.id ||
        c.guestName.toLowerCase().includes(selectedGuest.name.toLowerCase())
    );
  }, [selectedGuest, allComms]);

  const guestInvoices = useMemo(() => {
    if (!selectedGuest) return [];
    return allInvoices.filter(
      (i) =>
        i.guestEmail?.toLowerCase() === selectedGuest.email?.toLowerCase() ||
        i.guestName.toLowerCase().includes(selectedGuest.name.toLowerCase())
    );
  }, [selectedGuest, allInvoices]);

  const guestReceipts = useMemo(() => {
    if (!selectedGuest) return [];
    return allReceipts.filter(
      (r) =>
        r.guestEmail?.toLowerCase() === selectedGuest.email?.toLowerCase() ||
        r.guestName.toLowerCase().includes(selectedGuest.name.toLowerCase())
    );
  }, [selectedGuest, allReceipts]);

  const columns: Column<Guest>[] = [
    {
      header: 'Guest Patron',
      key: 'name',
      render: (g: Guest) => (
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-[#111111] text-[#A58A5C] flex items-center justify-center font-serif text-xs font-semibold shrink-0 border border-[#A58A5C]/40">
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
      header: 'Contact Info',
      key: 'email',
      render: (g: Guest) => (
        <div className="space-y-0.5 font-mono text-xs text-[#55514B]">
          <div className="flex items-center gap-1.5">
            <Mail size={11} className="text-[#A58A5C]" />
            <span>{g.email}</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] text-[#77736C]">
            <Phone size={11} className="text-[#A58A5C]" />
            <span>{g.phone}</span>
          </div>
        </div>
      ),
    },
    {
      header: 'Location',
      key: 'country',
      render: (g: Guest) => (
        <span className="text-xs font-mono">
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
      header: 'Cumulative Spend',
      key: 'totalSpent',
      render: (g: Guest) => (
        <span className="font-mono text-xs font-semibold text-[#111111]">
          ₹ {g.totalSpent?.toLocaleString()}
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
            setActive360Tab('profile');
          }}
          className="p-1.5 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs transition-colors cursor-pointer"
          title="Open Guest 360 Dossier"
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
            Guest Directory & 360 Profiles
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Maintain guest histories, bespoke suite preferences, KYC records, and communication logs.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={Download}
            onClick={handleExportCSV}
          >
            Export CSV
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsAddGuestOpen(true)}
          >
            Add Guest
          </Button>
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
            placeholder="Search by patron name, country, email, phone..."
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
          onRowClick={(g) => {
            setSelectedGuest(g);
            setActive360Tab('profile');
          }}
        />
      </div>

      {/* GUEST 360 DRAWER */}
      <Drawer
        isOpen={!!selectedGuest}
        onClose={() => setSelectedGuest(null)}
        title={selectedGuest?.name || ''}
        subtitle={`${selectedGuest?.tier} · Guest 360 Profile`}
        width="max-w-2xl"
        footer={
          <div className="flex items-center justify-between w-full">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setSelectedGuest(null)}
            >
              Close Dossier
            </Button>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={MessageSquare}
                onClick={() => setIsMessageModalOpen(true)}
              >
                Send Message
              </Button>
              <Button
                variant="primary"
                size="sm"
                icon={Calendar}
                onClick={() => {
                  navigate(`/admin/bookings?new=true&search=${encodeURIComponent(selectedGuest?.name || '')}`);
                }}
              >
                New Booking
              </Button>
            </div>
          </div>
        }
      >
        {selectedGuest && (
          <div className="space-y-6 text-xs font-mono">
            {/* Patron Profile Header Card */}
            <div className="p-4 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-[#111111] text-[#A58A5C] flex items-center justify-center font-serif text-lg font-semibold shrink-0 border border-[#A58A5C]/50">
                  {selectedGuest.name.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <div className="font-serif text-lg font-normal text-[#111111] flex items-center gap-2">
                    <span>{selectedGuest.name}</span>
                    {selectedGuest.status === 'VIP' && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 bg-[#A58A5C] text-white rounded-xs">
                        VIP
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#A58A5C]">{selectedGuest.tier}</div>
                  <div className="text-[10px] text-[#77736C] flex items-center gap-1 mt-0.5">
                    <MapPin size={11} />
                    <span>{selectedGuest.city}, {selectedGuest.country}</span>
                  </div>
                </div>
              </div>

              {/* Quick Contact Chips */}
              <div className="text-right space-y-1">
                <div className="text-[11px] text-[#111111]">{selectedGuest.email}</div>
                <div className="text-[10px] text-[#77736C]">{selectedGuest.phone}</div>
              </div>
            </div>

            {/* Lifetime Metrics Strip */}
            <div className="grid grid-cols-3 gap-3 p-3.5 bg-[#FFFFFF] border border-[#E2DDD5] rounded-xs text-center">
              <div>
                <span className="text-[#77736C] block text-[10px] uppercase">Lifetime Stays</span>
                <span className="font-serif text-xl text-[#111111] font-medium">
                  {selectedGuest.totalStays} Stays
                </span>
              </div>
              <div className="border-x border-[#ECE8E0]">
                <span className="text-[#77736C] block text-[10px] uppercase">Cumulative Spend</span>
                <span className="font-serif text-xl text-[#111111] font-medium">
                  ₹ {selectedGuest.totalSpent?.toLocaleString()}
                </span>
              </div>
              <div>
                <span className="text-[#77736C] block text-[10px] uppercase">Last Visited</span>
                <span className="font-serif text-base text-[#111111] font-medium">
                  {selectedGuest.lastStay}
                </span>
              </div>
            </div>

            {/* Guest 360 Tabs Navigation */}
            <div className="flex items-center gap-2 border-b border-[#E2DDD5] overflow-x-auto pb-1">
              {[
                { key: 'profile', label: 'Profile & Preferences', icon: User },
                { key: 'history', label: `Stays (${guestBookings.length})`, icon: Calendar },
                { key: 'finance', label: `Billing (${guestInvoices.length})`, icon: CreditCard },
                { key: 'documents', label: `KYC Docs (${guestDocs.length})`, icon: FileText },
                { key: 'communications', label: `Messages (${guestComms.length})`, icon: MessageSquare },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = active360Tab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActive360Tab(tab.key as any)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-mono border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                      isActive
                        ? 'border-[#111111] text-[#111111] font-bold bg-[#FAF8F5]'
                        : 'border-transparent text-[#77736C] hover:text-[#111111]'
                    }`}
                  >
                    <Icon size={12} className={isActive ? 'text-[#A58A5C]' : ''} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: PROFILE & PREFERENCES */}
            {active360Tab === 'profile' && (
              <div className="space-y-4">
                {/* Contact Information */}
                <div className="p-3.5 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-2">
                  <span className="text-[10px] text-[#77736C] uppercase font-semibold block">
                    Contact Credentials
                  </span>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-[#77736C] block text-[10px]">Email Address</span>
                      <span className="text-[#111111] font-medium">{selectedGuest.email}</span>
                    </div>
                    <div>
                      <span className="text-[#77736C] block text-[10px]">Phone Number</span>
                      <span className="text-[#111111] font-medium">{selectedGuest.phone}</span>
                    </div>
                    <div>
                      <span className="text-[#77736C] block text-[10px]">Country of Residence</span>
                      <span className="text-[#111111]">{selectedGuest.country}</span>
                    </div>
                    <div>
                      <span className="text-[#77736C] block text-[10px]">Home City</span>
                      <span className="text-[#111111]">{selectedGuest.city}</span>
                    </div>
                  </div>
                </div>

                {/* Sanctuary Preferences */}
                <div className="space-y-2">
                  <span className="text-[#77736C] block text-[10px] uppercase font-semibold">
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
                  <span className="text-[#77736C] block text-[10px] uppercase font-semibold">
                    Internal Concierge Notes
                  </span>
                  <p className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs font-sans text-xs text-[#111111] leading-relaxed">
                    {selectedGuest.notes || 'No concierge notes recorded.'}
                  </p>
                </div>
              </div>
            )}

            {/* TAB 2: STAY & BOOKING HISTORY */}
            {active360Tab === 'history' && (
              <div className="space-y-3">
                {guestBookings.length === 0 ? (
                  <div className="p-6 text-center text-[#77736C] bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                    No reservations currently linked to this guest profile.
                  </div>
                ) : (
                  guestBookings.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs flex items-center justify-between gap-4 font-mono text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#111111]">#{b.id}</span>
                          <span className="font-serif text-sm">{b.roomType}</span>
                          <StatusBadge status={b.bookingStatus} />
                        </div>
                        <div className="text-[11px] text-[#77736C]">
                          Dates: {b.checkIn} → {b.checkOut} ({b.nights || 1} nights)
                        </div>
                        <div className="text-[11px] text-[#55514B]">
                          Tariff: <strong className="text-[#111111]">₹ {b.totalAmount?.toLocaleString()}</strong> · Payment: {b.paymentStatus}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => navigate(`/admin/bookings/${b.id}`)}
                        className="p-2 border border-[#E2DDD5] bg-[#FFFFFF] hover:bg-[#F4F1EB] rounded-xs text-[#77736C] hover:text-[#111111] transition-colors cursor-pointer"
                        title="View Dossier"
                      >
                        <ExternalLink size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* TAB 3: BILLING & FINANCIAL INVOICES */}
            {active360Tab === 'finance' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#ECE8E0]">
                  <span className="text-xs text-[#77736C]">Invoices and Electronic Receipts</span>
                  <span className="text-xs text-[#111111] font-semibold">
                    Total Spent: ₹ {selectedGuest.totalSpent?.toLocaleString()}
                  </span>
                </div>

                <div className="space-y-2">
                  {guestInvoices.length === 0 ? (
                    <div className="p-6 text-center text-[#77736C] bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                      No invoices currently filed under this patron's records.
                    </div>
                  ) : (
                    guestInvoices.map((inv) => (
                      <div
                        key={inv.id}
                        className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs flex items-center justify-between gap-4 text-xs font-mono"
                      >
                        <div>
                          <div className="flex items-center gap-2 font-semibold text-[#111111]">
                            <span>{inv.invoiceNumber}</span>
                            <StatusBadge status={inv.status} />
                          </div>
                          <div className="text-[10px] text-[#77736C] mt-0.5">
                            Issued: {inv.issueDate} · Due: {inv.dueDate}
                          </div>
                          <div className="text-[11px] text-[#111111] mt-1">
                            Amount: ₹ {inv.grandTotal?.toLocaleString()}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => navigate(`/admin/finance/invoices`)}
                          className="text-xs text-[#A58A5C] hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          <ExternalLink size={11} />
                          <span>View Folio</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: KYC DOCUMENTS */}
            {active360Tab === 'documents' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#ECE8E0]">
                  <span className="text-xs text-[#77736C]">
                    Statutory Government Identification
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Plus}
                    onClick={() => setIsKycModalOpen(true)}
                  >
                    Add KYC
                  </Button>
                </div>

                <div className="space-y-2">
                  {guestDocs.length === 0 ? (
                    <div className="p-6 text-center text-[#77736C] bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                      No identification documents uploaded for this guest yet.
                    </div>
                  ) : (
                    guestDocs.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs flex items-center justify-between gap-4 text-xs font-mono"
                      >
                        <div>
                          <div className="flex items-center gap-2 font-semibold text-[#111111]">
                            <ShieldCheck size={14} className="text-[#A58A5C]" />
                            <span>{doc.documentType}</span>
                            <StatusBadge status={doc.verificationStatus} />
                          </div>
                          <div className="text-[11px] text-[#55514B] mt-1">
                            Ref: {doc.documentNumber} ({doc.nationality})
                          </div>
                          {doc.expiryDate && (
                            <div className="text-[10px] text-[#77736C]">
                              Expires: {doc.expiryDate}
                            </div>
                          )}
                        </div>

                        <span className="text-[10px] text-[#77736C]">
                          Uploaded: {doc.uploadDate}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: COMMUNICATION LOGS */}
            {active360Tab === 'communications' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#ECE8E0]">
                  <span className="text-xs text-[#77736C]">
                    Outbound & Concierge Interactions
                  </span>
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={Send}
                    onClick={() => setIsMessageModalOpen(true)}
                  >
                    Compose
                  </Button>
                </div>

                <div className="space-y-2">
                  {guestComms.length === 0 ? (
                    <div className="p-6 text-center text-[#77736C] bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs">
                      No outbound communications dispatched to this guest yet.
                    </div>
                  ) : (
                    guestComms.map((c) => (
                      <div
                        key={c.id}
                        className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs space-y-1.5 text-xs font-mono"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 bg-[#FFFFFF] border border-[#E2DDD5] text-[10px] font-bold text-[#A58A5C] rounded-xs">
                              {c.channel}
                            </span>
                            <span className="font-semibold text-[#111111]">{c.type}</span>
                          </div>
                          <span className="text-[10px] text-[#77736C]">{c.sentAt}</span>
                        </div>

                        {c.subject && (
                          <div className="text-[11px] text-[#111111] font-medium">
                            {c.subject}
                          </div>
                        )}

                        <p className="font-sans text-[11px] text-[#55514B] bg-[#FFFFFF] p-2 border border-[#ECE8E0] rounded-xs leading-relaxed">
                          {c.content}
                        </p>

                        <div className="text-[10px] text-[#77736C] flex items-center justify-between pt-1">
                          <span>Sent by: {c.sentBy}</span>
                          <span className="text-emerald-700 font-semibold">● {c.status}</span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Drawer>

      {/* Add New Guest Modal */}
      <Modal
        isOpen={isAddGuestOpen}
        onClose={() => setIsAddGuestOpen(false)}
        title="Add Patron Profile"
        subtitle="Guest CRM Directory"
      >
        <form onSubmit={handleCreateGuest} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="form-group !mb-0">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                required
                value={newGuestForm.name}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, name: e.target.value })}
                placeholder="e.g. Vikramaditya Singhania"
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Email Contact</label>
              <input
                type="email"
                required
                value={newGuestForm.email}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, email: e.target.value })}
                placeholder="vikram@enterprise.in"
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Phone Number</label>
              <input
                type="tel"
                required
                value={newGuestForm.phone}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, phone: e.target.value })}
                placeholder="+91 98450 11223"
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Loyalty Tier</label>
              <select
                value={newGuestForm.tier}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, tier: e.target.value })}
                className="form-select text-xs font-mono"
              >
                <option value="Member">Member</option>
                <option value="VIP Member">VIP Member</option>
                <option value="Founding Patron">Founding Patron</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Country</label>
              <input
                type="text"
                value={newGuestForm.country}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, country: e.target.value })}
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">City</label>
              <input
                type="text"
                value={newGuestForm.city}
                onChange={(e) => setNewGuestForm({ ...newGuestForm, city: e.target.value })}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Sanctuary Preferences (Comma-separated)</label>
            <input
              type="text"
              value={newGuestForm.preferences}
              onChange={(e) => setNewGuestForm({ ...newGuestForm, preferences: e.target.value })}
              placeholder="e.g. Quiet wing, feather pillows, vegan breakfast"
              className="form-input text-xs"
            />
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Internal Concierge Notes</label>
            <textarea
              rows={2}
              value={newGuestForm.notes}
              onChange={(e) => setNewGuestForm({ ...newGuestForm, notes: e.target.value })}
              className="form-textarea text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECE8E0]">
            <Button variant="secondary" size="sm" onClick={() => setIsAddGuestOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Patron Profile
            </Button>
          </div>
        </form>
      </Modal>

      {/* Send Message Modal */}
      {selectedGuest && (
        <Modal
          isOpen={isMessageModalOpen}
          onClose={() => setIsMessageModalOpen(false)}
          title={`Compose to ${selectedGuest.name}`}
          subtitle="Outbound Guest Interaction"
        >
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group !mb-0">
                <label className="form-label">Channel</label>
                <select
                  value={messageForm.channel}
                  onChange={(e) => setMessageForm({ ...messageForm, channel: e.target.value as any })}
                  className="form-select text-xs font-mono"
                >
                  <option value="Email">Email ({selectedGuest.email})</option>
                  <option value="SMS">SMS ({selectedGuest.phone})</option>
                  <option value="WhatsApp">WhatsApp ({selectedGuest.phone})</option>
                </select>
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Purpose / Type</label>
                <select
                  value={messageForm.type}
                  onChange={(e) => setMessageForm({ ...messageForm, type: e.target.value as any })}
                  className="form-select text-xs font-mono"
                >
                  <option value="Stay Courtesy">Stay Courtesy</option>
                  <option value="Pre-Arrival Check-In">Pre-Arrival Check-In</option>
                  <option value="Booking Confirmation">Booking Confirmation</option>
                  <option value="Check-Out Invoice">Check-Out Invoice</option>
                  <option value="Custom Message">Custom Message</option>
                </select>
              </div>
            </div>

            {messageForm.channel === 'Email' && (
              <div className="form-group !mb-0">
                <label className="form-label">Subject</label>
                <input
                  type="text"
                  required
                  value={messageForm.subject}
                  onChange={(e) => setMessageForm({ ...messageForm, subject: e.target.value })}
                  className="form-input text-xs"
                />
              </div>
            )}

            <div className="form-group !mb-0">
              <label className="form-label">Message Content</label>
              <textarea
                rows={4}
                required
                value={messageForm.content}
                onChange={(e) => setMessageForm({ ...messageForm, content: e.target.value })}
                placeholder="Dear Valued Guest, we look forward to welcoming you to NOVA HOUSE..."
                className="form-textarea text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECE8E0]">
              <Button variant="secondary" size="sm" onClick={() => setIsMessageModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" icon={Send}>
                Dispatch Message
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Add KYC Modal */}
      {selectedGuest && (
        <Modal
          isOpen={isKycModalOpen}
          onClose={() => setIsKycModalOpen(false)}
          title={`Upload KYC for ${selectedGuest.name}`}
          subtitle="Statutory Identity Filing"
        >
          <form onSubmit={handleAddKyc} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group !mb-0">
                <label className="form-label">Document Type</label>
                <select
                  value={kycForm.documentType}
                  onChange={(e) => setKycForm({ ...kycForm, documentType: e.target.value as any })}
                  className="form-select text-xs font-mono"
                >
                  <option value="Passport">Passport</option>
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="Driver License">Driver License</option>
                  <option value="Visa">Visa</option>
                </select>
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Document Reference Number</label>
                <input
                  type="text"
                  required
                  value={kycForm.documentNumber}
                  onChange={(e) => setKycForm({ ...kycForm, documentNumber: e.target.value })}
                  placeholder="e.g. Z9823412 or •••• 4912"
                  className="form-input text-xs font-mono"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Nationality</label>
                <input
                  type="text"
                  required
                  value={kycForm.nationality}
                  onChange={(e) => setKycForm({ ...kycForm, nationality: e.target.value })}
                  className="form-input text-xs"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Expiry Date</label>
                <input
                  type="date"
                  required
                  value={kycForm.expiryDate}
                  onChange={(e) => setKycForm({ ...kycForm, expiryDate: e.target.value })}
                  className="form-input text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECE8E0]">
              <Button variant="secondary" size="sm" onClick={() => setIsKycModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Record & Verify
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
