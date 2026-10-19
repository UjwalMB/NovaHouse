import React, { useState } from 'react';
import {
  Edit2,
  Plus,
  Tag,
  Calendar,
  Gift,
  Clock,
  Sliders,
  CheckCircle2,
  Percent,
} from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { getPricings, savePricing } from '../services/pricingService';

interface RoomPricing {
  id: string;
  roomType: string;
  basePrice: number;
  weekendPrice: number;
  peakPrice: number;
  discountPercentage: number;
  currentPrice: number;
  minStayNights?: number;
  maxStayNights?: number;
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

interface SpecialPackage {
  id: string;
  name: string;
  roomType: string;
  minNights: number;
  packagePrice: number;
  inclusions: string;
  validTill: string;
  status: 'Active' | 'Paused';
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
    minStayNights: 1,
    maxStayNights: 14,
  },
  {
    id: 'PRC-02',
    roomType: 'Premier Room',
    basePrice: 24000,
    weekendPrice: 28000,
    peakPrice: 32000,
    discountPercentage: 8,
    currentPrice: 22080,
    minStayNights: 1,
    maxStayNights: 21,
  },
  {
    id: 'PRC-03',
    roomType: 'Junior Suite (Nova Suite)',
    basePrice: 38000,
    weekendPrice: 44000,
    peakPrice: 52000,
    discountPercentage: 12,
    currentPrice: 33440,
    minStayNights: 2,
    maxStayNights: 30,
  },
  {
    id: 'PRC-04',
    roomType: 'Executive Suite',
    basePrice: 45000,
    weekendPrice: 52000,
    peakPrice: 60000,
    discountPercentage: 10,
    currentPrice: 40500,
    minStayNights: 2,
    maxStayNights: 30,
  },
  {
    id: 'PRC-05',
    roomType: 'Terrace Suite',
    basePrice: 54000,
    weekendPrice: 62000,
    peakPrice: 72000,
    discountPercentage: 5,
    currentPrice: 51300,
    minStayNights: 2,
    maxStayNights: 30,
  },
  {
    id: 'PRC-06',
    roomType: 'Penthouse Collection',
    basePrice: 85000,
    weekendPrice: 98000,
    peakPrice: 120000,
    discountPercentage: 0,
    currentPrice: 85000,
    minStayNights: 3,
    maxStayNights: 30,
  },
  {
    id: 'PRC-07',
    roomType: 'Studio Chamber',
    basePrice: 16500,
    weekendPrice: 19000,
    peakPrice: 22000,
    discountPercentage: 10,
    currentPrice: 14850,
    minStayNights: 1,
    maxStayNights: 60,
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

const initialPackages: SpecialPackage[] = [
  {
    id: 'PKG-01',
    name: 'The Sanctuary Rejuvenation Retreat',
    roomType: 'Junior Suite',
    minNights: 2,
    packagePrice: 72000,
    inclusions: 'Daily artisanal breakfast, 60-min herbal botanical massage, private airport Tesla transfer',
    validTill: '2027-03-31',
    status: 'Active',
  },
  {
    id: 'PKG-02',
    name: 'Grand Penthouse Residency Experiential',
    roomType: 'Penthouse Collection',
    minNights: 3,
    packagePrice: 240000,
    inclusions: 'Dedicated 24h butler, private sommelier cellar tasting, sunset terrace dinner for 4',
    validTill: '2027-06-30',
    status: 'Active',
  },
  {
    id: 'PKG-03',
    name: 'Extended Executive Stay Workstation',
    roomType: 'Studio Chamber',
    minNights: 7,
    packagePrice: 95000,
    inclusions: 'High-speed encrypted fiber Wi-Fi, daily express laundry, boardroom access, unlimited artisanal coffee',
    validTill: '2026-12-31',
    status: 'Active',
  },
];

export default function Pricing() {
  const { addToast } = useToast();
  const [pricings, setPricings] = useState<RoomPricing[]>(initialRoomPricings);
  const [seasons, setSeasons] = useState<SeasonRule[]>(initialSeasons);
  const [packages, setPackages] = useState<SpecialPackage[]>(initialPackages);

  React.useEffect(() => {
    async function load() {
      const data = await getPricings();
      if (data && data.length > 0) {
        setPricings(data.map((d: any) => ({
          ...d,
          minStayNights: d.minStayNights || 1,
          maxStayNights: d.maxStayNights || 30,
        })));
      }
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

  // New Package Modal
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  const [packageForm, setPackageForm] = useState<Partial<SpecialPackage>>({
    name: '',
    roomType: 'Deluxe Room',
    minNights: 2,
    packagePrice: 38000,
    inclusions: 'Daily bespoke breakfast, cocktail tasting, late check-out 4 PM',
    validTill: '2027-03-31',
    status: 'Active',
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
    addToast(`Tariff & stay policies updated for ${updated.roomType}.`);
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

  const handleAddPackage = (e: React.FormEvent) => {
    e.preventDefault();
    const newPkg: SpecialPackage = {
      id: `PKG-${Date.now()}`,
      name: packageForm.name || 'Bespoke Package',
      roomType: packageForm.roomType || 'Deluxe Room',
      minNights: Number(packageForm.minNights || 2),
      packagePrice: Number(packageForm.packagePrice || 40000),
      inclusions: packageForm.inclusions || 'Complimentary breakfast and amenities',
      validTill: packageForm.validTill || '2027-01-01',
      status: 'Active',
    };
    setPackages([newPkg, ...packages]);
    addToast(`Special package "${newPkg.name}" created.`);
    setIsPackageModalOpen(false);
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
            Tariff, Stay Restrictions & Packages
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Manage base rates, weekend/peak multipliers, minimum stay length, promotional packages, and seasonal surges.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            size="sm"
            icon={Gift}
            onClick={() => setIsPackageModalOpen(true)}
          >
            New Package
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={Plus}
            onClick={() => setIsSeasonModalOpen(true)}
          >
            Add Seasonal Rule
          </Button>
        </div>
      </div>

      {/* Room Type Base Tariff Matrix Table */}
      <div className="admin-card">
        <div className="admin-card-header">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
              Inventory Categories
            </span>
            <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
              Category Base Tariffs & Stay Restrictions
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
                <th>Base Rate</th>
                <th>Weekend Rate</th>
                <th>Peak Surge</th>
                <th>Min / Max Stay</th>
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
                  <td className="font-mono text-xs text-[#55514B]">
                    {p.minStayNights || 1} min / {p.maxStayNights || 30} max nights
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

      {/* Packages & Special Rates Section */}
      <div className="admin-card">
        <div className="admin-card-header flex items-center justify-between">
          <div>
            <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
              Curated Stay Collections
            </span>
            <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
              Special Offers & Bundle Packages
            </h3>
          </div>
          <Button
            variant="secondary"
            size="sm"
            icon={Plus}
            onClick={() => setIsPackageModalOpen(true)}
          >
            Create Package
          </Button>
        </div>

        <div className="data-table-container !border-0">
          <table className="data-table">
            <thead>
              <tr>
                <th>Package Name</th>
                <th>Sanctuary Category</th>
                <th>Min Stay</th>
                <th>Package Tariff</th>
                <th>Complimentary Inclusions</th>
                <th>Valid Until</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {packages.map((pkg) => (
                <tr key={pkg.id}>
                  <td>
                    <span className="font-serif text-sm font-semibold text-[#111111]">
                      {pkg.name}
                    </span>
                  </td>
                  <td className="font-mono text-xs">{pkg.roomType}</td>
                  <td className="font-mono text-xs text-[#77736C]">{pkg.minNights} Nights</td>
                  <td className="font-mono text-xs font-bold text-[#111111]">
                    ₹ {pkg.packagePrice.toLocaleString()}
                  </td>
                  <td className="font-sans text-xs text-[#55514B] max-w-xs truncate" title={pkg.inclusions}>
                    {pkg.inclusions}
                  </td>
                  <td className="font-mono text-xs text-[#77736C]">{pkg.validTill}</td>
                  <td>
                    <span className="badge badge-success">
                      <span className="badge-dot" />
                      <span>{pkg.status}</span>
                    </span>
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
              Seasonal Yield & Peak Multiplier Rules
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

      {/* Adjust Tariff & Stay Policy Modal */}
      <Modal
        isOpen={!!editingPricing}
        onClose={() => setEditingPricing(null)}
        title="Adjust Category Tariff & Policies"
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

              <div className="form-group !mb-0">
                <label className="form-label">Minimum Stay (Nights)</label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  required
                  value={priceForm.minStayNights || 1}
                  onChange={(e) =>
                    setPriceForm({ ...priceForm, minStayNights: Number(e.target.value) })
                  }
                  className="form-input text-xs font-mono"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Maximum Stay (Nights)</label>
                <input
                  type="number"
                  min={1}
                  max={90}
                  required
                  value={priceForm.maxStayNights || 30}
                  onChange={(e) =>
                    setPriceForm({ ...priceForm, maxStayNights: Number(e.target.value) })
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

      {/* Add Special Package Modal */}
      <Modal
        isOpen={isPackageModalOpen}
        onClose={() => setIsPackageModalOpen(false)}
        title="Create Curated Package"
        subtitle="Special Bundles & Extended Stays"
      >
        <form onSubmit={handleAddPackage} className="space-y-4">
          <div className="form-group !mb-0">
            <label className="form-label">Package Name</label>
            <input
              type="text"
              required
              value={packageForm.name || ''}
              onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
              placeholder="e.g. Royal Anniversary Escape"
              className="form-input text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="form-group !mb-0">
              <label className="form-label">Sanctuary Type</label>
              <select
                value={packageForm.roomType}
                onChange={(e) => setPackageForm({ ...packageForm, roomType: e.target.value })}
                className="form-select text-xs font-mono"
              >
                <option value="Deluxe Room">Deluxe Room</option>
                <option value="Premier Room">Premier Room</option>
                <option value="Junior Suite">Junior Suite</option>
                <option value="Executive Suite">Executive Suite</option>
                <option value="Terrace Suite">Terrace Suite</option>
                <option value="Penthouse Collection">Penthouse Collection</option>
                <option value="Studio Chamber">Studio Chamber</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Minimum Stay Length (Nights)</label>
              <input
                type="number"
                min={1}
                required
                value={packageForm.minNights || 2}
                onChange={(e) => setPackageForm({ ...packageForm, minNights: Number(e.target.value) })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Total Package Tariff (₹)</label>
              <input
                type="number"
                required
                value={packageForm.packagePrice || 45000}
                onChange={(e) => setPackageForm({ ...packageForm, packagePrice: Number(e.target.value) })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Validity Expiration Date</label>
              <input
                type="date"
                required
                value={packageForm.validTill || '2027-03-31'}
                onChange={(e) => setPackageForm({ ...packageForm, validTill: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Package Inclusions & Privileges</label>
            <textarea
              rows={2}
              required
              value={packageForm.inclusions || ''}
              onChange={(e) => setPackageForm({ ...packageForm, inclusions: e.target.value })}
              placeholder="e.g. Daily breakfast buffet, 1x 4-course tasting dinner, complimentary chauffeur transfer..."
              className="form-textarea text-xs"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECE8E0]">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsPackageModalOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Publish Package
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
