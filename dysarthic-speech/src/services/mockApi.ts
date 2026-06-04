// ═══════════════════════════════════════════════════
// Mock API Service — Development Mode
// ═══════════════════════════════════════════════════

import type { TranscriptionResponse } from './api';

const SAMPLE_TRANSCRIPTS = [
  "Hello how are you doing today",
  "I would like to order some water please",
  "The patient speech is improving steadily with therapy",
  "Can you help me with this please thank you",
  "My name is and I am here for my appointment",
  "I need assistance with daily activities please",
  "The weather is nice today I want to go outside",
  "Thank you very much for your help and patience",
];

export type ProcessingStage = {
  id: string;
  label: string;
  duration: number; // ms
};

export const PROCESSING_STAGES: ProcessingStage[] = [
  { id: 'analyzing', label: 'Analyzing speech patterns...', duration: 1500 },
  { id: 'phonetic', label: 'Extracting phonetic features...', duration: 1200 },
  { id: 'processing', label: 'Processing dysarthric speech...', duration: 2000 },
  { id: 'decoding', label: 'Decoding acoustic representations...', duration: 1500 },
  { id: 'generating', label: 'Generating transcript...', duration: 1000 },
];

export async function mockTranscribe(
  _audioBlob: Blob,
  onStageChange?: (stage: ProcessingStage, index: number) => void,
): Promise<TranscriptionResponse> {
  // Simulate processing stages
  for (let i = 0; i < PROCESSING_STAGES.length; i++) {
    const stage = PROCESSING_STAGES[i];
    onStageChange?.(stage, i);
    await new Promise((r) => setTimeout(r, stage.duration));
  }

  // Return random transcript
  const transcript = SAMPLE_TRANSCRIPTS[Math.floor(Math.random() * SAMPLE_TRANSCRIPTS.length)];
  return { transcript };
}

// Generate fake confidence scores for each word
export function generateConfidenceScores(transcript: string): { word: string; confidence: number }[] {
  return transcript.split(' ').map((word) => ({
    word,
    confidence: 0.75 + Math.random() * 0.25, // 75-100%
  }));
}
