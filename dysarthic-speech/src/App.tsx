// ═══════════════════════════════════════════════════
// App — Main Dashboard Layout & Orchestration
// ═══════════════════════════════════════════════════

import { useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, RotateCcw } from 'lucide-react';
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
    reset,
  } = useAppState();

  const { extractAudio, progress: ffmpegProgress } = useFFmpeg();
  const wordTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { transcribe } = useTranscription({
    onStageChange: setProcessingStage,
    onTranscriptReady: setTranscript,
    onError: setError,
  });

  // Update extraction progress from ffmpeg
  useEffect(() => {
    if (state.stage === 'extracting_audio') {
      setExtractionProgress(ffmpegProgress);
    }
  }, [ffmpegProgress, state.stage, setExtractionProgress]);

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
        <Header />

        {/* Upload Zone */}
        <section className="py-6">
          <UploadZone
            onFileSelected={handleFileSelected}
            currentFile={state.file}
            stage={state.stage}
            onReset={reset}
          />
        </section>

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
              />
            </motion.section>
          )}
        </AnimatePresence>

        {/* Footer */}
        <Footer />
      </div>
    </div>
  );
}
