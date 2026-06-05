import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Sparkles, Brain, Activity, Volume2, ShieldAlert, Award } from 'lucide-react';
import { fadeInUp, staggerContainer } from '../animations/variants';

interface SampleItem {
  id: string;
  name: string;
  filename: string;
  description: string;
}

const SAMPLE_LIST: SampleItem[] = [
  {
    id: 'sample1',
    name: 'Dysarthric Speech Sample A',
    filename: '294.wav',
    description: 'Slurred syllables with reduced articulation force.',
  },
  {
    id: 'sample2',
    name: 'Dysarthric Speech Sample B',
    filename: '296.wav',
    description: 'Atypical rhythm and prolonged word boundaries.',
  },
  {
    id: 'sample3',
    name: 'Dysarthric Speech Sample C',
    filename: '102.wav',
    description: 'Monotone speech with short bursts of loudness.',
  },

];

interface EducationalSectionProps {
  onLoadSample: (filename: string) => void;
  isProcessing: boolean;
}

export default function EducationalSection({ onLoadSample, isProcessing }: EducationalSectionProps) {
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handlePlayToggle = (filename: string) => {
    if (playingId === filename) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(`/samples/${filename}`);
      audioRef.current.play().catch((err) => console.error('Audio play failed:', err));
      setPlayingId(filename);
      audioRef.current.onended = () => {
        setPlayingId(null);
      };
    }
  };

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-7xl mx-auto px-4 py-8 space-y-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT PANEL — Try Interactive Samples */}
        <motion.div variants={fadeInUp} className="lg:col-span-5 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
              <Volume2 className="w-5 h-5 text-[var(--color-accent-cyan)]" />
              Try Interactive Samples
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Listen to typical examples of dysarthric speech and run them through our AI model to see how the system transcribes and corrects them.
            </p>
          </div>

          <div className="space-y-4">
            {SAMPLE_LIST.map((sample) => (
              <div
                key={sample.id}
                className="glass-card p-4 flex items-center gap-4 hover:border-[rgba(0,212,255,0.2)] transition-all duration-300"
              >
                {/* Play button */}
                <motion.button
                  onClick={() => handlePlayToggle(sample.filename)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center cursor-pointer transition-colors ${playingId === sample.filename
                    ? 'bg-[var(--color-accent-cyan)] text-[var(--color-bg-primary)]'
                    : 'bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-accent-cyan)] text-[var(--color-text-primary)] hover:text-[var(--color-bg-primary)]'
                    }`}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {playingId === sample.filename ? (
                    <Pause className="w-4 h-4 fill-current" />
                  ) : (
                    <Play className="w-4 h-4 fill-current translate-x-0.5" />
                  )}
                </motion.button>

                {/* Information */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-[var(--color-text-primary)]">{sample.name}</p>
                  <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{sample.description}</p>
                </div>

                {/* Action button */}
                <motion.button
                  onClick={() => {
                    if (audioRef.current) {
                      audioRef.current.pause();
                      setPlayingId(null);
                    }
                    onLoadSample(sample.filename);
                  }}
                  disabled={isProcessing}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer border transition-all duration-200 bg-[var(--color-bg-tertiary)] hover:bg-purple-950/40 border-purple-500/20 hover:border-purple-500/40 text-purple-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Transcribe
                </motion.button>
              </div>
            ))}
          </div>
        </motion.div>

        {/* RIGHT PANEL — Concept Guides */}
        <motion.div variants={fadeInUp} className="lg:col-span-7 space-y-6">
          <div className="space-y-2">
            <h2 className="text-xl md:text-2xl font-bold tracking-tight text-[var(--color-text-primary)] flex items-center gap-2">
              <Brain className="w-5 h-5 text-[var(--color-accent-purple)]" />
              Understanding Assistive Speech AI
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              How this assistive transcription pipeline differs from standard applications.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Card 1: Dysarthria */}
            <div className="glass-card p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
                <Activity className="w-4 h-4 text-[var(--color-accent-cyan)]" />
              </div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">What is Dysarthria?</h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                A neurological motor speech disorder caused by conditions like stroke, cerebral palsy, or Parkinson's. It restricts speech muscle control, causing slurred or strained articulation.
              </p>
            </div>

            {/* Card 2: STT, Not TTS */}
            <div className="glass-card p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                <Volume2 className="w-4 h-4 text-[var(--color-accent-purple)]" />
              </div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">Speech-to-Text (STT)</h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Unlike <strong className="font-semibold text-[var(--color-text-primary)]">Text-to-Speech (TTS)</strong> which reads text aloud synthetically, this system transcribes slurred and complex speech recordings back into clear, readable text.
              </p>
            </div>

            {/* Card 3: The Challenge */}
            <div className="glass-card p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <ShieldAlert className="w-4 h-4 text-[var(--color-warning)]" />
              </div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">The Recognition Hurdle</h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Standard assistants (Siri, Alexa) fail (&gt;50% error rate) on atypical voices. Our model is trained on dysarthric data to parse distinct acoustic patterns.
              </p>
            </div>

            {/* Card 4: Semantic Post-Correction */}
            <div className="glass-card p-5 space-y-3">
              <div className="w-9 h-9 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center justify-center">
                <Award className="w-4 h-4 text-[var(--color-success)]" />
              </div>
              <h3 className="text-sm font-bold text-[var(--color-text-primary)]">AI Semantic Restoration</h3>
              <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                Acoustic transcriptions can have phonetic typos. We query <strong className="font-semibold text-[var(--color-text-primary)]">DeepSeek V4-Flash</strong> as a post-processor to restore syntactic order while preserving intent.
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Decorative accent divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-[var(--color-border-glow)] to-transparent opacity-20" />
    </motion.div>
  );
}
