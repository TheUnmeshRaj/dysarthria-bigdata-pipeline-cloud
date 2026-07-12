// ═══════════════════════════════════════════════════
// App — Main Dashboard Layout & Orchestration
// ═══════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RotateCcw, Sparkles } from 'lucide-react';
import Header from './components/Header';
import Footer from './components/Footer';
import UploadZone from './components/UploadZone';
import VideoPreview from './components/VideoPreview';
import AudioWaveform from './components/AudioWaveform';
import PipelineAnimation from './components/PipelineAnimation';
import NeuralVisualizer from './components/NeuralVisualizer';
import LiveTranscript from './components/LiveTranscript';
import TranscriptOutput from './components/TranscriptOutput';
import { useAppState } from './hooks/useAppState';
import { useFFmpeg } from './hooks/useFFmpeg';
import { useTranscription } from './hooks/useTranscription';
import { detectMediaType } from './utils/fileUtils';
import { fadeInUp, staggerContainer, slideInLeft, slideInRight } from './animations/variants';
import { correctTranscript } from './services/aiCorrection';
import EducationalSection from './components/EducationalSection';
import ProjectDetails from './components/ProjectDetails';
import KnowledgeBasePage from './components/KnowledgeBasePage';
import PipelineDashboard from './components/PipelineDashboard';
import { generateConfidenceScores } from './services/mockApi';
import { checkRateLimit } from './utils/rateLimiter';

