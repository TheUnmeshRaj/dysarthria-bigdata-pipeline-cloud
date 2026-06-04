// ═══════════════════════════════════════════════════
// Transcription Hook — Orchestrates the Pipeline
// ═══════════════════════════════════════════════════

import { useCallback } from 'react';
import { transcribeAudio } from '../services/api';
import { mockTranscribe, generateConfidenceScores } from '../services/mockApi';
import type { ProcessingStage } from '../services/mockApi';
import type { WordWithConfidence } from './useAppState';

const USE_MOCK = false;

interface UseTranscriptionOptions {
  onStageChange: (stage: ProcessingStage, index: number) => void;
  onTranscriptReady: (transcript: string, words: WordWithConfidence[]) => void;
  onError: (error: string) => void;
}

export function useTranscription({ onStageChange, onTranscriptReady, onError }: UseTranscriptionOptions) {
  const transcribe = useCallback(
    async (audioBlob: Blob, filename?: string) => {
      try {
        let result: { transcript: string };

        if (USE_MOCK) {
          result = await mockTranscribe(audioBlob, onStageChange);
        } else {
          // Real API — simulate stages for UX while waiting
          const stagePromise = (async () => {
            const stages: ProcessingStage[] = [
              { id: 'analyzing', label: 'Analyzing speech patterns...', duration: 1500 },
              { id: 'phonetic', label: 'Extracting phonetic features...', duration: 1200 },
              { id: 'processing', label: 'Processing dysarthric speech...', duration: 2000 },
              { id: 'decoding', label: 'Decoding acoustic representations...', duration: 1500 },
              { id: 'generating', label: 'Generating transcript...', duration: 1000 },
            ];
            for (let i = 0; i < stages.length; i++) {
              onStageChange(stages[i], i);
              await new Promise((r) => setTimeout(r, stages[i].duration));
            }
          })();

          const apiPromise = transcribeAudio(audioBlob, filename);

          // Wait for both — API result is what matters
          const [apiResult] = await Promise.all([apiPromise, stagePromise]);
          result = apiResult;
        }

        const words = generateConfidenceScores(result.transcript);
        onTranscriptReady(result.transcript, words);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Transcription failed';
        onError(msg);
      }
    },
    [onStageChange, onTranscriptReady, onError],
  );

  return { transcribe };
}
