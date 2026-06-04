// ═══════════════════════════════════════════════════
// Audio Waveform Component — wavesurfer.js
// ═══════════════════════════════════════════════════

import { useRef } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Volume2 } from 'lucide-react';
import { useWaveSurfer } from '../hooks/useWaveSurfer';
import { fadeInUp } from '../animations/variants';
import { formatDuration } from '../utils/fileUtils';

interface AudioWaveformProps {
  audioUrl: string;
}

export default function AudioWaveform({ audioUrl }: AudioWaveformProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { isReady, isPlaying, currentTime, duration, togglePlayPause } = useWaveSurfer({
    container: containerRef,
    audioUrl,
  });

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="glass-card p-5">
      {/* Header */}
      <div className="flex items-center gap-2 mb-4">
        <Volume2 className="w-4 h-4 text-[var(--color-accent-cyan)]" />
        <span className="text-sm font-medium text-[var(--color-text-secondary)]">Audio Waveform</span>

        {/* Pulsing dot when playing */}
        {isPlaying && (
          <motion.div
            className="w-2 h-2 rounded-full bg-[var(--color-accent-cyan)] ml-1"
            animate={{ opacity: [1, 0.3, 1], scale: [1, 0.8, 1] }}
            transition={{ duration: 1, repeat: Infinity }}
          />
        )}
      </div>

      {/* Waveform Container */}
      <div className="waveform-container relative bg-[var(--color-bg-primary)] rounded-xl p-3 mb-4">
        {!isReady && (
          <div className="flex items-center justify-center h-20 text-xs text-[var(--color-text-tertiary)]">
            <motion.span
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              Loading waveform...
            </motion.span>
          </div>
        )}
        <div ref={containerRef} className={isReady ? '' : 'opacity-0 absolute'} />
      </div>

      {/* Controls */}
      <div className="flex items-center gap-3">
        <motion.button
          onClick={togglePlayPause}
          disabled={!isReady}
          className="w-9 h-9 rounded-full flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))',
            border: '1px solid rgba(0,212,255,0.2)',
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 text-[var(--color-accent-cyan)]" />
          ) : (
            <Play className="w-4 h-4 text-[var(--color-accent-cyan)] ml-0.5" />
          )}
        </motion.button>

        <span className="text-xs font-mono text-[var(--color-text-tertiary)] tabular-nums">
          {formatDuration(currentTime)} / {formatDuration(duration)}
        </span>
      </div>
    </motion.div>
  );
}
