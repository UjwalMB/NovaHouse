import React from 'react';
import { TrendingUp, TrendingDown, Minus, LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import AnimatedCounter from './AnimatedCounter';

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
  animated?: boolean;
}

export default function StatCard({
  title,
  value,
  subtitle,
  trend,
  icon: Icon,
  accent = false,
  className = '',
  animated = true,
}: StatCardProps) {
  // Parse numeric string if possible for Anime.js rolling counter
  let prefix = '';
  let numericValue: number | null = null;
  let suffix = '';

  if (typeof value === 'number') {
    numericValue = value;
  } else if (typeof value === 'string' && animated) {
    const match = value.match(/^([^\d.-]*)([\d,]+(?:\.\d+)?)(.*)$/);
    if (match) {
      prefix = match[1];
      const parsed = parseFloat(match[2].replace(/,/g, ''));
      if (!isNaN(parsed)) {
        numericValue = parsed;
        suffix = match[3];
      }
    }
  }

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.2, ease: 'easeOut' } }}
      className={`stat-card transition-shadow hover:shadow-md ${className} ${
        accent ? 'border-l-4 !border-l-[#A58A5C]' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <span className="font-mono text-xs uppercase tracking-widest text-[#383531] block mb-1">
            {title}
          </span>
          <div className="font-sans text-xl sm:text-2xl 2xl:text-3xl font-semibold text-[#111111] tracking-tight tabular-nums whitespace-nowrap overflow-hidden text-ellipsis">
            {numericValue !== null ? (
              <AnimatedCounter
                value={numericValue}
                prefix={prefix}
                suffix={suffix}
              />
            ) : (
              value
            )}
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
                  : 'text-[#383531]'
              }`}
            >
              {trend.direction === 'up' && <TrendingUp size={13} />}
              {trend.direction === 'down' && <TrendingDown size={13} />}
              {trend.direction === 'neutral' && <Minus size={13} />}
              {trend.value}
            </span>
          )}
          {subtitle && <span className="text-[#383531] truncate">{subtitle}</span>}
        </div>
      )}
    </motion.div>
  );
}