export default function App() {
  const {
    state,
    setFile,
    setStage,
    setAudioBlob,
    setExtractionProgress,
    startProcessing,
    setProcessingStage,
    setTranscript,
    incrementVisibleWords,
    setError,
    startCorrection,
    setCorrectedTranscript,
    setCorrectionError,
    appendTranscriptChunk,
    setTranscriptionComplete,
    reset,
  } = useAppState();

  const { extractAudio, progress: ffmpegProgress } = useFFmpeg();
  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  const [activePage, setActivePage] = useState<'transcribe' | 'knowledge-base' | 'pipeline-dashboard'>('transcribe');
  const [showToast, setShowToast] = useState(false);
  const [visitCount, setVisitCount] = useState<number | null>(null);
  const reorderBufferRef = useRef<{
    nextAppendIndex: number;
    chunkTranscripts: (string | null)[];
  }>({ nextAppendIndex: 0, chunkTranscripts: [] });

  useEffect(() => {
    const fetchVisitCount = async () => {
      try {
        const hasVisited = sessionStorage.getItem('visited_dysarthria_asr');
        const url = hasVisited
          ? 'https://api.counterapi.dev/v1/dysarthria_speech_recognition/visits/'
          : 'https://api.counterapi.dev/v1/dysarthria_speech_recognition/visits/up';

        const res = await fetch(url);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data.count === 'number') {
            setVisitCount(data.count);
            if (!hasVisited) {
              sessionStorage.setItem('visited_dysarthria_asr', 'true');
            }
          }
        }
      } catch (err) {
        console.error('Failed to fetch visit count:', err);
      }
    };

    fetchVisitCount();
  }, []);

  const handleChunkCompleted = useCallback(
    (text: string, index: number, total: number) => {
      if (total > 1) {
        const buffer = reorderBufferRef.current;
        if (buffer.chunkTranscripts.length === 0) {
          buffer.chunkTranscripts = Array.from({ length: total }).map(() => null);
        }
        buffer.chunkTranscripts[index] = text;

        while (
          buffer.nextAppendIndex < total &&
          buffer.chunkTranscripts[buffer.nextAppendIndex] !== null
        ) {
          const chunkText = buffer.chunkTranscripts[buffer.nextAppendIndex] as string;
          if (chunkText) {
            const words = generateConfidenceScores(chunkText);
            appendTranscriptChunk(chunkText, words);
          }
          buffer.nextAppendIndex++;
        }

        if (buffer.nextAppendIndex === total) {
          setTranscriptionComplete();
          setShowToast(true);
          setTimeout(() => setShowToast(false), 4500);
        }
      }
    },
    [appendTranscriptChunk, setTranscriptionComplete]
  );

  const { transcribe } = useTranscription({
    onStageChange: setProcessingStage,
    onTranscriptReady: setTranscript,
    onChunkCompleted: handleChunkCompleted,
    onError: setError,
  });

  // Update extraction progress from ffmpeg
  useEffect(() => {
    if (state.stage === 'extracting_audio') {
      setExtractionProgress(ffmpegProgress);
    }
  }, [ffmpegProgress, state.stage, setExtractionProgress]);

  const runCorrection = useCallback(async (rawTranscript: string) => {
    if (!rawTranscript) return;
    startCorrection();
    try {
      const corrected = await correctTranscript(rawTranscript);
      setCorrectedTranscript(corrected);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Correction failed';
      setCorrectionError(msg);
    }
  }, [startCorrection, setCorrectedTranscript, setCorrectionError]);

  // Trigger AI grammatical correction when transcript is ready
  useEffect(() => {
    if (state.transcript && !state.correctedTranscript && !state.isCorrecting && !state.correctionError && state.isTranscriptionDone) {
      runCorrection(state.transcript);
    }
  }, [state.transcript, state.correctedTranscript, state.isCorrecting, state.correctionError, state.isTranscriptionDone, runCorrection]);

  const handleRetryCorrection = useCallback(() => {
    if (state.transcript) {
      runCorrection(state.transcript);
    }
  }, [state.transcript, runCorrection]);

  // Transition stage to completed when all words are revealed and transcription is complete
  useEffect(() => {
    if (
      state.stage === 'generating_text' &&
      state.isTranscriptionDone &&
      state.visibleWordCount >= state.words.length &&
      state.words.length > 0
    ) {
      setStage('completed');
    }
  }, [state.stage, state.isTranscriptionDone, state.visibleWordCount, state.words.length, setStage]);

  // Word-by-word reveal timer
  useEffect(() => {
    if (state.stage === 'generating_text' && state.visibleWordCount < state.words.length) {
      wordTimerRef.current = setInterval(() => {
        incrementVisibleWords();
      }, 350); // Reveal a word every 350ms

      return () => {
        if (wordTimerRef.current) clearInterval(wordTimerRef.current);
      };
    }
  }, [state.stage, state.visibleWordCount, state.words.length, incrementVisibleWords]);

  // Handle file selection — kicks off the entire pipeline
  const handleFileSelected = useCallback(
    async (file: File) => {
      const rateLimit = checkRateLimit(3, 60000); // 3 requests per 60 seconds
      if (!rateLimit.allowed) {
        const secondsLeft = Math.ceil(rateLimit.waitTimeRemaining / 1000);
        setError(`Rate limit exceeded. Please wait ${secondsLeft}s before making another request to protect the free tier APIs.`);
        setStage('error');
        return;
      }

      reorderBufferRef.current = { nextAppendIndex: 0, chunkTranscripts: [] };
      setFile(file);

      const mediaType = detectMediaType(file);
      let audioBlob: Blob;
      let audioUrl: string;


      if (mediaType === 'video') {
        // Video → extract audio first
        setStage('extracting_audio');
        const result = await extractAudio(file);
        audioBlob = result.blob;
        audioUrl = result.url;
      } else {
        // Audio — use directly
        audioBlob = file;
        audioUrl = URL.createObjectURL(file);
      }

      setAudioBlob(audioBlob, audioUrl);

      // Small delay for waveform to render before proceeding
      await new Promise((r) => setTimeout(r, 800));

      // Start AI processing
      startProcessing();
      await transcribe(audioBlob, file.name);

    },
    [setFile, setStage, extractAudio, setAudioBlob, startProcessing, transcribe, setError],
  );

  const handleLoadSample = useCallback(
    async (filename: string) => {
      try {
        setStage('uploading');
        const response = await fetch(`/samples/${filename}`);
        if (!response.ok) {
          throw new Error(`Failed to load audio sample "${filename}": ${response.statusText}`);
        }
        const blob = await response.blob();
        const file = new File([blob], filename, { type: 'audio/wav' });
        await handleFileSelected(file);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Failed to load sample';
        setError(msg);
      }
    },
    [handleFileSelected, setStage, setError],
  );

  const mediaType = state.file ? detectMediaType(state.file) : null;
  const showLeftPanel = state.file !== null && state.stage !== 'idle';
  const showRightPanel = state.stage !== 'idle';
  const showTranscript = state.stage === 'generating_text' || state.stage === 'completed';
  const processingTime =
    state.processingStartTime && state.processingEndTime
      ? state.processingEndTime - state.processingStartTime
      : null;

  return (
    <div className="min-h-screen bg-grid relative">
      {/* Ambient background glow */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.03), transparent 60%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Header */}
        <Header activePage={activePage} setActivePage={setActivePage} />

        {activePage === 'knowledge-base' ? (
          <KnowledgeBasePage />
        ) : activePage === 'pipeline-dashboard' ? (
          <PipelineDashboard />
        ) : (
          <>
            {/* Upload Zone */}
            <section className="py-6">
              <UploadZone
                onFileSelected={handleFileSelected}
                currentFile={state.file}
                stage={state.stage}
                onReset={reset}
              />
            </section>

        {/* Educational Section */}
        {state.stage === 'idle' && (
          <>
            <EducationalSection
              onLoadSample={handleLoadSample}
              isProcessing={state.stage !== 'idle' && state.stage !== 'completed' && state.stage !== 'error'}
            />
            <ProjectDetails />
          </>
        )}

        {/* Error Display */}
        <AnimatePresence>
          {state.stage === 'error' && state.error && (
            <motion.div
              className="max-w-3xl mx-auto px-4 mb-6"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              <div
                className="glass-card p-4 flex items-center gap-3"
                style={{ borderColor: 'rgba(239,68,68,0.3)' }}
              >
                <AlertCircle className="w-5 h-5 text-[var(--color-error)] flex-shrink-0" />
                <p className="text-sm text-[var(--color-error)] flex-1">{state.error}</p>
                <motion.button
                  onClick={reset}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium cursor-pointer"
                  style={{
                    background: 'rgba(239,68,68,0.1)',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: 'var(--color-error)',
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <RotateCcw className="w-3 h-3" />
                  Retry
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content — Two Column Layout */}
        <AnimatePresence>
          {(showLeftPanel || showRightPanel) && (
            <motion.section
              className="px-4 pb-6"
              variants={staggerContainer}
              initial="hidden"
              animate="visible"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* LEFT PANEL — Media Preview */}
                <motion.div variants={slideInLeft} className="space-y-5">
                  {/* Video Preview (only for video files) */}
                  {showLeftPanel && mediaType === 'video' && state.file && (
                    <VideoPreview file={state.file} />
                  )}

                  {/* Audio Waveform */}
                  {state.audioUrl && <AudioWaveform audioUrl={state.audioUrl} />}
                </motion.div>

                {/* RIGHT PANEL — Pipeline & Neural Viz */}
                <motion.div variants={slideInRight} className="space-y-5">
                  <PipelineAnimation
                    stage={state.stage}
                    currentProcessingStage={state.currentProcessingStage}
                    processingStageIndex={state.processingStageIndex}
                    extractionProgress={state.extractionProgress}
                  />
                  <NeuralVisualizer
                    stage={state.stage}
                    processingStageIndex={state.processingStageIndex}
                  />
                </motion.div>
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Live Transcript */}
        <AnimatePresence>
          {showTranscript && (
            <motion.section
              className="px-4 pb-6"
              variants={fadeInUp}
              initial="hidden"
              animate="visible"
              exit={{ opacity: 0, y: 20 }}
            >
              <LiveTranscript
                words={state.words}
                visibleCount={state.visibleWordCount}
                isGenerating={state.stage === 'generating_text'}
              />
            </motion.section>
          )}
        </AnimatePresence>

        {/* Final Transcript Output */}
        <AnimatePresence>
          {state.stage === 'completed' && (
            <motion.section
              className="px-4 pb-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.6 }}
            >
              <TranscriptOutput
                transcript={state.transcript}
                words={state.words}
                processingTime={processingTime}
                correctedTranscript={state.correctedTranscript}
                isCorrecting={state.isCorrecting}
                correctionError={state.correctionError}
                onRetryCorrection={handleRetryCorrection}
              />
            </motion.section>
          )}
        </AnimatePresence>

        {/* Toast Notification */}
        <AnimatePresence>
          {showToast && (
            <motion.div
              initial={{ opacity: 0, y: 50, x: 20 }}
              animate={{ opacity: 1, y: 0, x: 0 }}
              exit={{ opacity: 0, y: 20, x: 20 }}
              className="fixed bottom-6 right-6 z-50 glass-card p-4 shadow-[0_0_30px_rgba(124,58,237,0.2)] flex items-center gap-3 border border-blue-500/30 bg-blue-950/80 backdrop-blur-md max-w-sm"
            >
              <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400">
                <Sparkles className="w-4 h-4 animate-pulse-glow" />
              </div>
              <div className="text-left">
                <p className="text-xs font-semibold text-[var(--color-text-primary)]">Processing Complete</p>
                <p className="text-[10px] text-[var(--color-text-secondary)]">Entire audio file has been transcribed.</p>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="ml-auto text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] cursor-pointer text-[10px] uppercase font-bold tracking-wider hover:bg-white/5 px-2 py-1 rounded transition-colors"
              >
                Dismiss
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        </>
        )}

        {/* Footer */}
        <Footer visitCount={visitCount} />
      </div>
    </div>
  );
}
