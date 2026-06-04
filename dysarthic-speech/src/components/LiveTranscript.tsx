// ═══════════════════════════════════════════════════
// Live Transcript — Word-by-Word Typewriter Effect
// ═══════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Type } from 'lucide-react';
import { typewriterWord } from '../animations/variants';
import type { WordWithConfidence } from '../hooks/useAppState';

interface LiveTranscriptProps {
  words: WordWithConfidence[];
  visibleCount: number;
  isGenerating: boolean;
}

export default function LiveTranscript({ words, visibleCount, isGenerating }: LiveTranscriptProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll as words appear
  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollLeft = containerRef.current.scrollWidth;
    }
  }, [visibleCount]);

  if (words.length === 0) return null;

  const visibleWords = words.slice(0, visibleCount);
  const activeWord = visibleCount > 0 ? words[visibleCount - 1] : null;

  return (
    <motion.div
      className="glass-card p-5 glow-cyan"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center gap-2 mb-4">
        <Type className="w-4 h-4 text-[var(--color-accent-cyan)]" />
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Live Transcription</span>
        {isGenerating && (
          <motion.span
            className="text-[10px] font-mono px-2 py-0.5 rounded-full ml-auto"
            style={{
              background: 'rgba(0,212,255,0.1)',
              color: 'var(--color-accent-cyan)',
              border: '1px solid rgba(0,212,255,0.2)',
            }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          >
            GENERATING
          </motion.span>
        )}
      </div>

      {/* Words Display */}
      <div
        ref={containerRef}
        className="min-h-[60px] flex flex-wrap items-baseline gap-x-2 gap-y-3 py-2"
      >
        <AnimatePresence>
          {visibleWords.map((item, index) => {
            const isActive = item === activeWord && isGenerating;

            return (
              <motion.span
                key={`${item.word}-${index}`}
                variants={typewriterWord}
                initial="hidden"
                animate="visible"
                className="inline-block"
              >
                <span
                  className={`font-medium transition-all duration-300 ${
                    isActive
                      ? 'text-xl text-[var(--color-accent-cyan)] text-glow-cyan'
                      : 'text-lg text-[var(--color-text-primary)]'
                  }`}
                  style={
                    isActive
                      ? { textShadow: '0 0 15px rgba(0,212,255,0.5)' }
                      : { opacity: 0.85 }
                  }
                >
                  {item.word}
                </span>

                {/* Confidence indicator */}
                <span className="block mt-1">
                  <span className="confidence-bar w-full block" style={{ width: '100%' }}>
                    <motion.span
                      className="confidence-bar-fill block"
                      initial={{ width: 0 }}
                      animate={{ width: `${item.confidence * 100}%` }}
                      transition={{ duration: 0.6, delay: 0.2 }}
                    />
                  </span>
                  <span className="text-[9px] font-mono text-[var(--color-text-tertiary)] mt-0.5 block text-center">
                    {Math.round(item.confidence * 100)}%
                  </span>
                </span>
              </motion.span>
            );
          })}
        </AnimatePresence>

        {/* Blinking cursor */}
        {isGenerating && (
          <motion.span
            className="inline-block w-0.5 h-6 bg-[var(--color-accent-cyan)] animate-blink self-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          />
        )}
      </div>
    </motion.div>
  );
}
