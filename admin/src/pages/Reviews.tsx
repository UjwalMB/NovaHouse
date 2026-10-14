import React, { useState } from 'react';
import {
  Star,
  CheckCircle,
  EyeOff,
  Trash2,
} from 'lucide-react';
import { initialReviews } from '../data/reviews';
import { useToast } from '../components/ui/Toast';
import Button from '../components/ui/Button';
import StatusBadge from '../components/ui/StatusBadge';
import { Review } from '../types';

export default function Reviews() {
  const { addToast } = useToast();
  const [reviews, setReviews] = useState<Review[]>(initialReviews);

  const totalReviews = reviews.length;
  const averageRating = totalReviews > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1)
    : '5.0';

  const handleApprove = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Approved' } : r))
    );
    addToast('Review approved for public website display.');
  };

  const handleHide = (id: string) => {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, status: 'Hidden' } : r))
    );
    addToast('Review hidden from public site.');
  };

  const handleDelete = (id: string, guest: string) => {
    if (window.confirm(`Delete review from ${guest}?`)) {
      setReviews((prev) => prev.filter((r) => r.id !== id));
      addToast(`Review from ${guest} deleted.`);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E2DDD5]">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#A58A5C] block mb-1">
            Reputation & Testimonials
          </span>
          <h2 className="font-serif text-3xl font-light text-[#111111] uppercase tracking-tight">
            Guest Reviews & Feedback
          </h2>
          <p className="text-xs text-[#77736C] mt-1">
            Moderate guest testimonials published on the public NOVA HOUSE website.
          </p>
        </div>
      </div>

      {/* Summary KPI Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="admin-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E2DDD5] text-[#A58A5C] flex items-center justify-center font-serif text-xl font-bold">
            ★
          </div>
          <div>
            <div className="font-serif text-3xl font-light text-[#111111]">
              {averageRating} <span className="text-sm font-mono text-[#77736C]">/ 5.0</span>
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#77736C]">
              Average Patron Rating
            </div>
          </div>
        </div>

        <div className="admin-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#FAF8F5] border border-[#E2DDD5] text-[#111111] flex items-center justify-center font-serif text-xl font-bold">
            {totalReviews}
          </div>
          <div>
            <div className="font-serif text-3xl font-light text-[#111111]">
              {totalReviews}
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#77736C]">
              Total Verified Reviews
            </div>
          </div>
        </div>

        <div className="admin-card p-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-[#EDF7F0] border border-[#C8E8D1] text-[#235C33] flex items-center justify-center font-serif text-xl font-bold">
            100%
          </div>
          <div>
            <div className="font-serif text-3xl font-light text-[#235C33]">
              100%
            </div>
            <div className="font-mono text-[10px] uppercase tracking-widest text-[#77736C]">
              Positive Recommendation
            </div>
          </div>
        </div>
      </div>

      {/* Reviews Stream Cards */}
      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="admin-card p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#ECE8E0]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[#111111] text-[#A58A5C] flex items-center justify-center font-serif text-xs font-semibold">
                  {r.guest.split(' ').map((n) => n[0]).join('')}
                </div>
                <div>
                  <div className="font-serif text-base font-medium text-[#111111]">
                    {r.guest}
                  </div>
                  <div className="text-[11px] text-[#77736C] font-mono">
                    {r.country} · {r.room}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3">
                {/* Star rating */}
                <div className="flex items-center text-[#A58A5C]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Star
                      key={i}
                      size={14}
                      fill={i < r.rating ? 'currentColor' : 'none'}
                    />
                  ))}
                </div>
                <StatusBadge status={r.status} />
              </div>
            </div>

            <div>
              <h4 className="font-serif text-base font-light text-[#111111] mb-1">
                "{r.title}"
              </h4>
              <p className="text-xs text-[#55514B] leading-relaxed font-sans">
                {r.comment}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono text-[#77736C]">
              <div>
                Recorded on {r.date} via {r.source}
              </div>

              <div className="flex items-center gap-2">
                {r.status !== 'Approved' && (
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={CheckCircle}
                    onClick={() => handleApprove(r.id)}
                  >
                    Approve
                  </Button>
                )}

                {r.status !== 'Hidden' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    icon={EyeOff}
                    onClick={() => handleHide(r.id)}
                  >
                    Hide
                  </Button>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  icon={Trash2}
                  onClick={() => handleDelete(r.id, r.guest)}
                >
                  Delete
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
