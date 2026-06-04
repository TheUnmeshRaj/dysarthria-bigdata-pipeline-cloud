// ═══════════════════════════════════════════════════
// Footer Component
// ═══════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { fadeIn } from '../animations/variants';

export default function Footer() {
  return (
    <motion.footer
      variants={fadeIn}
      initial="hidden"
      animate="visible"
      className="relative py-6 px-6 text-center mt-8"
    >
      {/* Gradient border top */}
      <div className="absolute top-0 left-1/4 right-1/4 h-px bg-gradient-to-r from-transparent via-[var(--color-accent-cyan)] to-transparent opacity-15" />

      <p className="text-xs text-[var(--color-text-tertiary)] font-mono tracking-wide">
        DYSARTHRIC SPEECH RECOGNITION SYSTEM &nbsp;·&nbsp; AI-POWERED ASSISTIVE TECHNOLOGY
      </p>
    </motion.footer>
  );
}
