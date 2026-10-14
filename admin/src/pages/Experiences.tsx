import React, { useState } from 'react';
import {
  Plus,
  Edit2,
  Trash2,
  Clock,
  Thermometer,
} from 'lucide-react';
import { initialExperiences } from '../data/experiences';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import Drawer from '../components/ui/Drawer';
import { Experience } from '../types';

export default function Experiences() {
  const { addToast } = useToast();
  const [experiences, setExperiences] = useState<Experience[]>(initialExperiences);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);
  const [expForm, setExpForm] = useState({
    title: '',
    category: 'Wellness',
    subtitle: '',
    description: '',
    hours: '06:00 AM – 10:00 PM',
    temperature: 'Climate Regulated',
    price: 'Complimentary for Hotel Guests',
    availability: 'Active',
    capacity: '20 Guests',
    image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
    features: ['Private Sessions Available', 'Towel Service'],
  });

  const handleOpenAdd = () => {
    setEditingExp(null);
    setExpForm({
      title: '',
      category: 'Wellness',
      subtitle: '',
      description: '',
      hours: '06:00 AM – 10:00 PM',
      temperature: 'Climate Regulated',
      price: 'Complimentary for Hotel Guests',
      availability: 'Active',
      capacity: '20 Guests',
      image: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=1200&q=80',
      features: ['Private Sessions Available', 'Towel Service'],
    });
    setIsDrawerOpen(true);
  };

  const handleOpenEdit = (exp: Experience) => {
    setEditingExp(exp);
    setExpForm({
      title: exp.title,
      category: exp.category,
      subtitle: exp.subtitle,
      description: exp.description,
      hours: exp.hours,
      temperature: exp.temperature || 'Climate Regulated',
      price: exp.price,
      availability: exp.availability,
      capacity: exp.capacity,
      image: exp.image,
      features: exp.features || [],
    });
    setIsDrawerOpen(true);
  };

  const handleDelete = (id: string, title: string) => {
    if (window.confirm(`Delete experience "${title}"?`)) {
      setExperiences((prev) => prev.filter((e) => e.id !== id));
      addToast(`Experience "${title}" removed.`);
    }
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingExp) {
      setExperiences((prev) =>
        prev.map((e) => (e.id === editingExp.id ? { ...e, ...expForm } : e))
      );
      addToast(`Experience "${expForm.title}" updated.`);
    } else {
      const created: Experience = {
        ...expForm,
        id: `exp-${Date.now()}`,
      };
      setExperiences([created, ...experiences]);
      addToast(`New experience "${expForm.title}" created.`);
    }
    setIsDrawerOpen(false);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Wellness, Movement & Event Spaces
          </span>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Curated Hotel Experiences
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Manage the rooftop pool, Kaya Sanctuary Spa, movement studio, and glasshouse salons.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Add Experience Space
        </Button>
      </div>

      {/* Grid of Experiences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {experiences.map((exp) => (
          <div
            key={exp.id}
            className="admin-card overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="relative h-60 overflow-hidden border-b border-[#ECE8E0]">
                <img
                  src={exp.image}
                  alt={exp.title}
                  className="w-full h-full object-cover transform hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute top-3 left-3 bg-[#111111]/85 backdrop-blur-md px-3 py-1 text-[10px] font-mono text-[#F4F1EB] rounded-xs uppercase tracking-wider">
                  {exp.category}
                </div>
                <div className="absolute top-3 right-3">
                  <StatusBadge status={exp.availability} />
                </div>
                <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-xs font-mono text-[#F4F1EB] bg-[#111111]/80 backdrop-blur-md p-2 rounded-xs">
                  <span className="flex items-center gap-1.5">
                    <Clock size={12} className="text-[#A58A5C]" />
                    <span>{exp.hours}</span>
                  </span>
                  <span className="flex items-center gap-1.5 text-[#A58A5C]">
                    <Thermometer size={12} />
                    <span>{exp.temperature}</span>
                  </span>
                </div>
              </div>

              <div className="p-6 space-y-3">
                <div>
                  <h3 className="font-serif text-2xl font-light uppercase text-[#111111]">
                    {exp.title}
                  </h3>
                  <span className="font-mono text-xs text-[#A58A5C] uppercase tracking-wider block mt-0.5">
                    {exp.subtitle}
                  </span>
                </div>

                <p className="text-xs text-[#77736C] leading-relaxed">
                  {exp.description}
                </p>

                <div className="pt-2 border-t border-[#ECE8E0] grid grid-cols-2 gap-2 text-xs font-mono">
                  <div>
                    <span className="text-[#77736C] block text-[10px] uppercase">Access Tariff</span>
                    <span className="text-[#111111] font-semibold">{exp.price}</span>
                  </div>
                  <div>
                    <span className="text-[#77736C] block text-[10px] uppercase">Guest Capacity</span>
                    <span className="text-[#111111] font-semibold">{exp.capacity}</span>
                  </div>
                </div>

                <div className="pt-2">
                  <span className="text-[#77736C] block text-[10px] uppercase tracking-wider font-mono mb-1.5">
                    Curated Features & Inclusions
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {exp.features?.map((f, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 bg-[#FAF8F5] border border-[#E2DDD5] rounded-xs text-[11px] font-mono text-[#55514B]"
                      >
                        ✓ {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Card Actions */}
            <div className="p-4 bg-[#FAF8F5] border-t border-[#ECE8E0] flex items-center justify-end gap-2">
              <Button
                variant="secondary"
                size="sm"
                icon={Edit2}
                onClick={() => handleOpenEdit(exp)}
              >
                Edit Space
              </Button>
              <Button
                variant="ghost"
                size="sm"
                icon={Trash2}
                onClick={() => handleDelete(exp.id, exp.title)}
              >
                Delete
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Drawer */}
      <Drawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        title={editingExp ? `Edit ${expForm.title}` : 'Add Experience Space'}
        subtitle="Sanctuary Wellness CMS"
        width="max-w-lg"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setIsDrawerOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              Save Experience
            </Button>
          </>
        }
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="form-group !mb-0">
            <label className="form-label">Title</label>
            <input
              type="text"
              required
              value={expForm.title}
              onChange={(e) => setExpForm({ ...expForm, title: e.target.value })}
              className="form-input text-xs"
              placeholder="e.g. Rooftop Pool & Solarium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group !mb-0">
              <label className="form-label">Category</label>
              <select
                value={expForm.category}
                onChange={(e) => setExpForm({ ...expForm, category: e.target.value })}
                className="form-select text-xs font-mono"
              >
                <option>Aquatics</option>
                <option>Wellness</option>
                <option>Fitness</option>
                <option>Private Events</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Subtitle</label>
              <input
                type="text"
                value={expForm.subtitle}
                onChange={(e) => setExpForm({ ...expForm, subtitle: e.target.value })}
                className="form-input text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group !mb-0">
              <label className="form-label">Operating Hours</label>
              <input
                type="text"
                value={expForm.hours}
                onChange={(e) => setExpForm({ ...expForm, hours: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Ambient / Temperature</label>
              <input
                type="text"
                value={expForm.temperature}
                onChange={(e) => setExpForm({ ...expForm, temperature: e.target.value })}
                className="form-input text-xs font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group !mb-0">
              <label className="form-label">Pricing / Tariff</label>
              <input
                type="text"
                value={expForm.price}
                onChange={(e) => setExpForm({ ...expForm, price: e.target.value })}
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Status</label>
              <select
                value={expForm.availability}
                onChange={(e) => setExpForm({ ...expForm, availability: e.target.value })}
                className="form-select text-xs font-mono"
              >
                <option>Active</option>
                <option>Maintenance</option>
                <option>Private Buyout</option>
              </select>
            </div>
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Photography Image URL</label>
            <input
              type="url"
              value={expForm.image}
              onChange={(e) => setExpForm({ ...expForm, image: e.target.value })}
              className="form-input text-xs"
            />
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Description</label>
            <textarea
              rows={3}
              value={expForm.description}
              onChange={(e) => setExpForm({ ...expForm, description: e.target.value })}
              className="form-textarea text-xs"
            />
          </div>
        </form>
      </Drawer>
    </div>
  );
}
