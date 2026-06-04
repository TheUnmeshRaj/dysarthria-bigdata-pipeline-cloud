// ═══════════════════════════════════════════════════
// Transcript Output — Final Result Card
// ═══════════════════════════════════════════════════

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  FileText,
  Copy,
  Check,
  Download,
  Clock,
  Hash,
  BarChart2,
} from 'lucide-react';
import { cardReveal } from '../animations/variants';
import type { WordWithConfidence } from '../hooks/useAppState';

interface TranscriptOutputProps {
  transcript: string;
  words: WordWithConfidence[];
  processingTime: number | null; // ms
}

export default function TranscriptOutput({ transcript, words, processingTime }: TranscriptOutputProps) {
  const [copied, setCopied] = useState(false);

  if (!transcript) return null;

  const avgConfidence = words.length > 0
    ? words.reduce((sum, w) => sum + w.confidence, 0) / words.length
    : 0;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(transcript);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([transcript], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'transcript.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      variants={cardReveal}
      initial="hidden"
      animate="visible"
      className="glass-card glow-purple overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-0">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--color-success)]" />
          <span className="text-sm font-medium text-[var(--color-text-secondary)]">Final Transcript</span>
          <motion.div
            className="w-2 h-2 rounded-full bg-[var(--color-success)]"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.3 }}
          />
        </div>

        <div className="flex items-center gap-1">
          <motion.button
            onClick={handleCopy}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[var(--color-success)]" />
            ) : (
              <Copy className="w-4 h-4 text-[var(--color-text-tertiary)]" />
            )}
          </motion.button>
          <motion.button
            onClick={handleDownload}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Download as TXT"
          >
            <Download className="w-4 h-4 text-[var(--color-text-tertiary)]" />
          </motion.button>
        </div>
      </div>

      {/* Transcript Text */}
      <div className="p-5">
        <motion.p
          className="text-lg md:text-xl font-medium text-[var(--color-text-primary)] leading-relaxed"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          "{transcript}"
        </motion.p>
      </div>

      {/* Metadata Bar */}
      <div className="px-5 pb-5">
        <div
          className="flex flex-wrap gap-4 p-3 rounded-xl text-xs"
          style={{
            background: 'rgba(0,0,0,0.2)',
            border: '1px solid var(--color-border-default)',
          }}
        >
          <span className="flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
            <Hash className="w-3 h-3" />
            {words.length} words
          </span>
          {processingTime && (
            <span className="flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
              <Clock className="w-3 h-3" />
              {(processingTime / 1000).toFixed(1)}s
            </span>
          )}
          <span className="flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
            <BarChart2 className="w-3 h-3" />
            {Math.round(avgConfidence * 100)}% avg confidence
          </span>
        </div>
      </div>

      {/* Confidence Visualization */}
      <div className="px-5 pb-5">
        <p className="text-xs text-[var(--color-text-tertiary)] mb-2 font-mono">WORD CONFIDENCE</p>
        <div className="flex flex-wrap gap-2">
          {words.map((w, i) => (
            <motion.div
              key={`conf-${i}`}
              className="flex flex-col items-center gap-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 + 0.5, duration: 0.3 }}
            >
              <div
                className="h-8 w-1.5 rounded-full overflow-hidden"
                style={{ background: 'var(--color-bg-primary)' }}
              >
                <motion.div
                  className="w-full rounded-full"
                  style={{
                    background:
                      w.confidence >= 0.95
                        ? 'var(--color-success)'
                        : w.confidence >= 0.85
                        ? 'var(--color-accent-cyan)'
                        : 'var(--color-warning)',
                  }}
                  initial={{ height: 0 }}
                  animate={{ height: `${w.confidence * 100}%` }}
                  transition={{ delay: i * 0.05 + 0.7, duration: 0.4 }}
                />
              </div>
              <span className="text-[8px] font-mono text-[var(--color-text-tertiary)] max-w-[40px] truncate">
                {w.word}
              </span>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Bottom gradient */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-success)] to-transparent opacity-20" />
    </motion.div>
  );
}
