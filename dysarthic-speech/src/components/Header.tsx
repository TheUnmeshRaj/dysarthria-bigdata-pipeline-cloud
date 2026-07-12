import { motion } from 'framer-motion';
import { Brain, Activity, Mic, BookOpen } from 'lucide-react';
import { fadeInDown, staggerContainer, fadeIn } from '../animations/variants';

// Floating particles for the header background
function FloatingParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 30 }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: 1 + Math.random() * 3,
            height: 1 + Math.random() * 3,
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            background: i % 3 === 0 ? '#00D4FF' : i % 3 === 1 ? '#7C3AED' : '#3B82F6',
          }}
          animate={{
            y: [0, -30 - Math.random() * 40, 0],
            x: [0, Math.sin(i) * 15, 0],
            opacity: [0.1, 0.6, 0.1],
            scale: [0.5, 1, 0.5],
          }}
          transition={{
            duration: 4 + Math.random() * 4,
            repeat: Infinity,
            delay: Math.random() * 3,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

// Animated neural mesh lines in the background
function NeuralMesh() {
  const lines = Array.from({ length: 8 }).map((_, i) => {
    const x1 = Math.random() * 100;
    const y1 = Math.random() * 100;
    const x2 = Math.random() * 100;
    const y2 = Math.random() * 100;
    return { x1, y1, x2, y2, id: i };
  });

  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.06 }}>
      {lines.map((line) => (
        <motion.line
          key={line.id}
          x1={`${line.x1}%`}
          y1={`${line.y1}%`}
          x2={`${line.x2}%`}
          y2={`${line.y2}%`}
          stroke="url(#headerGradient)"
          strokeWidth="1"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={{ duration: 2, delay: line.id * 0.2, ease: 'easeOut' }}
        />
      ))}
      <defs>
        <linearGradient id="headerGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#00D4FF" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
    </svg>
  );
}

interface HeaderProps {
  activePage: 'transcribe' | 'knowledge-base' | 'pipeline-dashboard';
  setActivePage: (page: 'transcribe' | 'knowledge-base' | 'pipeline-dashboard') => void;
}

export default function Header({ activePage, setActivePage }: HeaderProps) {
  return (
    <motion.header
      className="relative pt-14 pb-0 text-center overflow-hidden"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <NeuralMesh />
      <FloatingParticles />

      {/* Gradient line at top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent-cyan)] to-transparent opacity-40" />

      <motion.div variants={fadeInDown} className="relative z-10 px-6 pb-10">
        <div className="flex items-center justify-center gap-3 mb-5">
          <motion.div
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 1],
            }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <Brain className="w-9 h-9 text-[var(--color-accent-cyan)]" />
          </motion.div>
          <motion.div
            animate={{
              scaleY: [1, 1.3, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Activity className="w-7 h-7 text-[var(--color-accent-purple)]" />
          </motion.div>
        </div>

        <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold tracking-tight mb-4 leading-tight">
          <span className="gradient-text">Automated Speech Recognition for Dysarthria</span>
        </h1>
        <motion.p
          variants={fadeIn}
          className="text-base md:text-lg text-[var(--color-text-primary)] font-medium max-w-2xl mx-auto"
        >
          An AI-powered speech recognition system specifically adapted for dysarthric speech using Whisper, LoRA fine-tuning, cloud deployment, and accessibility-focused machine learning.
        </motion.p>
      </motion.div>

      {/* Navigation Tabs */}
      <div className="relative z-10 flex justify-center gap-2 pb-0 px-6">
        <button
          onClick={() => setActivePage('transcribe')}
          className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activePage === 'transcribe'
              ? 'border-cyan-400 text-cyan-400 bg-cyan-950/20 rounded-t-lg'
              : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-slate-800/20 rounded-t-lg'
          }`}
        >
          <Mic className="w-4 h-4" />
          Transcribe
        </button>
        <button
          onClick={() => setActivePage('knowledge-base')}
          className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activePage === 'knowledge-base'
              ? 'border-purple-400 text-purple-400 bg-purple-950/20 rounded-t-lg'
              : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-slate-800/20 rounded-t-lg'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Knowledge Base
        </button>
        <button
          onClick={() => setActivePage('pipeline-dashboard')}
          className={`px-5 py-3 text-sm font-semibold tracking-wide border-b-2 transition-all flex items-center gap-2 cursor-pointer ${
            activePage === 'pipeline-dashboard'
              ? 'border-blue-400 text-blue-400 bg-blue-950/20 rounded-t-lg'
              : 'border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:bg-slate-800/20 rounded-t-lg'
          }`}
        >
          <Activity className="w-4 h-4" />
          Pipeline Analytics
        </button>
      </div>

      {/* Gradient line at bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[var(--color-accent-purple)] to-transparent opacity-20" />
    </motion.header>
  );
}
