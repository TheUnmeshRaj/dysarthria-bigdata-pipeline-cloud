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
  Sparkles,
  RotateCcw,
  AlertCircle,
} from 'lucide-react';
import { cardReveal } from '../animations/variants';
import type { WordWithConfidence } from '../hooks/useAppState';

interface TranscriptOutputProps {
  transcript: string;
  words: WordWithConfidence[];
  processingTime: number | null; // ms
  correctedTranscript: string;
  isCorrecting: boolean;
  correctionError: string | null;
  onRetryCorrection: () => void;
}

export default function TranscriptOutput({
  transcript,
  words,
  processingTime,
  correctedTranscript,
  isCorrecting,
  correctionError,
  onRetryCorrection,
}: TranscriptOutputProps) {
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'raw' | 'corrected'>('corrected');

  if (!transcript) return null;

  const avgConfidence = words.length > 0
    ? words.reduce((sum, w) => sum + w.confidence, 0) / words.length
    : 0;

  const currentText = activeTab === 'raw' ? transcript : correctedTranscript;

  const handleCopy = async () => {
    if (!currentText) return;
    await navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentText) return;
    const blob = new Blob([currentText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = activeTab === 'raw' ? 'raw_transcript.txt' : 'corrected_transcript.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <motion.div
      variants={cardReveal}
      initial="hidden"
      animate="visible"
      className={`glass-card overflow-hidden transition-all duration-300 ${
        activeTab === 'corrected' ? 'glow-purple' : 'glow-cyan'
      }`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-5 pb-3 gap-3 border-b border-[var(--color-border-default)]">
        {/* Tabs */}
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('corrected')}
            className={`py-2 px-3 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'corrected'
                ? 'bg-purple-950/45 border-purple-500/35 text-[var(--color-text-primary)] shadow-[0_0_15px_rgba(124,58,237,0.15)]'
                : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-slate-800/20'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-[var(--color-accent-purple)]" />
            AI Corrected
          </button>
          <button
            onClick={() => setActiveTab('raw')}
            className={`py-2 px-3 text-xs font-semibold uppercase tracking-wider rounded-lg border transition-all duration-200 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'raw'
                ? 'bg-cyan-950/45 border-cyan-500/35 text-[var(--color-text-primary)] shadow-[0_0_15px_rgba(0,212,255,0.15)]'
                : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-slate-800/20'
            }`}
          >
            <FileText className="w-3.5 h-3.5 text-[var(--color-accent-cyan)]" />
            Raw Transcript
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {activeTab === 'corrected' && correctedTranscript && (
            <span className="hidden sm:inline-block text-[10px] font-mono bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2 py-0.5 rounded">
              deepseek-v4-flash
            </span>
          )}
          <motion.button
            onClick={handleCopy}
            disabled={activeTab === 'corrected' && !correctedTranscript}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-tertiary)]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Copy to clipboard"
          >
            {copied ? (
              <Check className="w-4 h-4 text-[var(--color-success)]" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </motion.button>
          <motion.button
            onClick={handleDownload}
            disabled={activeTab === 'corrected' && !correctedTranscript}
            className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-text-tertiary)]"
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            title="Download as TXT"
          >
            <Download className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6">
        {activeTab === 'raw' ? (
          /* RAW TRANSCRIPT TAB CONTENT */
          <div className="space-y-6">
            <motion.p
              className="text-lg md:text-xl font-medium text-[var(--color-text-primary)] leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              "{transcript}"
            </motion.p>

            {/* Metadata Bar */}
            <div
              className="flex flex-wrap gap-4 p-3 rounded-xl text-xs"
              style={{
                background: 'rgba(0,0,0,0.2)',
                border: '1px solid var(--color-border-default)',
              }}
            >
              <span className="flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
                <Hash className="w-3 h-3 text-[var(--color-accent-cyan)]" />
                {words.length} words
              </span>
              {processingTime && (
                <span className="flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
                  <Clock className="w-3 h-3 text-[var(--color-accent-cyan)]" />
                  {(processingTime / 1000).toFixed(1)}s processing
                </span>
              )}
              <span className="flex items-center gap-1.5 text-[var(--color-text-tertiary)]">
                <BarChart2 className="w-3 h-3 text-[var(--color-accent-cyan)]" />
                {Math.round(avgConfidence * 100)}% avg confidence
              </span>
            </div>

            {/* Confidence Visualization */}
            <div>
              <p className="text-xs text-[var(--color-text-tertiary)] mb-3 font-mono tracking-wider">
                WORD CONFIDENCE METRICS
              </p>
              <div className="flex flex-wrap gap-3">
                {words.map((w, i) => (
                  <motion.div
                    key={`conf-${i}`}
                    className="flex flex-col items-center gap-1.5"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.04, duration: 0.3 }}
                  >
                    <div
                      className="h-9 w-2 rounded-full overflow-hidden"
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
                        transition={{ delay: i * 0.04 + 0.2, duration: 0.4 }}
                      />
                    </div>
                    <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] max-w-[50px] truncate">
                      {w.word}
                    </span>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* AI CORRECTED TAB CONTENT */
          <div>
            {isCorrecting ? (
              /* Loading State */
              <div className="flex flex-col items-center justify-center py-6 text-center space-y-4">
                <div className="relative flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full border-2 border-purple-500/20 border-t-purple-500 animate-spin" />
                  <Sparkles className="w-5 h-5 text-purple-400 absolute animate-pulse" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Analyzing speech semantic features...
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    DeepSeek V4-Flash is correcting grammatical and spelling disfluencies.
                  </p>
                </div>
              </div>
            ) : correctionError ? (
              /* Error State */
              <div className="flex flex-col items-center justify-center py-4 text-center space-y-4">
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-full">
                  <AlertCircle className="w-6 h-6 text-[var(--color-error)]" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Grammar correction failed
                  </p>
                  <p className="text-xs text-[var(--color-error)] max-w-md">
                    {correctionError}
                  </p>
                </div>
                <motion.button
                  onClick={onRetryCorrection}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold cursor-pointer border transition-all duration-200"
                  style={{
                    background: 'rgba(124,58,237,0.1)',
                    borderColor: 'rgba(124,58,237,0.3)',
                    color: '#C084FC',
                  }}
                  whileHover={{ scale: 1.03, background: 'rgba(124,58,237,0.15)' }}
                  whileTap={{ scale: 0.97 }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Retry Correction
                </motion.button>
              </div>
            ) : (
              /* Success State */
              <div className="space-y-5">
                <motion.p
                  className="text-lg md:text-xl font-medium leading-relaxed"
                  style={{ color: '#E9D5FF' }}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  "{correctedTranscript || transcript}"
                </motion.p>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[var(--color-border-default)]">
                  <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    Corrected grammatical disfluencies while preserving semantic intent
                  </span>
                  {correctedTranscript && correctedTranscript !== transcript && (
                    <span className="text-[10px] px-2 py-0.5 bg-green-500/10 text-green-400 border border-green-500/20 rounded self-start sm:self-auto">
                      Meaning Preserved
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom gradient indicator */}
      <div
        className={`h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-30 transition-all duration-500 ${
          activeTab === 'corrected'
            ? 'text-[var(--color-accent-purple)]'
            : 'text-[var(--color-accent-cyan)]'
        }`}
      />
    </motion.div>
  );
}
