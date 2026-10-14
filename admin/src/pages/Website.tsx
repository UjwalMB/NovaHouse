import React, { useState } from 'react';
import {
  Save,
  Home,
  Info,
  MapPin,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { useWebsiteContent } from '../hooks/useWebsiteContent';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import LoadingState from '../components/ui/LoadingState';

const cmsSections = [
  { id: 'homepage', label: 'Homepage Hero & Story', icon: Home },
  { id: 'hotelInfo', label: 'Hotel Information & Contact', icon: Info },
  { id: 'location', label: 'Location & Nearby Landmarks', icon: MapPin },
  { id: 'policies', label: 'Guest Policies & Terms', icon: FileText },
];

export default function Website() {
  const { content, loading, updateSection } = useWebsiteContent();
  const { addToast } = useToast();

  const [activeTab, setActiveTab] = useState('homepage');

  // Local form states
  const [homepageForm, setHomepageForm] = useState<any>(null);
  const [hotelInfoForm, setHotelInfoForm] = useState<any>(null);
  const [locationForm, setLocationForm] = useState<any>(null);
  const [policiesForm, setPoliciesForm] = useState<any>(null);

  React.useEffect(() => {
    if (content) {
      setHomepageForm(content.homepage || {});
      setHotelInfoForm(content.hotelInfo || {});
      setLocationForm(content.location || {});
      setPoliciesForm(content.policies || {});
    }
  }, [content]);

  if (loading || !homepageForm) {
    return (
      <div className="admin-card p-16">
        <LoadingState message="Loading website CMS content..." />
      </div>
    );
  }

  const handleSaveHomepage = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSection('homepage', homepageForm);
    addToast('Public website homepage content saved successfully.');
  };

  const handleSaveHotelInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSection('hotelInfo', hotelInfoForm);
    addToast('Hotel contact & brand information saved.');
  };

  const handleSaveLocation = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSection('location', locationForm);
    addToast('Location coordinates & nearby attractions saved.');
  };

  const handleSavePolicies = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSection('policies', policiesForm);
    addToast('Guest policies and reservation terms saved.');
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Digital Brand CMS
          </span>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Public Website Content (CMS)
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Directly update headings, hero photography, contact info, and landmarks displayed on the public NOVA HOUSE site.
          </p>
        </div>

        <a
          href={(import.meta as any).env?.VITE_PUBLIC_WEBSITE_URL || "http://127.0.0.1:5173"}
          target="_blank"
          rel="noopener noreferrer"
          className="btn btn-secondary btn-sm"
        >
          <span>Preview Live Website</span>
          <ExternalLink size={13} className="text-[#A58A5C]" />
        </a>
      </div>

      {/* Structured CMS Navigation Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-[#E2DDD5] pb-2">
        {cmsSections.map((sec) => {
          const Icon = sec.icon;
          const isActive = activeTab === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveTab(sec.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono uppercase tracking-wider rounded-xs transition-all ${
                isActive
                  ? 'bg-[#111111] text-[#F4F1EB] font-semibold shadow-xs'
                  : 'bg-[#FFFFFF] text-[#55514B] border border-[#E2DDD5] hover:border-[#CDC7BC]'
              }`}
            >
              <Icon size={14} className={isActive ? 'text-[#A58A5C]' : 'text-[#77736C]'} />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab 1: Homepage Hero & Story */}
      {activeTab === 'homepage' && (
        <form onSubmit={handleSaveHomepage} className="space-y-6">
          {/* Hero Section Card */}
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
                  Above-the-Fold Visuals
                </span>
                <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
                  Hero Headline & Photography
                </h3>
              </div>
              <Button variant="gold" size="sm" icon={Save} type="submit">
                Save Homepage
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group !mb-0">
                  <label className="form-label">Hero Headline</label>
                  <input
                    type="text"
                    value={homepageForm.hero?.headline || ''}
                    onChange={(e) =>
                      setHomepageForm({
                        ...homepageForm,
                        hero: { ...homepageForm.hero, headline: e.target.value },
                      })
                    }
                    className="form-input text-xs"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Hero Subheadline</label>
                  <input
                    type="text"
                    value={homepageForm.hero?.subheadline || ''}
                    onChange={(e) =>
                      setHomepageForm({
                        ...homepageForm,
                        hero: { ...homepageForm.hero, subheadline: e.target.value },
                      })
                    }
                    className="form-input text-xs"
                  />
                </div>

                <div className="form-group sm:col-span-2 !mb-0">
                  <label className="form-label">Hero Background Image URL</label>
                  <input
                    type="url"
                    value={homepageForm.hero?.heroImage || ''}
                    onChange={(e) =>
                      setHomepageForm({
                        ...homepageForm,
                        hero: { ...homepageForm.hero, heroImage: e.target.value },
                      })
                    }
                    className="form-input text-xs"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Primary CTA Button Label</label>
                  <input
                    type="text"
                    value={homepageForm.hero?.primaryCtaText || ''}
                    onChange={(e) =>
                      setHomepageForm({
                        ...homepageForm,
                        hero: { ...homepageForm.hero, primaryCtaText: e.target.value },
                      })
                    }
                    className="form-input text-xs font-mono"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Secondary CTA Button Label</label>
                  <input
                    type="text"
                    value={homepageForm.hero?.secondaryCtaText || ''}
                    onChange={(e) =>
                      setHomepageForm({
                        ...homepageForm,
                        hero: { ...homepageForm.hero, secondaryCtaText: e.target.value },
                      })
                    }
                    className="form-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Hero Narrative Description</label>
                <textarea
                  rows={2}
                  value={homepageForm.hero?.description || ''}
                  onChange={(e) =>
                    setHomepageForm({
                      ...homepageForm,
                      hero: { ...homepageForm.hero, description: e.target.value },
                    })
                  }
                  className="form-textarea text-xs"
                />
              </div>
            </div>
          </div>

          {/* Intro Story Philosophy Card */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
                Philosophy & Architectural Pillars
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group !mb-0">
                  <label className="form-label">Intro Editorial Tagline</label>
                  <input
                    type="text"
                    value={homepageForm.intro?.tagline || ''}
                    onChange={(e) =>
                      setHomepageForm({
                        ...homepageForm,
                        intro: { ...homepageForm.intro, tagline: e.target.value },
                      })
                    }
                    className="form-input text-xs font-mono"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Intro Big Heading</label>
                  <input
                    type="text"
                    value={homepageForm.intro?.heading || ''}
                    onChange={(e) =>
                      setHomepageForm({
                        ...homepageForm,
                        intro: { ...homepageForm.intro, heading: e.target.value },
                      })
                    }
                    className="form-input text-xs"
                  />
                </div>
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Architectural Solitude Narrative</label>
                <textarea
                  rows={3}
                  value={homepageForm.intro?.description || ''}
                  onChange={(e) =>
                    setHomepageForm({
                      ...homepageForm,
                      intro: { ...homepageForm.intro, description: e.target.value },
                    })
                  }
                  className="form-textarea text-xs"
                />
              </div>
            </div>
          </div>

          {/* Final CTA Banner */}
          <div className="admin-card">
            <div className="admin-card-header">
              <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
                Final Call-to-Action Banner ("See You in Bengaluru")
              </h3>
            </div>
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="form-group !mb-0">
                  <label className="form-label">Closing Headline</label>
                  <input
                    type="text"
                    value={homepageForm.finalCta?.heading || ''}
                    onChange={(e) =>
                      setHomepageForm({
                        ...homepageForm,
                        finalCta: { ...homepageForm.finalCta, heading: e.target.value },
                      })
                    }
                    className="form-input text-xs"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Button Label</label>
                  <input
                    type="text"
                    value={homepageForm.finalCta?.buttonText || ''}
                    onChange={(e) =>
                      setHomepageForm({
                        ...homepageForm,
                        finalCta: { ...homepageForm.finalCta, buttonText: e.target.value },
                      })
                    }
                    className="form-input text-xs font-mono"
                  />
                </div>

                <div className="form-group sm:col-span-2 !mb-0">
                  <label className="form-label">Dusk Skyline Image URL</label>
                  <input
                    type="url"
                    value={homepageForm.finalCta?.backgroundImage || ''}
                    onChange={(e) =>
                      setHomepageForm({
                        ...homepageForm,
                        finalCta: { ...homepageForm.finalCta, backgroundImage: e.target.value },
                      })
                    }
                    className="form-input text-xs"
                  />
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Tab 2: Hotel Information & Contacts */}
      {activeTab === 'hotelInfo' && (
        <form onSubmit={handleSaveHotelInfo} className="space-y-6">
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
                  Identity & Digital Footprint
                </span>
                <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
                  Hotel Information & Inquiries
                </h3>
              </div>
              <Button variant="gold" size="sm" icon={Save} type="submit">
                Save Hotel Details
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="form-group !mb-0">
                  <label className="form-label">Hotel Name</label>
                  <input
                    type="text"
                    value={hotelInfoForm.name || ''}
                    onChange={(e) => setHotelInfoForm({ ...hotelInfoForm, name: e.target.value })}
                    className="form-input text-xs font-serif"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Tagline</label>
                  <input
                    type="text"
                    value={hotelInfoForm.tagline || ''}
                    onChange={(e) => setHotelInfoForm({ ...hotelInfoForm, tagline: e.target.value })}
                    className="form-input text-xs"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Direct Phone</label>
                  <input
                    type="text"
                    value={hotelInfoForm.phone || ''}
                    onChange={(e) => setHotelInfoForm({ ...hotelInfoForm, phone: e.target.value })}
                    className="form-input text-xs font-mono"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Inquiries Email</label>
                  <input
                    type="email"
                    value={hotelInfoForm.email || ''}
                    onChange={(e) => setHotelInfoForm({ ...hotelInfoForm, email: e.target.value })}
                    className="form-input text-xs font-mono"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Concierge WhatsApp</label>
                  <input
                    type="text"
                    value={hotelInfoForm.whatsapp || ''}
                    onChange={(e) => setHotelInfoForm({ ...hotelInfoForm, whatsapp: e.target.value })}
                    className="form-input text-xs font-mono"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Standard Check-In</label>
                  <input
                    type="text"
                    value={hotelInfoForm.checkInTime || ''}
                    onChange={(e) => setHotelInfoForm({ ...hotelInfoForm, checkInTime: e.target.value })}
                    className="form-input text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2">
                <div className="form-group sm:col-span-2 !mb-0">
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    value={hotelInfoForm.address || ''}
                    onChange={(e) => setHotelInfoForm({ ...hotelInfoForm, address: e.target.value })}
                    className="form-input text-xs"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">City & State</label>
                  <input
                    type="text"
                    value={`${hotelInfoForm.city || ''}, ${hotelInfoForm.state || ''}`}
                    onChange={(e) => {
                      const [city, state] = e.target.value.split(',').map((s) => s.trim());
                      setHotelInfoForm({ ...hotelInfoForm, city, state });
                    }}
                    className="form-input text-xs"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">PIN Code</label>
                  <input
                    type="text"
                    value={hotelInfoForm.pinCode || ''}
                    onChange={(e) => setHotelInfoForm({ ...hotelInfoForm, pinCode: e.target.value })}
                    className="form-input text-xs font-mono"
                  />
                </div>
              </div>

              {/* Social URLs */}
              <div className="pt-4 border-t border-[#ECE8E0] space-y-3">
                <span className="font-mono text-xs uppercase tracking-widest text-[#77736C] block font-semibold">
                  Social Channels
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="form-group !mb-0">
                    <label className="text-[10px] uppercase text-[#77736C]">Instagram</label>
                    <input
                      type="url"
                      value={hotelInfoForm.socials?.instagram || ''}
                      onChange={(e) =>
                        setHotelInfoForm({
                          ...hotelInfoForm,
                          socials: { ...hotelInfoForm.socials, instagram: e.target.value },
                        })
                      }
                      className="form-input text-xs font-mono"
                    />
                  </div>

                  <div className="form-group !mb-0">
                    <label className="text-[10px] uppercase text-[#77736C]">LinkedIn</label>
                    <input
                      type="url"
                      value={hotelInfoForm.socials?.linkedin || ''}
                      onChange={(e) =>
                        setHotelInfoForm({
                          ...hotelInfoForm,
                          socials: { ...hotelInfoForm.socials, linkedin: e.target.value },
                        })
                      }
                      className="form-input text-xs font-mono"
                    />
                  </div>

                  <div className="form-group !mb-0">
                    <label className="text-[10px] uppercase text-[#77736C]">Facebook</label>
                    <input
                      type="url"
                      value={hotelInfoForm.socials?.facebook || ''}
                      onChange={(e) =>
                        setHotelInfoForm({
                          ...hotelInfoForm,
                          socials: { ...hotelInfoForm.socials, facebook: e.target.value },
                        })
                      }
                      className="form-input text-xs font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Tab 3: Location & Coordinates */}
      {activeTab === 'location' && (
        <form onSubmit={handleSaveLocation} className="space-y-6">
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
                  Cartographic GIS Configuration
                </span>
                <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
                  Coordinates & Google Maps Integration
                </h3>
              </div>
              <Button variant="gold" size="sm" icon={Save} type="submit">
                Save Location
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="form-group !mb-0">
                  <label className="form-label">Latitude</label>
                  <input
                    type="text"
                    value={locationForm.latitude || ''}
                    onChange={(e) => setLocationForm({ ...locationForm, latitude: e.target.value })}
                    className="form-input text-xs font-mono"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Longitude</label>
                  <input
                    type="text"
                    value={locationForm.longitude || ''}
                    onChange={(e) => setLocationForm({ ...locationForm, longitude: e.target.value })}
                    className="form-input text-xs font-mono"
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">Display Coordinates String</label>
                  <input
                    type="text"
                    value={locationForm.coordinatesDisplay || ''}
                    onChange={(e) => setLocationForm({ ...locationForm, coordinatesDisplay: e.target.value })}
                    className="form-input text-xs font-mono"
                  />
                </div>

                <div className="form-group sm:col-span-3 !mb-0">
                  <label className="form-label">Google Maps Directions Deep Link</label>
                  <input
                    type="url"
                    value={locationForm.googleMapsUrl || ''}
                    onChange={(e) => setLocationForm({ ...locationForm, googleMapsUrl: e.target.value })}
                    className="form-input text-xs font-mono"
                  />
                </div>
              </div>

              {/* Nearby Attractions List */}
              <div className="pt-4 border-t border-[#ECE8E0] space-y-3">
                <span className="font-mono text-xs uppercase tracking-widest text-[#77736C] block font-semibold">
                  Nearby Key Attractions & Drive Times
                </span>

                <div className="space-y-3">
                  {locationForm.attractions?.map((attr: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-[#FAF8F5] border border-[#ECE8E0] rounded-xs grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs"
                    >
                      <div>
                        <span className="text-[10px] font-mono text-[#77736C] uppercase">Landmark</span>
                        <div className="font-semibold text-[#111111]">{attr.name}</div>
                      </div>
                      <div>
                        <span className="text-[10px] font-mono text-[#77736C] uppercase">Distance & Drive</span>
                        <div className="font-mono text-[#A58A5C]">{attr.distance} · {attr.driveTime}</div>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-[10px] font-mono text-[#77736C] uppercase">Editorial Note</span>
                        <div className="text-[#77736C] truncate">{attr.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </form>
      )}

      {/* Tab 4: Policies */}
      {activeTab === 'policies' && (
        <form onSubmit={handleSavePolicies} className="space-y-6">
          <div className="admin-card">
            <div className="admin-card-header">
              <div>
                <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
                  Terms of Hospitality
                </span>
                <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
                  Reservation & Guest Policies
                </h3>
              </div>
              <Button variant="gold" size="sm" icon={Save} type="submit">
                Save Policies
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <div className="form-group !mb-0">
                <label className="form-label">Cancellation Policy</label>
                <textarea
                  rows={2}
                  value={policiesForm.cancellation || ''}
                  onChange={(e) => setPoliciesForm({ ...policiesForm, cancellation: e.target.value })}
                  className="form-textarea text-xs"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Children & Extra Bedding Policy</label>
                <textarea
                  rows={2}
                  value={policiesForm.children || ''}
                  onChange={(e) => setPoliciesForm({ ...policiesForm, children: e.target.value })}
                  className="form-textarea text-xs"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Pet & Service Animal Policy</label>
                <textarea
                  rows={2}
                  value={policiesForm.pets || ''}
                  onChange={(e) => setPoliciesForm({ ...policiesForm, pets: e.target.value })}
                  className="form-textarea text-xs"
                />
              </div>

              <div className="form-group !mb-0">
                <label className="form-label">Smoking & Acoustic Solitude Policy</label>
                <textarea
                  rows={2}
                  value={policiesForm.smoking || ''}
                  onChange={(e) => setPoliciesForm({ ...policiesForm, smoking: e.target.value })}
                  className="form-textarea text-xs"
                />
              </div>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
