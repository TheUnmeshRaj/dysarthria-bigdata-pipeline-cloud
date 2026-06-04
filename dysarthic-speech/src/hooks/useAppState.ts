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
    }));
  }, []);

  const incrementVisibleWords = useCallback(() => {
    setState((prev) => {
      const nextCount = prev.visibleWordCount + 1;
      // If we've revealed all words, transition to completed
      if (nextCount >= prev.words.length) {
        return {
          ...prev,
          visibleWordCount: nextCount,
          stage: 'completed',
          processingEndTime: Date.now(),
        };
      }
      return { ...prev, visibleWordCount: nextCount };
    });
  }, []);

  const setError = useCallback((error: string) => {
    setState((prev) => ({ ...prev, stage: 'error', error }));
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
    reset,
  };
}
