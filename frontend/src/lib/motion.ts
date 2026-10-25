import { Transition, Variants } from 'framer-motion';

/**
 * Emil Kowalski's Design Engineering & Apple Fluid Interface Motion System
 * 
 * Core Principles:
 * 1. Springs, Not Curves (ban ease-in; use critically damped interruptible springs).
 * 2. Critically Damped: Damping ratio ~1.0 for fast, smooth settles without unnatural bouncing.
 * 3. Never scale from 0: Enter from scale 0.95/0.9 combined with opacity 0.
 * 4. Tactile Feedback: Instant tactile feedback on press (whileTap scale 0.92 - 0.98).
 * 5. Respect prefers-reduced-motion across all transitions.
 */

// Centralized Spring Configurations
export const springTactile: Transition = {
  type: 'spring',
  stiffness: 400,
  damping: 28,
  mass: 0.6,
};

export const springDefault: Transition = {
  type: 'spring',
  stiffness: 320,
  damping: 26,
  mass: 0.7,
};

export const springGentle: Transition = {
  type: 'spring',
  stiffness: 240,
  damping: 25,
  mass: 0.8,
};

export const springSheet: Transition = {
  type: 'spring',
  stiffness: 340,
  damping: 32,
  mass: 0.75,
};

export const springModal: Transition = {
  type: 'spring',
  stiffness: 380,
  damping: 28,
  mass: 0.7,
};

export const springStiff: Transition = {
  type: 'spring',
  stiffness: 500,
  damping: 32,
  mass: 0.5,
};

// Tactile Press Scaling Tokens
export const tactilePress = {
  icon: { scale: 0.92 },
  button: { scale: 0.96 },
  pill: { scale: 0.95 },
  card: { scale: 0.98 },
};

export const tactileHover = {
  card: { y: -2, transition: springTactile },
  button: { y: -1, transition: springTactile },
};

/**
 * Checks if the user prefers reduced motion
 */
export function prefersReducedMotion(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Modal Scale Fade Variant (Critically damped, enters from scale 0.95, NEVER scale 0)
 */
export const modalScaleFade: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 8,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springModal,
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 6,
    transition: { duration: 0.15, ease: 'easeOut' },
  },
};

/**
 * Card Enter Variant (Scale 0.95 to 1.0 with subtle spring lift)
 */
export const cardEnter: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.95,
    y: 12,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springGentle,
  },
  exit: {
    opacity: 0,
    scale: 0.97,
    y: 6,
    transition: { duration: 0.12 },
  },
};

/**
 * Stagger List Container
 */
export const staggerListContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.02,
    },
  },
};

/**
 * List Item Variant
 */
export const listItemVariant: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.96,
    y: 10,
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: springDefault,
  },
};

/**
 * Smooth Fade-Slide Up (for tabs & bottom sheets)
 */
export const fadeSlideUp: Variants = {
  hidden: {
    opacity: 0,
    y: 16,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: springSheet,
  },
  exit: {
    opacity: 0,
    y: 12,
    transition: { duration: 0.15 },
  },
};

/**
 * Backdrop Fade
 */
export const backdropFade: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.2 },
  },
  exit: {
    opacity: 0,
    transition: { duration: 0.15 },
  },
};

/**
 * Safely wraps variants for prefers-reduced-motion
 */
export function getSafeVariants(variants: Variants): Variants {
  if (prefersReducedMotion()) {
    return {
      hidden: { opacity: 0 },
      visible: { opacity: 1, transition: { duration: 0.01 } },
      exit: { opacity: 0, transition: { duration: 0.01 } },
    };
  }
  return variants;
}
