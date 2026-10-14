import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';

export interface TrendInfo {
  direction: 'up' | 'down' | 'neutral';
  value: string;
}

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: TrendInfo;
  icon?: LucideIcon;
  accent?: boolean;
  className?: string;
}

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  accent = false,
  className = '',
}: StatCardProps) {
  return (
    <div className={`stat-card ${className} ${accent ? 'border-l-4 !border-l-[#A58A5C]' : ''}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <span className="font-mono text-xs uppercase tracking-widest text-[#77736C] block mb-1">
            {title}
          </span>
          <div className="font-serif text-3xl font-light text-[#111111] tracking-tight">
            {value}
          </div>
        </div>
        {Icon && (
          <div className="w-10 h-10 rounded-sm bg-[#F4F1EB] text-[#111111] flex items-center justify-center shrink-0">
            <Icon size={18} className="text-[#A58A5C]" />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="flex items-center gap-2 mt-4 pt-3 border-t border-[#ECE8E0] text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-1 font-mono font-medium ${
                trend.direction === 'up'
                  ? 'text-[#235C33]'
                  : trend.direction === 'down'
                  ? 'text-[#962828]'
                  : 'text-[#77736C]'
              }`}
            >
              {trend.direction === 'up' && <TrendingUp size={13} />}
              {trend.direction === 'down' && <TrendingDown size={13} />}
              {trend.direction === 'neutral' && <Minus size={13} />}
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-[#77736C]">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
