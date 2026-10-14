import React, { useState } from 'react';
import {
  Edit2,
  Plus,
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';

interface RoomPricing {
  id: string;
  roomType: string;
  basePrice: number;
  weekendPrice: number;
  peakPrice: number;
  discountPercentage: number;
  currentPrice: number;
}

interface SeasonRule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  room: string;
  priceMultiplier: string;
  discount: string;
  status: string;
}

const initialRoomPricings: RoomPricing[] = [
  {
    id: 'PRC-01',
    roomType: 'Deluxe Room',
    basePrice: 18500,
    weekendPrice: 21500,
    peakPrice: 25000,
    discountPercentage: 10,
    currentPrice: 16650,
  },
  {
    id: 'PRC-02',
    roomType: 'Premier Room',
    basePrice: 24000,
    weekendPrice: 28000,
    peakPrice: 32000,
    discountPercentage: 8,
    currentPrice: 22080,
  },
  {
    id: 'PRC-03',
    roomType: 'Junior Suite (Nova Suite)',
    basePrice: 38000,
    weekendPrice: 44000,
    peakPrice: 52000,
    discountPercentage: 12,
    currentPrice: 33440,
  },
  {
    id: 'PRC-04',
    roomType: 'Executive Suite',
    basePrice: 45000,
    weekendPrice: 52000,
    peakPrice: 60000,
    discountPercentage: 10,
    currentPrice: 40500,
  },
  {
    id: 'PRC-05',
    roomType: 'Terrace Suite',
    basePrice: 54000,
    weekendPrice: 62000,
    peakPrice: 72000,
    discountPercentage: 5,
    currentPrice: 51300,
  },
  {
    id: 'PRC-06',
    roomType: 'Penthouse Collection',
    basePrice: 85000,
    weekendPrice: 98000,
    peakPrice: 120000,
    discountPercentage: 0,
    currentPrice: 85000,
  },
  {
    id: 'PRC-07',
    roomType: 'Studio Chamber',
    basePrice: 16500,
    weekendPrice: 19000,
    peakPrice: 22000,
    discountPercentage: 10,
    currentPrice: 14850,
  },
];

const initialSeasons: SeasonRule[] = [
  {
    id: 'SEA-01',
    name: 'Winter Festive & New Year Surge',
    startDate: '2026-12-18',
    endDate: '2027-01-05',
    room: 'All Suites & Penthouses',
    priceMultiplier: '+35% Peak Surge',
    discount: 'No Promo Codes',
    status: 'Scheduled',
  },
  {
    id: 'SEA-02',
    name: 'Bangalore Tech Summit & LitFest',
    startDate: '2026-11-15',
    endDate: '2026-11-24',
    room: 'All Inventory',
    priceMultiplier: '+20% Dynamic Tier',
    discount: 'Corporate Codes Only',
    status: 'Scheduled',
  },
  {
    id: 'SEA-03',
    name: 'Monsoon Quiet Pause Retreat',
    startDate: '2026-07-01',
    endDate: '2026-08-31',
    room: 'Deluxe & Premier Rooms',
    priceMultiplier: 'Base Rate',
    discount: '15% Direct Booking Discount',
    status: 'Archived',
  },
];

import { getPricings, savePricing } from '../services/pricingService';

