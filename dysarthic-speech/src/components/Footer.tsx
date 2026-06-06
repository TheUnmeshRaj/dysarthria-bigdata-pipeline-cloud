// ═══════════════════════════════════════════════════
// Footer Component
// ═══════════════════════════════════════════════════

import { motion } from 'framer-motion';
import { fadeIn } from '../animations/variants';

interface FooterProps {
  visitCount?: number | null;
}

function numberToBraille(num: number): string {
  const brailleMap: Record<string, string> = {
    '0': '⠚',
    '1': '⠁',
    '2': '⠃',
    '3': '⠉',
    '4': '⠙',
    '5': '⠑',
    '6': '⠋',
    '7': '⠛',
    '8': '⠓',
    '9': '⠊',
  };
  const numStr = num.toString();
  let braille = '⠼'; // Number sign prefix
  for (const char of numStr) {
    braille += brailleMap[char] || '';
  }
  return braille;
}

export default function Footer({ visitCount }: FooterProps) {
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
        {visitCount !== undefined && visitCount !== null && (
          <>
            &nbsp;·&nbsp; {numberToBraille(visitCount)}
          </>
        )}
        DYSARTHRIC SPEECH RECOGNITION SYSTEM &nbsp;·&nbsp; AI-POWERED ASSISTIVE TECHNOLOGY
        {visitCount !== undefined && visitCount !== null && (
          <>
            &nbsp;·&nbsp; {numberToBraille(visitCount)}
          </>
        )}
      </p>
    </motion.footer>
  );
}
