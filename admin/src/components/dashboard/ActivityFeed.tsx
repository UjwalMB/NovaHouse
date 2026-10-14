import React from 'react';
import {
  CalendarCheck,
  UserCheck,
  DoorOpen,
  Mail,
  CreditCard,
  Clock,
  LucideIcon,
} from 'lucide-react';
import { initialActivityFeed } from '../../data/mockData';

const iconMap: Record<string, LucideIcon> = {
  booking: CalendarCheck,
  checkin: UserCheck,
  room: DoorOpen,
  enquiry: Mail,
  payment: CreditCard,
};

export default function ActivityFeed() {
  return (
    <div className="admin-card">
      <div className="admin-card-header">
        <div>
          <span className="font-mono text-[10px] uppercase tracking-widest text-[#A58A5C] block">
            Realtime Audit Log
          </span>
          <h3 className="font-serif text-lg font-light uppercase text-[#111111]">
            Operations Activity Feed
          </h3>
        </div>
        <span className="flex items-center gap-1.5 font-mono text-[11px] text-[#A58A5C]">
          <span className="w-2 h-2 rounded-full bg-[#A58A5C] animate-ping" />
          <span>Live Stream</span>
        </span>
      </div>

      <div className="p-6">
        <div className="space-y-5">
          {initialActivityFeed.map((item) => {
            const Icon = iconMap[item.type] || Clock;
            return (
              <div key={item.id} className="flex items-start gap-3.5">
                <div className="w-8 h-8 rounded-xs bg-[#FAF8F5] border border-[#E2DDD5] text-[#A58A5C] flex items-center justify-center shrink-0 mt-0.5">
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#111111]">{item.title}</span>
                    <span className="font-mono text-[10px] text-[#77736C] shrink-0">{item.time}</span>
                  </div>
                  <p className="text-xs text-[#77736C] mt-0.5 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