export default function Pricing() {
  const { addToast } = useToast();
  const [pricings, setPricings] = useState<RoomPricing[]>(initialRoomPricings);
  const [seasons, setSeasons] = useState<SeasonRule[]>(initialSeasons);

  React.useEffect(() => {
    async function load() {
      const data = await getPricings();
      if (data && data.length > 0) setPricings(data);
    }
    load();
  }, []);

  // Edit Tariff Modal
  const [editingPricing, setEditingPricing] = useState<RoomPricing | null>(null);
  const [priceForm, setPriceForm] = useState<RoomPricing | null>(null);

  // New Season Modal
  const [isSeasonModalOpen, setIsSeasonModalOpen] = useState(false);
  const [seasonForm, setSeasonForm] = useState({
    name: '',
    startDate: '2026-11-01',
    endDate: '2026-11-10',
    room: 'All Inventory',
    priceMultiplier: '+15% Dynamic Tier',
    discount: '5% Standard',
  });

  const handleOpenEdit = (p: RoomPricing) => {
    setEditingPricing(p);
    setPriceForm({ ...p });
  };

  const handleSavePrice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!priceForm) return;
    const updated: RoomPricing = {
      ...priceForm,
      currentPrice: Math.round(
        priceForm.basePrice * (1 - (priceForm.discountPercentage || 0) / 100)
      ),
    };
    await savePricing(updated);
    setPricings((prev) =>
      prev.map((item) => (item.id === updated.id ? updated : item))
    );
    addToast(`Tariff updated for ${updated.roomType} and synced to customer interface.`);
    setEditingPricing(null);
  };

  const handleAddSeason = (e: React.FormEvent) => {
    e.preventDefault();
    const newSeason: SeasonRule = {
      ...seasonForm,
      id: `SEA-${Date.now()}`,
      status: 'Scheduled',
    };
    setSeasons([newSeason, ...seasons]);
    addToast(`Seasonal rule "${seasonForm.name}" created.`);
    setIsSeasonModalOpen(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Dynamic Revenue Yield Engine
          </span>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Tariff & Seasonal Pricing
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Manage base rates, weekend multipliers, seasonal rules, and direct booking discounts.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          icon={Plus}
          onClick={() => setIsSeasonModalOpen(true)}
        >
          Add Seasonal Rule
        </Button>
      </div>

      {/* Room Type Base Tariff Matrix Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
              Inventory Categories
            </span>
            <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
              Category Base & Multiplier Tariffs
            </h3>
          </div>
          <span className="font-mono text-xs text-[#77736C]">
            Currency: <strong className="text-[#111111]">INR (₹)</strong>
          </span>
        </div>

        <div className="data-table-container !border-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Room Type</th>
                <th>Base Price</th>
                <th>Weekend Price</th>
                <th>Peak Surge Price</th>
                <th>Discount</th>
                <th>Current Effective Tariff</th>
                <th style={{ textAlign: 'right' }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {pricings.map((p) => (
                <tr key={p.id}>
                  <td>
                    <span className="font-serif text-sm font-semibold text-[#111111]">
                      {p.roomType}
                    </span>
                  </td>
                  <td className="font-mono text-xs">
                    ₹ {p.basePrice.toLocaleString()}
                  </td>
                  <td className="font-mono text-xs text-[#A58A5C] font-medium">
                    ₹ {p.weekendPrice.toLocaleString()}
                  </td>
                  <td className="font-mono text-xs text-[#962828] font-medium">
                    ₹ {p.peakPrice.toLocaleString()}
                  </td>
                  <td className="font-mono text-xs text-[#235C33]">
                    {p.discountPercentage}% Off
                  </td>
                  <td>
                    <span className="font-mono text-xs font-bold text-[#111111] bg-[#FAF8F5] px-2.5 py-1 rounded-xs border border-[#E2DDD5]">
                      ₹ {p.currentPrice.toLocaleString()}
                    </span>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <Button
                      variant="secondary"
                      size="sm"
                      icon={Edit2}
                      onClick={() => handleOpenEdit(p)}
                    >
                      Adjust
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Seasonal Pricing Rules Section */}
      <div className="admin-card">
        <div className="admin-card-header flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
              Event & Holiday Calendar
            </span>
            <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
              Seasonal Yield Rules
            </h3>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setIsSeasonModalOpen(true)}
          >
            New Period
          </Button>
        </div>

        <div className="data-table-container !border-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Season Period Name</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Applicable Inventory</th>
                <th>Price Multiplier</th>
                <th>Discount Rules</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {seasons.map((s) => (
                <tr key={s.id}>
                  <td>
                    <span className="font-serif text-sm font-medium text-[#111111]">
                      {s.name}
                    </span>
                  </td>
                  <td className="font-mono text-xs">{s.startDate}</td>
                  <td className="font-mono text-xs">{s.endDate}</td>
                  <td className="font-sans text-xs text-[#77736C]">{s.room}</td>
                  <td className="font-mono text-xs font-semibold text-[#A58A5C]">
                    {s.priceMultiplier}
                  </td>
                  <td className="font-mono text-xs text-[#77736C]">{s.discount}</td>
                  <td>
                    <span
                      className={`badge ${
                        s.status === 'Scheduled' ? 'badge-warning' : 'badge-neutral'
                      }`}
                    >
                      <span className="badge-dot" />
                      <span>{s.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Tariff Modal */}
      <Modal
        isOpen={!!editingPricing}
        onClose={() => setEditingPricing(null)}
        title="Adjust Category Tariff"
        subtitle={editingPricing?.roomType}
      >
        {priceForm && (
          <form onSubmit={handleSavePrice} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="form-group !mb-0">
                <label className="form-label">Base Rate (₹ / nt)</label>
                <input
                  type="number"
                  required
                  value={priceForm.basePrice}
                  onChange={(e) =>
                    setPriceForm({ ...priceForm, basePrice: Number(e.target.value) })
                  }
                  className="form-input text-xs font-mono"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Weekend Rate (₹ / nt)</label>
                <input
                  type="number"
                  required
                  value={priceForm.weekendPrice}
                  onChange={(e) =>
                    setPriceForm({ ...priceForm, weekendPrice: Number(e.target.value) })
                  }
                  className="form-input text-xs font-mono"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Peak Holiday Surge (₹ / nt)</label>
                <input
                  type="number"
                  required
                  value={priceForm.peakPrice}
                  onChange={(e) =>
                    setPriceForm({ ...priceForm, peakPrice: Number(e.target.value) })
                  }
                  className="form-input text-xs font-mono"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Direct Booking Discount (%)</label>
                <input
                  type="number"
                  min={0}
                  max={50}
                  value={priceForm.discountPercentage}
                  onChange={(e) =>
                    setPriceForm({ ...priceForm, discountPercentage: Number(e.target.value) })
                  }
                  className="form-input text-xs font-mono"
                />
              </div>
            </div>

            <div className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs text-xs font-mono flex items-center justify-between">
              <span className="text-[#77736C]">Computed Effective Current Rate:</span>
              <strong className="text-base text-[#111111]">
                ₹{' '}
                {Math.round(
                  priceForm.basePrice * (1 - (priceForm.discountPercentage || 0) / 100)
                ).toLocaleString()}
              </strong>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECE8E0]">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setEditingPricing(null)}
              >
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit">
                Save Tariff Adjustments
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Seasonal Rule Modal */}
      <Modal
        isOpen={isSeasonModalOpen}
        onClose={() => setIsSeasonModalOpen(false)}
        title="Add Seasonal Period Rule"
        subtitle="Yield Management"
      >
        <form onSubmit={handleAddSeason} className="space-y-4">
          <div className="form-group !mb-0">
            <label className="form-label">Season Rule Name</label>
            <input
              type="text"
              required
              value={seasonForm.name}
              onChange={(e) => setSeasonForm({ ...seasonForm, name: e.target.value })}
              placeholder="e.g. Aero India Defense Expo Surge"
              className="form-input text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group !mb-0">
              <label className="form-label">Start Date</label>
              <input
                type="date"
                required
                value={seasonForm.startDate}
                onChange={(e) => setSeasonForm({ ...seasonForm, startDate: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">End Date</label>
              <input
                type="date"
                required
                value={seasonForm.endDate}
                onChange={(e) => setSeasonForm({ ...seasonForm, endDate: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group !mb-0">
              <label className="form-label">Price Multiplier Tier</label>
              <select
                value={seasonForm.priceMultiplier}
                onChange={(e) => setSeasonForm({ ...seasonForm, priceMultiplier: e.target.value })}
                className="form-select text-xs font-mono"
              >
                <option>+10% Dynamic Tier</option>
                <option>+15% Dynamic Tier</option>
                <option>+25% Dynamic Tier</option>
                <option>+35% Peak Surge</option>
                <option>Base Rate</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Applicable Rooms</label>
              <input
                type="text"
                value={seasonForm.room}
                onChange={(e) => setSeasonForm({ ...seasonForm, room: e.target.value })}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECE8E0]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsSeasonModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Seasonal Period
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
