import React, { useEffect, useRef } from 'react';
import { animateCounter } from '../../utils/animations';

interface AnimatedCounterProps {
  value: number | string;
  prefix?: string;
  suffix?: string;
  duration?: number;
  className?: string;
  formatter?: (val: number) => string;
}

export default function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 850,
  className = '',
  formatter,
}: AnimatedCounterProps) {
  const spanRef = useRef<HTMLSpanElement>(null);
  const prevValueRef = useRef<number>(0);

  // If value is a string with numbers like "₹ 18,500" or "85%", extract numeric part if possible
  const numericVal = typeof value === 'number'
    ? value
    : parseFloat(String(value).replace(/[^0-9.-]+/g, ''));

  const isNumeric = !isNaN(numericVal);

  useEffect(() => {
    if (!isNumeric || !spanRef.current) return;

    const anim = animateCounter(spanRef.current, {
      start: prevValueRef.current,
      end: numericVal,
      prefix,
      suffix,
      duration,
      formatter,
    });

    prevValueRef.current = numericVal;

    return () => {
      // In anime.js v4, if anim has pause or stop
      if (anim && typeof (anim as any).pause === 'function') {
        (anim as any).pause();
      }
    };
  }, [numericVal, prefix, suffix, duration, formatter, isNumeric]);

  if (!isNumeric) {
    return <span className={`tabular-nums ${className}`}>{prefix}{value}{suffix}</span>;
  }

  return (
    <span
      ref={spanRef}
      className={`tabular-nums ${className}`}
    >
      {prefix}{formatter ? formatter(numericVal) : Math.round(numericVal).toLocaleString('en-IN')}{suffix}
    </span>
  );
}
