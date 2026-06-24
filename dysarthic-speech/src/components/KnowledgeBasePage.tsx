// ═══════════════════════════════════════════════════
// KnowledgeBasePage — Manage per-user KB
// ═══════════════════════════════════════════════════

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User,
  Plus,
  Trash2,
  Sparkles,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Loader2,
  Database,
  Tag,
  ArrowRight,
  Info,
  Upload,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  buildKnowledgeBase,
  getKBStatus,
  setActiveUsername,
  getActiveUsername,
  type TranscriptPair,
  type KBStatusResponse,
} from '../services/kbApi';
import { fadeInUp, staggerContainer } from '../animations/variants';

// ── Pair row ────────────────────────────────────────

interface PairRowProps {
  index: number;
  pair: TranscriptPair;
  onChange: (index: number, field: keyof TranscriptPair, value: string) => void;
  onRemove: (index: number) => void;
  canRemove: boolean;
}

function PairRow({ index, pair, onChange, onRemove, canRemove }: PairRowProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      transition={{ duration: 0.2 }}
      className="grid grid-cols-1 md:grid-cols-2 gap-3 p-4 rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] hover:border-cyan-500/30 transition-colors group"
    >
      {/* Row label */}
      <div className="md:col-span-2 flex items-center justify-between">
        <span className="text-[10px] font-mono text-[var(--color-text-tertiary)] tracking-widest">
          PAIR {index + 1}
        </span>
        {canRemove && (
          <motion.button
            onClick={() => onRemove(index)}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-red-400/60 hover:text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            title="Remove pair"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </motion.button>
        )}
      </div>

      {/* Model output */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold text-[var(--color-accent-cyan)] tracking-wider">
          MODEL OUTPUT (what STT said)
        </label>
        <textarea
          value={pair.model_output}
          onChange={(e) => onChange(index, 'model_output', e.target.value)}
          placeholder="e.g. cube netties is amazing"
          rows={2}
          className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 resize-none transition-all font-mono"
        />
      </div>

      {/* Correct transcription */}
      <div className="space-y-1.5">
        <label className="text-[10px] font-semibold text-purple-400 tracking-wider">
          CORRECT TRANSCRIPTION (ground truth)
        </label>
        <textarea
          value={pair.correct_transcription}
          onChange={(e) => onChange(index, 'correct_transcription', e.target.value)}
          placeholder="e.g. Kubernetes is amazing"
          rows={2}
          className="w-full bg-[var(--color-bg-primary)] border border-[var(--color-border-default)] rounded-lg px-3 py-2 text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 resize-none transition-all font-mono"
        />
      </div>
    </motion.div>
  );
}

// ── KB Status card ────────────────────────────────────────

