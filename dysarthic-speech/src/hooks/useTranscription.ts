// ═══════════════════════════════════════════════════
// Transcription Hook — Orchestrates the Pipeline
// ═══════════════════════════════════════════════════

import { useCallback } from 'react';
import { transcribeAudioInChunks } from '../services/api';
import { mockTranscribe, generateConfidenceScores } from '../services/mockApi';
import type { ProcessingStage } from '../services/mockApi';
import type { WordWithConfidence } from './useAppState';

const USE_MOCK = false;

interface UseTranscriptionOptions {
  onStageChange: (stage: ProcessingStage, index: number) => void;
  onTranscriptReady: (transcript: string, words: WordWithConfidence[]) => void;
  onChunkCompleted: (text: string, index: number, total: number) => void;
  onError: (error: string) => void;
}

export function useTranscription({ onStageChange, onTranscriptReady, onChunkCompleted, onError }: UseTranscriptionOptions) {
  const transcribe = useCallback(
    async (audioBlob: Blob, filename?: string) => {
      try {
        let result: { transcript: string };
        let numChunks = 1;

        if (USE_MOCK) {
          result = await mockTranscribe(audioBlob, onStageChange);
        } else {
          // Real API — decode metadata to check duration first
          const arrayBuffer = await audioBlob.slice(0).arrayBuffer();
          const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
          let duration = 0;
          
          if (AudioContextClass) {
            const tempCtx = new AudioContextClass();
            try {
              const decoded = await tempCtx.decodeAudioData(arrayBuffer);
              duration = decoded.duration;
            } catch (e) {
              console.warn('Could not pre-decode audio duration:', e);
            } finally {
              await tempCtx.close();
            }
          }

          const CHUNK_DURATION = 15;
          numChunks = Math.ceil(duration / CHUNK_DURATION);

          // Real API — simulate stages for UX while waiting
          const stagePromise = (async () => {
            const stages: ProcessingStage[] = [
              { id: 'analyzing', label: 'Analyzing speech patterns...', duration: 1200 },
              { id: 'phonetic', label: 'Extracting phonetic features...', duration: 1000 },
              { id: 'processing', label: 'Processing dysarthric speech...', duration: 1500 },
              { id: 'decoding', label: 'Decoding acoustic representations...', duration: 1200 },
            ];
            for (let i = 0; i < stages.length; i++) {
              onStageChange(stages[i], i);
              await new Promise((r) => setTimeout(r, stages[i].duration));
            }
            
            // If it's a single chunk, show the standard generating stage
            if (numChunks <= 1) {
              onStageChange(
                { id: 'generating', label: 'Generating transcript...', duration: 1000 },
                stages.length
              );
            }
          })();

          // Call the chunked API and pass a progress callback
          const apiPromise = transcribeAudioInChunks(
            audioBlob,
            filename,
            (completed, total) => {
              if (total > 1) {
                onStageChange(
                  {
                    id: 'chunking',
                    label: `Transcribing audio chunks (${completed}/${total})...`,
                    duration: 0,
                  },
                  4 // Index 4 is the final transcription/reveal stage
                );
              }
            },
            (text, index) => {
              onChunkCompleted(text, index, numChunks);
            }
          );

          // Wait for both — API result is what matters
          const [apiResult] = await Promise.all([apiPromise, stagePromise]);
          result = apiResult;
        }

        const words = generateConfidenceScores(result.transcript);
        if (numChunks <= 1) {
          onTranscriptReady(result.transcript, words);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Transcription failed';
        onError(msg);
      }
    },
    [onStageChange, onTranscriptReady, onChunkCompleted, onError],
  );

  return { transcribe };
}
