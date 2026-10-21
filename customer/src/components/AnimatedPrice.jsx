import React, { useEffect, useRef } from 'react';
import { animateCounter } from '../utils/animations';

export default function AnimatedPrice({
  value = 0,
  prefix = '₹ ',
  suffix = '',
  className = '',
}) {
  const spanRef = useRef(null);
  const prevValueRef = useRef(0);

  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(String(value).replace(/[^0-9]/g, ''), 10) || 0;
    const anim = animateCounter(spanRef.current, {
      start: prevValueRef.current,
      end: num,
      prefix,
      suffix,
      duration: 750,
    });

    prevValueRef.current = num;

    return () => {
      if (anim && typeof anim.pause === 'function') {
        anim.pause();
      }
    };
  }, [value, prefix, suffix]);

  return (
    <span ref={spanRef} className={className}>
      {prefix}
      {Math.round(value || 0).toLocaleString('en-IN')}
      {suffix}
    </span>
  );
}
