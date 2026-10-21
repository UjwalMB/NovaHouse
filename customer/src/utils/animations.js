import { animate, createTimeline, stagger } from 'animejs';

/**
 * Checks if user prefers reduced motion
 */
export function prefersReducedMotion() {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Animate a numeric value on a DOM element using Anime.js
 * @param {HTMLElement} element - Target DOM element to display the number
 * @param {Object} options - Animation configuration
 * @param {number} options.start - Starting number (default: 0)
 * @param {number} options.end - Ending number
 * @param {string} [options.prefix=''] - Prefix like '₹'
 * @param {string} [options.suffix=''] - Suffix like '/ night' or '%'
 * @param {number} [options.duration=850] - Duration in ms
 * @param {Function} [options.formatter] - Custom number formatter
 */
export function animateCounter(element, {
  start = 0,
  end,
  prefix = '',
  suffix = '',
  duration = 850,
  formatter = (v) => Math.round(v).toLocaleString('en-IN'),
} = {}) {
  if (!element || isNaN(end)) return null;

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
      element.textContent = `${prefix}${formatter(obj.val)}${suffix}`;
    },
  });
}

/**
 * Anime.js Hero Entrance Timeline
 */
export function animateHeroEntrance({
  badge,
  headlineLines,
  subhead,
  ctaButtons,
  accentLine,
  footerMeta,
} = {}) {
  if (prefersReducedMotion()) return null;

  const tl = createTimeline({
    defaults: {
      ease: 'outCubic',
      duration: 800,
    },
  });

  if (badge) {
    tl.add(badge, {
      opacity: [0, 1],
      translateY: [-15, 0],
      duration: 600,
    });
  }

  if (headlineLines && headlineLines.length > 0) {
    tl.add(headlineLines, {
      opacity: [0, 1],
      translateY: [35, 0],
      delay: stagger(120),
      duration: 900,
    }, '-=300');
  }

  if (accentLine) {
    tl.add(accentLine, {
      scaleX: [0, 1],
      opacity: [0, 1],
      duration: 700,
      ease: 'outQuart',
    }, '-=400');
  }

  if (subhead) {
    tl.add(subhead, {
      opacity: [0, 1],
      translateY: [20, 0],
      duration: 700,
    }, '-=350');
  }

  if (ctaButtons && ctaButtons.length > 0) {
    tl.add(ctaButtons, {
      opacity: [0, 1],
      translateY: [15, 0],
      delay: stagger(100),
      duration: 600,
    }, '-=300');
  }

  if (footerMeta) {
    tl.add(footerMeta, {
      opacity: [0, 1],
      duration: 600,
    }, '-=200');
  }

  return tl;
}

/**
 * Motion.dev animation presets & hover gestures
 */
export const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.05,
    },
  },
};

export const modalBackdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.25, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.2, ease: 'easeIn' } },
};

export const modalDialogVariants = {
  hidden: { opacity: 0, scale: 0.95, y: 16 },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {
      type: 'spring',
      damping: 28,
      stiffness: 340,
      mass: 0.8,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 10,
    transition: { duration: 0.18, ease: 'easeIn' },
  },
};

export const drawerVariants = {
  hidden: { x: '100%', opacity: 0.9 },
  visible: {
    x: '0%',
    opacity: 1,
    transition: {
      type: 'spring',
      damping: 32,
      stiffness: 320,
      mass: 0.85,
    },
  },
  exit: {
    x: '100%',
    opacity: 0.9,
    transition: { duration: 0.24, ease: [0.32, 0, 0.67, 0] },
  },
};

/**
 * Tactile micro-interactions for buttons, chips, and cards
 */
export const buttonTactile = {
  whileHover: {
    scale: 1.03,
    y: -2,
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
  whileTap: { scale: 0.96, y: 0 },
};

export const buttonPrimaryGlow = {
  whileHover: {
    scale: 1.03,
    y: -2,
    boxShadow: '0 12px 30px -4px rgba(182, 154, 104, 0.45)',
    transition: { type: 'spring', stiffness: 400, damping: 20 },
  },
  whileTap: { scale: 0.96, y: 0 },
};

export const buttonSecondaryTactile = {
  whileHover: {
    scale: 1.025,
    y: -1.5,
    boxShadow: '0 6px 20px rgba(0, 0, 0, 0.08)',
    transition: { duration: 0.2, ease: 'easeOut' },
  },
  whileTap: { scale: 0.97, y: 0 },
};

export const chipInteractive = {
  whileHover: {
    scale: 1.04,
    y: -1,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
  whileTap: { scale: 0.95 },
};

export const cardInteractive = {
  whileHover: {
    y: -4,
    boxShadow: '0 16px 36px -6px rgba(0, 0, 0, 0.14)',
    transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] },
  },
  whileTap: { scale: 0.99 },
};
