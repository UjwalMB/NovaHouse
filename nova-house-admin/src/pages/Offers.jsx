import React, { useState } from 'react';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  Calendar,
  Gift,
  Check,
} from 'lucide-react';
import { initialOffers } from '../data/offers';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Drawer from '../components/ui/Drawer';

export default function Offers() {
  const { addToast } = useToast();
  const [offers, setOffers] = useState(initialOffers);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingOffer, setEditingOffer] = useState(null);
  const [offerForm, setOfferForm] = useState({
    name: '',
    tagline: '',
    description: '',
    discount: '',
    code: '',
    validFrom: '2026-10-15',
    validUntil: '2026-12-31',
    applicableRooms: 'All Suites',
    terms: 'Valid for direct website bookings only.',
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
    status: 'Active',
  });

  const handleOpenAdd = () => {
    setEditingOffer(null);
    setOfferForm({
      name: '',
      tagline: '',
      description: '',
      discount: '15% Off Room Rate',
      code: 'ESCAPE15',
      validFrom: '2026-10-15',
      validUntil: '2026-12-31',
      applicableRooms: 'All Suites',
      terms: 'Valid for direct website bookings only.',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1000&q=80',
      status: 'Active',
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (off) => {
    setEditingOffer(off);
    setOfferForm({
      ...off,
      applicableRooms: Array.isArray(off.applicableRooms)
        ? off.applicableRooms.join(', ')
        : off.applicableRooms,
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = (id, name) => {
    if (window.confirm(`Delete promotion "${name}"?`)) {
      setOffers((prev) => prev.filter((o) => o.id !== id));
      addToast(`Offer "${name}" removed.`);
    }
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingOffer) {
      setOffers((prev) =>
        prev.map((o) => (o.id === editingOffer.id ? { ...o, ...offerForm } : o))
      );
      addToast(`Offer "${offerForm.name}" updated.`);
    } else {
      const created = {
        ...offerForm,
        id: `OFF-${Date.now()}`,
        claimedCount: 0,
      };
      setOffers([created, ...offers]);
      addToast(`Offer "${offerForm.name}" created.`);
    }
    setIsDrawerOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Marketing & Packages
          </span>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Promotions & Packages
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Configure direct booking packages, seasonal promo codes, and culinary inclusions.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Create New Package
        </Button>
      </div>

      {/* Grid of Offers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map((off) => (
          <div
            key={off.id}
            className="admin-card overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="relative h-48 overflow-hidden border-b border-[#ECE8E0]">
                <img
                  src={off.image}
                  alt={off.name}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 right-3">
                  <StatusBadge status={off.status} />
                </div>
                {off.code && (
                  <div className="absolute bottom-3 left-3 bg-[#111111]/85 backdrop-blur-md px-2.5 py-1 text-[11px] font-mono font-bold text-[#A58A5C] rounded-xs border border-white/10">
                    CODE: {off.code}
                  </div>
                )}
              </div>

              <div className="p-6 space-y-3">
                <div>
                  <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
                    {off.discount}
                  </span>
                  <h3 className="font-serif text-xl font-light uppercase text-[#111111]">
                    {off.name}
                  </h3>
                  <span className="text-xs text-[#77736C] italic block mt-0.5">
                    {off.tagline}
                  </span>
                </div>

                <p className="text-xs text-[#77736C] leading-relaxed">
                  {off.description}
                </p>

                <div className="pt-2 border-t border-[#ECE8E0] space-y-1.5 text-xs font-mono">
                  <div className="flex items-center justify-between text-[#77736C]">
                    <span>Valid:</span>
                    <span className="text-[#111111]">{off.validFrom} – {off.validUntil}</span>
                  </div>
                  <div className="flex items-center justify-between text-[#77736C]">
                    <span>Eligible:</span>
                    <span className="text-[#111111] truncate max-w-[170px]">
                      {Array.isArray(off.applicableRooms) ? off.applicableRooms.join(', ') : off.applicableRooms}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-4 bg-[#FAF8F5] border-t border-[#ECE8E0] flex items-center justify-between text-xs font-mono">
              <span className="text-[#77736C]">
                Redemptions: <strong className="text-[#111111]">{off.claimedCount || 0}</strong>
              </span>

              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  icon={Edit2}
                  onClick={() => handleOpenEdit(off)}
                >
                  Edit
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => handleDelete(off.id, off.name)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingOffer ? `Edit ${offerForm.name}` : 'Create New Package'}
        subtitle="Promotions & Yield Incentives"
        width="max-w-md"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Package
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="form-group !mb-0">
            <label className="form-label">Offer / Package Name</label>
            <input
              type="text"
              required
              value={offerForm.name}
              onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })}
              className="form-input text-xs"
              placeholder="e.g. Weekend Urban Sanctuary Escape"
            />
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Subtitle / Tagline</label>
            <input
              type="text"
              value={offerForm.tagline}
              onChange={(e) => setOfferForm({ ...offerForm, tagline: e.target.value })}
              className="form-input text-xs"
              placeholder="Two Nights of Restorative Calm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group !mb-0">
              <label className="form-label">Benefit / Discount</label>
              <input
                type="text"
                required
                value={offerForm.discount}
                onChange={(e) => setOfferForm({ ...offerForm, discount: e.target.value })}
                className="form-input text-xs"
                placeholder="15% Off Room Rate"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Promo Code</label>
              <input
                type="text"
                value={offerForm.code}
                onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })}
                className="form-input text-xs font-mono uppercase"
                placeholder="PAUSE15"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group !mb-0">
              <label className="form-label">Valid From</label>
              <input
                type="date"
                value={offerForm.validFrom}
                onChange={(e) => setOfferForm({ ...offerForm, validFrom: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Valid Until</label>
              <input
                type="date"
                value={offerForm.validUntil}
                onChange={(e) => setOfferForm({ ...offerForm, validUntil: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Status</label>
            <select
              value={offerForm.status}
              onChange={(e) => setOfferForm({ ...offerForm, status: e.target.value })}
              className="form-select text-xs font-mono"
            >
              <option>Active</option>
              <option>Scheduled</option>
              <option>Expired</option>
              <option>Draft</option>
            </select>
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Image URL</label>
            <input
              type="url"
              value={offerForm.image}
              onChange={(e) => setOfferForm({ ...offerForm, image: e.target.value })}
              className="form-input text-xs"
            />
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Description</label>
            <textarea
              rows={3}
              value={offerForm.description}
              onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
              className="form-textarea text-xs"
            />
          </div>
        </form>
      </Drawer>
    </div>
  );
}