function KBStatusCard({ status, username }: { status: KBStatusResponse; username: string }) {
  if (!status.exists) {
    return (
      <div className="glass-card p-5 flex items-center gap-4 border border-yellow-500/20 bg-yellow-950/10">
        <div className="p-2.5 rounded-xl bg-yellow-500/10 text-yellow-400">
          <Database className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">No KB Found</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
            No knowledge base exists for <span className="text-yellow-400 font-mono">@{username}</span>. Add pairs and click Build.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="glass-card p-5 border border-green-500/20 bg-green-950/10"
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-xl bg-green-500/10 text-green-400">
          <CheckCircle className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-[var(--color-text-primary)]">
            KB Active for <span className="text-green-400 font-mono">@{username}</span>
          </p>
          <p className="text-xs text-[var(--color-text-tertiary)]">
            {status.domain && `Domain: ${status.domain}`}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg p-3 bg-[var(--color-bg-secondary)] text-center">
          <p className="text-xl font-bold text-[var(--color-accent-cyan)]">{status.corrections_count}</p>
          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">Correction Rules</p>
        </div>
        <div className="rounded-lg p-3 bg-[var(--color-bg-secondary)] text-center">
          <p className="text-xl font-bold text-purple-400">{status.vocabulary_count}</p>
          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">Vocabulary Terms</p>
        </div>
        <div className="rounded-lg p-3 bg-[var(--color-bg-secondary)] text-center">
          <p className="text-xl font-bold text-[var(--color-accent-cyan)]">{status.topics.length}</p>
          <p className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5">Topics</p>
        </div>
      </div>

      {status.topics.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {status.topics.map((t) => (
            <span
              key={t}
              className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20"
            >
              <Tag className="w-2.5 h-2.5" />
              {t}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}

// ── Main page ────────────────────────────────────────

const EMPTY_PAIR: TranscriptPair = { model_output: '', correct_transcription: '' };

export default function KnowledgeBasePage() {
  const [username, setUsername] = useState(getActiveUsername() || '');
  const [pairs, setPairs] = useState<TranscriptPair[]>([{ ...EMPTY_PAIR }, { ...EMPTY_PAIR }]);
  const [building, setBuilding] = useState(false);
  const [buildResult, setBuildResult] = useState<{ success: boolean; message: string } | null>(null);
  const [kbStatus, setKbStatus] = useState<KBStatusResponse | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [isPairsExpanded, setIsPairsExpanded] = useState(true);

  // Load KB status when username is confirmed
  const fetchStatus = useCallback(async (name: string) => {
    if (!name.trim()) return;
    setStatusLoading(true);
    try {
      const status = await getKBStatus(name.trim());
      setKbStatus(status);
    } catch {
      setKbStatus(null);
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    const saved = getActiveUsername();
    if (saved) fetchStatus(saved);
  }, [fetchStatus]);

  // Pair management
  const handlePairChange = (index: number, field: keyof TranscriptPair, value: string) => {
    setPairs((prev) => prev.map((p, i) => (i === index ? { ...p, [field]: value } : p)));
  };

  const addPair = () => setPairs((prev) => [...prev, { ...EMPTY_PAIR }]);

  const removePair = (index: number) =>
    setPairs((prev) => prev.filter((_, i) => i !== index));

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const regex = /\(\s*"((?:\\"|[^"])*)"\s*,\s*"((?:\\"|[^"])*)"\s*\)/g;
      const newPairs: TranscriptPair[] = [];
      let match;

      while ((match = regex.exec(text)) !== null) {
        newPairs.push({
          model_output: match[1].replace(/\\"/g, '"'),
          correct_transcription: match[2].replace(/\\"/g, '"'),
        });
      }

      if (newPairs.length > 0) {
        setPairs((prev) => {
          const existing = prev.filter((p) => p.model_output.trim() || p.correct_transcription.trim());
          return [...existing, ...newPairs];
        });
        setBuildResult({ success: true, message: `Successfully loaded ${newPairs.length} pairs from file.` });
      } else {
        setBuildResult({ success: false, message: 'Could not find any valid pairs in the selected file. Ensure it uses the [("stt", "correct")] format.' });
      }
      
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Build KB
  const handleBuild = async () => {
    const trimmed = username.trim();
    if (!trimmed) {
      setBuildResult({ success: false, message: 'Please enter a username first.' });
      return;
    }

    const validPairs = pairs.filter(
      (p) => p.model_output.trim() && p.correct_transcription.trim()
    );

    if (validPairs.length === 0) {
      setBuildResult({ success: false, message: 'Please add at least one complete transcript pair.' });
      return;
    }

    setBuilding(true);
    setBuildResult(null);

    try {
      // Save username to localStorage immediately
      setActiveUsername(trimmed);
      const result = await buildKnowledgeBase(trimmed, validPairs);
      setBuildResult({ success: true, message: result.message });
      await fetchStatus(trimmed);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Build failed';
      setBuildResult({ success: false, message: msg });
    } finally {
      setBuilding(false);
    }
  };

  // Confirm username (without building)
  const handleSetUsername = () => {
    const trimmed = username.trim();
    if (!trimmed) return;
    setActiveUsername(trimmed);
    fetchStatus(trimmed);
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 py-8"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      {/* Page Header */}
      <motion.div variants={fadeInUp} className="mb-8 text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-purple-500/20 border border-cyan-500/20">
            <BookOpen className="w-7 h-7 text-[var(--color-accent-cyan)]" />
          </div>
        </div>
        <h2 className="text-2xl font-bold gradient-text mb-2">Knowledge Base Manager</h2>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-xl mx-auto">
          Build a personalized correction knowledge base for each speaker. The KB learns STT
          error patterns and vocabulary from transcript pairs, enabling more accurate corrections.
        </p>
      </motion.div>

      {/* Info banner */}
      <motion.div
        variants={fadeInUp}
        className="mb-6 flex items-start gap-3 p-4 rounded-xl border border-cyan-500/15 bg-cyan-950/10"
      >
        <Info className="w-4 h-4 text-[var(--color-accent-cyan)] mt-0.5 flex-shrink-0" />
        <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
          The active username is stored in your browser and automatically applied when you transcribe audio on the main page.
          The FastAPI server must be running (<span className="font-mono text-cyan-400">localhost:8000</span>) for KB
          correction to work. Without it, grammar-only correction via HuggingFace is used as fallback.
        </p>
      </motion.div>

      {/* Username Section */}
      <motion.div variants={fadeInUp} className="glass-card p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <User className="w-4 h-4 text-[var(--color-accent-cyan)]" />
          <h3 className="text-sm font-semibold text-[var(--color-text-primary)] tracking-wide">
            SPEAKER USERNAME
          </h3>
        </div>

        <div className="flex gap-3">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)] text-sm font-mono">
              @
            </span>
            <input
              id="kb-username-input"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSetUsername()}
              placeholder="e.g. john_doe"
              className="w-full pl-8 pr-4 py-2.5 bg-[var(--color-bg-secondary)] border border-[var(--color-border-default)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/20 transition-all font-mono"
            />
          </div>
          <motion.button
            onClick={handleSetUsername}
            disabled={!username.trim()}
            className="px-4 py-2.5 rounded-xl text-sm font-semibold border transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            style={{
              background: 'rgba(0,212,255,0.08)',
              borderColor: 'rgba(0,212,255,0.25)',
              color: 'var(--color-accent-cyan)',
            }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <ArrowRight className="w-4 h-4" />
            Set Active
          </motion.button>
        </div>

        {/* Status display */}
        <div className="mt-4">
          {statusLoading ? (
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-tertiary)]">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Checking KB status...
            </div>
          ) : kbStatus ? (
            <KBStatusCard status={kbStatus} username={username} />
          ) : null}
        </div>
      </motion.div>

      {/* Transcript Pairs Section */}
      <motion.div variants={fadeInUp} className="glass-card p-6 mb-6">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-semibold text-[var(--color-text-primary)] tracking-wide">
              TRANSCRIPT PAIRS
            </h3>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {pairs.filter((p) => p.model_output.trim() && p.correct_transcription.trim()).length} valid
            </span>
            <button
              onClick={() => setIsPairsExpanded(!isPairsExpanded)}
              className="ml-2 p-1 rounded-md hover:bg-white/5 text-[var(--color-text-secondary)] transition-colors"
            >
              {isPairsExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".txt"
              id="kb-file-upload"
              className="hidden"
              onChange={handleFileUpload}
            />
            <label
              htmlFor="kb-file-upload"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer hover:scale-[1.04] active:scale-[0.96]"
              style={{
                background: 'rgba(0,212,255,0.08)',
                borderColor: 'rgba(0,212,255,0.25)',
                color: 'var(--color-accent-cyan)',
              }}
            >
              <Upload className="w-3.5 h-3.5" />
              Load File
            </label>
            <motion.button
            id="add-pair-btn"
            onClick={addPair}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer"
            style={{
              background: 'rgba(124,58,237,0.08)',
              borderColor: 'rgba(124,58,237,0.25)',
              color: '#C084FC',
            }}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
          >
            <Plus className="w-3.5 h-3.5" />
            Add Pair
          </motion.button>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {isPairsExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {pairs.map((pair, index) => (
                    <PairRow
                      key={index}
                      index={index}
                      pair={pair}
                      onChange={handlePairChange}
                      onRemove={removePair}
                      canRemove={pairs.length > 1}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <p className="mt-4 text-[11px] text-[var(--color-text-tertiary)]">
          💡 Tip: Add 10–100 pairs for best results. The LLM will identify recurring error patterns from the data.
        </p>
      </motion.div>

      {/* Build Button & Result */}
      <motion.div variants={fadeInUp} className="space-y-4">
        <motion.button
          id="build-kb-btn"
          onClick={handleBuild}
          disabled={building}
          className="w-full py-4 rounded-2xl text-sm font-bold tracking-wide border transition-all cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-3 relative overflow-hidden"
          style={{
            background: building
              ? 'rgba(124,58,237,0.1)'
              : 'linear-gradient(135deg, rgba(0,212,255,0.15), rgba(124,58,237,0.15))',
            borderColor: building ? 'rgba(124,58,237,0.3)' : 'rgba(0,212,255,0.4)',
            color: building ? '#C084FC' : 'var(--color-text-primary)',
            boxShadow: building ? 'none' : '0 0 30px rgba(0,212,255,0.1)',
          }}
          whileHover={!building ? { scale: 1.01, boxShadow: '0 0 40px rgba(0,212,255,0.2)' } : {}}
          whileTap={!building ? { scale: 0.99 } : {}}
        >
          {building ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Building Knowledge Base...
            </>
          ) : (
            <>
              <Database className="w-5 h-5 text-[var(--color-accent-cyan)]" />
              Build Knowledge Base for @{username || 'username'}
              <Sparkles className="w-4 h-4 text-purple-400" />
            </>
          )}
        </motion.button>

        {/* Build result */}
        <AnimatePresence>
          {buildResult && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className={`flex items-start gap-3 p-4 rounded-xl border ${
                buildResult.success
                  ? 'border-green-500/25 bg-green-950/15'
                  : 'border-red-500/25 bg-red-950/15'
              }`}
            >
              {buildResult.success ? (
                <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              )}
              <p className={`text-sm ${buildResult.success ? 'text-green-300' : 'text-red-300'}`}>
                {buildResult.message}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* How it works section */}
      <motion.div variants={fadeInUp} className="mt-10 glass-card p-6">
        <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] tracking-widest mb-4">
          HOW IT WORKS
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              step: '01',
              title: 'Add Pairs',
              desc: 'Provide pairs of what the STT model said vs. what was actually said.',
              color: 'text-[var(--color-accent-cyan)]',
              border: 'border-cyan-500/20',
              bg: 'bg-cyan-950/10',
            },
            {
              step: '02',
              title: 'Build KB',
              desc: 'The LLM analyzes the pairs, extracts correction rules and domain vocabulary.',
              color: 'text-purple-400',
              border: 'border-purple-500/20',
              bg: 'bg-purple-950/10',
            },
            {
              step: '03',
              title: 'Auto-Apply',
              desc: 'When you transcribe audio, corrections are automatically applied using your KB.',
              color: 'text-green-400',
              border: 'border-green-500/20',
              bg: 'bg-green-950/10',
            },
          ].map(({ step, title, desc, color, border, bg }) => (
            <div
              key={step}
              className={`rounded-xl p-4 border ${border} ${bg} space-y-2`}
            >
              <span className={`text-2xl font-black font-mono ${color} opacity-40`}>{step}</span>
              <p className={`text-sm font-semibold ${color}`}>{title}</p>
              <p className="text-xs text-[var(--color-text-tertiary)] leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
