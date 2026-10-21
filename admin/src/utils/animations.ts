import { animate } from 'animejs';

/**
 * Checks if user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Options for numeric counter animation
 */
export interface CounterOptions {
  start?: number;
  end: number;
  prefix?: string;
  suffix?: string;
  duration?: number;
  formatter?: (val: number) => string;
}

/**
 * Animate a numeric value on a DOM element using Anime.js
 */
export function animateCounter(
  element: HTMLElement | null,
  options: CounterOptions
) {
  if (!element || isNaN(options.end)) return null;

  const {
    start = 0,
    end,
    prefix = '',
    suffix = '',
    duration = 850,
    formatter = (v: number) => Math.round(v).toLocaleString('en-IN'),
  } = options;

  if (prefersReducedMotion()) {
    element.textContent = `${prefix}${formatter(end)}${suffix}`;
    return null;
  }

  const obj = { val: start };
  return animate(obj, {
    val: end,
    duration,
    ease: 'outExpo',
    onUpdate: () => {
      if (element) {
        element.textContent = `${prefix}${formatter(obj.val)}${suffix}`;
      }
    },
  });
}

/**
 * Motion.dev animation presets for standard UI elements
 */
export const motionPresets = {
  button: {
    whileHover: { scale: 1.02 },
    whileTap: { scale: 0.97 },
    transition: { type: 'spring' as const, stiffness: 450, damping: 25 },
  },
  buttonSubtle: {
    whileHover: { scale: 1.015 },
    whileTap: { scale: 0.98 },
    transition: { type: 'spring' as const, stiffness: 500, damping: 30 },
  },
  cardHover: {
    whileHover: {
      y: -3,
      transition: { duration: 0.2, ease: 'easeOut' as const },
    },
  },
  fadeInUp: {
    initial: { opacity: 0, y: 14 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: 8 },
    transition: { duration: 0.3, ease: 'easeOut' as const },
  },
  modalPop: {
    initial: { opacity: 0, scale: 0.96, y: 8 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.96, y: 8 },
    transition: { duration: 0.2, ease: 'easeOut' as const },
  },
};
