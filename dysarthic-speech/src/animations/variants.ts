// ═══════════════════════════════════════════════════
// Framer Motion Animation Variants
// ═══════════════════════════════════════════════════

import type { Variants } from 'framer-motion';

// ─── Fade & Slide ───
export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export const fadeInScale: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { duration: 0.4 },
  },
};

export const slideInLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

export const slideInRight: Variants = {
  hidden: { opacity: 0, x: 40 },
  visible: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] },
  },
};

// ─── Container with Stagger ───
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
};

export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
};

// ─── Pipeline Step ───
export const pipelineStep: Variants = {
  pending: {
    opacity: 0.4,
    scale: 0.95,
  },
  active: {
    opacity: 1,
    scale: 1,
    transition: {
      duration: 0.5,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  completed: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.3 },
  },
};

// ─── Glow Pulse ───
export const glowPulse: Variants = {
  idle: { boxShadow: '0 0 0px rgba(0,212,255,0)' },
  active: {
    boxShadow: [
      '0 0 10px rgba(0,212,255,0.2)',
      '0 0 30px rgba(0,212,255,0.4)',
      '0 0 10px rgba(0,212,255,0.2)',
    ],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut',
    },
  },
};

// ─── Neural Node ───
export const neuralNodeActivation: Variants = {
  idle: {
    scale: 1,
    backgroundColor: '#1a2235',
    boxShadow: '0 0 0px rgba(0,212,255,0)',
  },
  active: {
    scale: [1, 1.4, 1.2],
    backgroundColor: '#00D4FF',
    boxShadow: '0 0 15px rgba(0,212,255,0.7)',
    transition: {
      duration: 0.5,
      ease: 'easeOut',
    },
  },
  completed: {
    scale: 1,
    backgroundColor: '#22C55E',
    boxShadow: '0 0 8px rgba(34,197,94,0.5)',
    transition: { duration: 0.3 },
  },
};

// ─── Typewriter Word ───
export const typewriterWord: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    scale: 0.8,
    filter: 'blur(4px)',
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    filter: 'blur(0px)',
    transition: {
      duration: 0.4,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

// ─── Upload Zone ───
export const uploadZoneDrag: Variants = {
  idle: { scale: 1, borderColor: 'rgba(0,212,255,0.2)' },
  active: {
    scale: 1.01,
    borderColor: 'rgba(0,212,255,0.6)',
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// ─── Particle ───
export const particleFloat: Variants = {
  initial: (_i: number) => ({
    x: 0,
    y: 0,
    opacity: 0,
    scale: 0,
  }),
  animate: (i: number) => ({
    x: [0, Math.sin(i * 0.5) * 30, 0],
    y: [0, -60 - i * 10, -120],
    opacity: [0, 1, 0],
    scale: [0, 1, 0],
    transition: {
      duration: 2 + i * 0.2,
      repeat: Infinity,
      delay: i * 0.3,
      ease: 'easeOut',
    },
  }),
};

// ─── Card Reveal ───
export const cardReveal: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.97,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};
