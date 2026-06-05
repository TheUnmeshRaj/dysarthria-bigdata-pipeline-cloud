// ═══════════════════════════════════════════════════
// App State Hook — Central State Machine
// ═══════════════════════════════════════════════════

import { useState, useCallback } from 'react';
import type { ProcessingStage } from '../services/mockApi';

export type AppStage =
  | 'idle'
  | 'uploading'
  | 'extracting_audio'
  | 'processing'
  | 'generating_text'
  | 'completed'
  | 'error';

export interface WordWithConfidence {
  word: string;
  confidence: number;
}

export interface AppState {
  stage: AppStage;
  file: File | null;
  audioBlob: Blob | null;
  audioUrl: string | null;
  transcript: string;
  words: WordWithConfidence[];
  visibleWordCount: number;
  currentProcessingStage: ProcessingStage | null;
  processingStageIndex: number;
  extractionProgress: number;
  error: string | null;
  processingStartTime: number | null;
  processingEndTime: number | null;
  correctedTranscript: string;
  isCorrecting: boolean;
  correctionError: string | null;
  isTranscriptionDone: boolean;
}

const initialState: AppState = {
  stage: 'idle',
  file: null,
  audioBlob: null,
  audioUrl: null,
  transcript: '',
  words: [],
  visibleWordCount: 0,
  currentProcessingStage: null,
  processingStageIndex: -1,
  extractionProgress: 0,
  error: null,
  processingStartTime: null,
  processingEndTime: null,
  correctedTranscript: '',
  isCorrecting: false,
  correctionError: null,
  isTranscriptionDone: false,
};

export function useAppState() {
  const [state, setState] = useState<AppState>(initialState);

  const setStage = useCallback((stage: AppStage) => {
    setState((prev) => ({ ...prev, stage }));
  }, []);

  const setFile = useCallback((file: File) => {
    setState((prev) => ({
      ...prev,
      file,
      stage: 'uploading',
      error: null,
      transcript: '',
      words: [],
      visibleWordCount: 0,
      correctedTranscript: '',
      isCorrecting: false,
      correctionError: null,
      isTranscriptionDone: false,
    }));
  }, []);

  const setAudioBlob = useCallback((blob: Blob, url: string) => {
    setState((prev) => ({
      ...prev,
      audioBlob: blob,
      audioUrl: url,
    }));
  }, []);

  const setExtractionProgress = useCallback((progress: number) => {
    setState((prev) => ({ ...prev, extractionProgress: progress }));
  }, []);

  const startProcessing = useCallback(() => {
    setState((prev) => ({
      ...prev,
      stage: 'processing',
      processingStartTime: Date.now(),
    }));
  }, []);

  const setProcessingStage = useCallback((stage: ProcessingStage, index: number) => {
    setState((prev) => ({
      ...prev,
      currentProcessingStage: stage,
      processingStageIndex: index,
    }));
  }, []);

  const setTranscript = useCallback((transcript: string, words: WordWithConfidence[]) => {
    setState((prev) => ({
      ...prev,
      transcript,
      words,
      stage: 'generating_text',
      isTranscriptionDone: true,
    }));
  }, []);

  const incrementVisibleWords = useCallback(() => {
    setState((prev) => ({
      ...prev,
      visibleWordCount: prev.visibleWordCount + 1,
    }));
  }, []);

  const setError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, stage: 'error', error }));
  }, []);

  const startCorrection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isCorrecting: true,
      correctionError: null,
      correctedTranscript: '',
    }));
  }, []);

  const setCorrectedTranscript = useCallback((corrected: string) => {
    setState((prev) => ({
      ...prev,
      correctedTranscript: corrected,
      isCorrecting: false,
    }));
  }, []);

  const setCorrectionError = useCallback((error: string) => {
    setState((prev) => ({
      ...prev,
      correctionError: error,
      isCorrecting: false,
    }));
  }, []);

  const appendTranscriptChunk = useCallback((text: string, words: WordWithConfidence[]) => {
    setState((prev) => {
      const updatedTranscript = prev.transcript
        ? `${prev.transcript} ${text}`.trim()
        : text;
      return {
        ...prev,
        transcript: updatedTranscript,
        words: [...prev.words, ...words],
        stage: 'generating_text',
      };
    });
  }, []);

  const setTranscriptionComplete = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isTranscriptionDone: true,
      processingEndTime: Date.now(),
    }));
  }, []);

  const reset = useCallback(() => {
    setState((prev) => {
      if (prev.audioUrl) URL.revokeObjectURL(prev.audioUrl);
      return { ...initialState };
    });
  }, []);

  return {
    state,
    setStage,
    setFile,
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
  };
}
