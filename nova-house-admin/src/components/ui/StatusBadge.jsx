import React from 'react';

export default function StatusBadge({ status, className = '' }) {
  if (!status) return null;

  const normalized = String(status).toLowerCase().trim();

  let badgeVariant = 'badge-neutral';

  switch (normalized) {
    case 'confirmed':
    case 'available':
    case 'active':
    case 'paid':
    case 'resolved':
    case 'approved':
      badgeVariant = 'badge-success';
      break;

    case 'pending':
    case 'in progress':
    case 'cleaning':
    case 'low stock':
    case 'scheduled':
      badgeVariant = 'badge-warning';
      break;

    case 'cancelled':
    case 'blocked':
    case 'maintenance':
    case 'expired':
    case 'hidden':
      badgeVariant = 'badge-danger';
      break;

    case 'occupied':
    case 'checked in':
      badgeVariant = 'badge-info';
      break;

    case 'reserved':
    case 'checked out':
    case 'draft':
    case 'vip':
      badgeVariant = 'badge-purple';
      break;

    default:
      badgeVariant = 'badge-neutral';
  }

  return (
    <span className={`badge ${badgeVariant} ${className}`}>
      <span className="badge-dot" />
      <span>{status}</span>
    </span>
  );
}
