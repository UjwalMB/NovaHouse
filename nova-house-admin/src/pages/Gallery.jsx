import React, { useState, useMemo } from 'react';
import {
  UploadCloud,
  Plus,
  Trash2,
  Edit2,
  Check,
  Star,
  ArrowUpDown,
  Image as ImageIcon,
  Search,
} from 'lucide-react';
import { initialGallery, galleryCategories } from '../data/gallery';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import SearchBar from '../components/ui/SearchBar';
import Modal from '../components/ui/Modal';

export default function Gallery() {
  const { addToast } = useToast();
  const [items, setItems] = useState(initialGallery);
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  // Upload / Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [itemForm, setItemForm] = useState({
    title: '',
    category: 'Suites',
    image: '',
    caption: '',
    featured: false,
  });

  const handleOpenAdd = () => {
    setEditingItem(null);
    setItemForm({
      title: '',
      category: 'Suites',
      image: 'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      caption: '',
      featured: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setItemForm({ ...item });
    setIsModalOpen(true);
  };

  const handleDelete = (id, title) => {
    if (window.confirm(`Delete photo "${title}" from gallery?`)) {
      setItems((prev) => prev.filter((i) => i.id !== id));
      addToast(`Image "${title}" deleted from media library.`);
    }
  };

  const handleToggleFeatured = (item) => {
    setItems((prev) =>
      prev.map((i) => (i.id === item.id ? { ...i, featured: !i.featured } : i))
    );
    addToast(
      item.featured
        ? `"${item.title}" removed from homepage featured archive.`
        : `"${item.title}" marked as homepage featured archive.`
    );
  };

  const handleSave = (e) => {
    e.preventDefault();
    if (editingItem) {
      setItems((prev) =>
        prev.map((i) => (i.id === editingItem.id ? { ...i, ...itemForm } : i))
      );
      addToast(`Image "${itemForm.title}" updated.`);
    } else {
      const created = {
        ...itemForm,
        id: `gal-${Date.now()}`,
        order: items.length + 1,
      };
      setItems([created, ...items]);
      addToast(`Image "${itemForm.title}" uploaded to library.`);
    }
    setIsModalOpen(false);
  };

  // Filtered Items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.caption && item.caption.toLowerCase().includes(q));

      const matchesCat =
        activeCategory === 'All' || item.category === activeCategory;

      return matchesSearch && matchesCat;
    });
  }, [items, searchQuery, activeCategory]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Media Assets & Visual Archive
          </span>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Hotel Gallery Management
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Curate photography displayed on public gallery, homepage showcases, and room dossiers.
          </p>
        </div>

        <Button variant="primary" size="sm" icon={Plus} onClick={handleOpenAdd}>
          Upload Media Asset
        </Button>
      </div>

      {/* Drag & Drop Upload Zone */}
      <div
        onClick={handleOpenAdd}
        className="admin-card p-8 border-2 border-dashed !border-[#CDC7BC] bg-[#FAF8F5] text-center cursor-pointer hover:bg-[#F6F2EA] transition-colors"
      >
        <div className="w-12 h-12 rounded-full bg-[#FFFFFF] border border-[#E2DDD5] text-[#A58A5C] flex items-center justify-center mx-auto mb-3 shadow-xs">
          <UploadCloud size={24} />
        </div>
        <div className="font-serif text-base text-[#111111]">
          Click or drop high-resolution architectural photography here
        </div>
        <p className="font-mono text-xs text-[#77736C] mt-1">
          Supports JPEG, PNG, WebP up to 25MB · Recommended 2400×1600px
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          {/* Categories */}
          <div className="flex flex-wrap items-center gap-1.5">
            {galleryCategories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setActiveCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider rounded-xs border transition-all ${
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

          <div className="w-full sm:w-64">
            <SearchBar
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Filter images..."
            />
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              className="admin-card overflow-hidden group flex flex-col justify-between"
            >
              <div>
                <div className="relative aspect-[4/3] overflow-hidden bg-[#111111]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-2.5 left-2.5 bg-[#111111]/80 backdrop-blur-md px-2 py-0.5 text-[9px] font-mono text-[#F4F1EB] rounded-xs uppercase tracking-wider">
                    {item.category}
                  </div>

                  <button
                    onClick={() => handleToggleFeatured(item)}
                    className={`absolute top-2.5 right-2.5 w-7 h-7 rounded-xs backdrop-blur-md flex items-center justify-center transition-colors ${
                      item.featured
                        ? 'bg-[#A58A5C] text-[#111111]'
                        : 'bg-[#111111]/60 text-white/70 hover:text-white'
                    }`}
                    title={item.featured ? 'Featured on Website' : 'Set as Featured'}
                  >
                    <Star size={13} fill={item.featured ? 'currentColor' : 'none'} />
                  </button>
                </div>

                <div className="p-3.5 space-y-1">
                  <h4 className="font-serif text-sm font-medium text-[#111111] truncate">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-[#77736C] line-clamp-1 font-mono">
                    {item.caption || item.category}
                  </p>
                </div>
              </div>

              <div className="p-2.5 bg-[#FAF8F5] border-t border-[#ECE8E0] flex items-center justify-between text-xs font-mono">
                <span className="text-[#A58A5C] text-[10px] uppercase font-semibold">
                  {item.featured ? 'Featured' : 'Standard'}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleOpenEdit(item)}
                    className="p-1 text-[#77736C] hover:text-[#111111] hover:bg-[#F4F1EB] rounded-xs"
                    title="Edit Metadata"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id, item.title)}
                    className="p-1 text-[#77736C] hover:text-[#962828] hover:bg-[#FDF0F0] rounded-xs"
                    title="Delete Image"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Upload & Edit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingItem ? 'Edit Media Metadata' : 'Upload Gallery Image'}
        subtitle="Visual Asset CMS"
      >
        <form onSubmit={handleSave} className="space-y-4">
          <div className="form-group !mb-0">
            <label className="form-label">Asset Title</label>
            <input
              type="text"
              required
              value={itemForm.title}
              onChange={(e) => setItemForm({ ...itemForm, title: e.target.value })}
              className="form-input text-xs"
              placeholder="e.g. Master Quarters Courtyard View"
            />
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Category</label>
            <select
              value={itemForm.category}
              onChange={(e) => setItemForm({ ...itemForm, category: e.target.value })}
              className="form-select text-xs font-mono"
            >
              {galleryCategories.filter((c) => c !== 'All').map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">High-Res Image URL</label>
            <input
              type="url"
              required
              value={itemForm.image}
              onChange={(e) => setItemForm({ ...itemForm, image: e.target.value })}
              className="form-input text-xs"
              placeholder="https://images.unsplash.com/..."
            />
          </div>

          <div className="form-group !mb-0">
            <label className="form-label">Caption / Architectural Note</label>
            <textarea
              rows={2}
              value={itemForm.caption}
              onChange={(e) => setItemForm({ ...itemForm, caption: e.target.value })}
              className="form-textarea text-xs"
              placeholder="Materiality, lighting, and spatial context..."
            />
          </div>

          <div className="pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none text-xs font-mono">
              <input
                type="checkbox"
                checked={itemForm.featured}
                onChange={(e) => setItemForm({ ...itemForm, featured: e.target.checked })}
                className="accent-[#A58A5C]"
              />
              <span>Feature prominently on public website homepage</span>
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#ECE8E0]">
            <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              {editingItem ? 'Save Metadata' : 'Save Image'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
