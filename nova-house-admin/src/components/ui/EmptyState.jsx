import React from 'react';
import { Inbox } from 'lucide-react';
import Button from './Button';

export default function EmptyState({
  icon: Icon = Inbox,
  title = 'No records found',
  message = 'There are currently no items matching your criteria or filters.',
  actionLabel,
  onAction,
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center max-w-md mx-auto">
      <div className="w-14 h-14 rounded-full bg-[#FAF8F5] border border-[#E2DDD5] text-[#77736C] flex items-center justify-center mb-4">
        <Icon size={24} className="text-[#A58A5C]" />
      </div>
      <h4 className="font-serif text-lg font-light uppercase text-[#111111] mb-1">
        {title}
      </h4>
      <p className="text-xs text-[#77736C] mb-6 leading-relaxed">
        {message}
      </p>
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
}
