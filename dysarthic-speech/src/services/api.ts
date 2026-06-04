// ═══════════════════════════════════════════════════
// API Service — Gradio Dysarthric Transcriber
// ═══════════════════════════════════════════════════

import { Client } from "@gradio/client";

export interface TranscriptionResponse {
  transcript: string;
}

export async function transcribeAudio(audioBlob: Blob, filename?: string): Promise<TranscriptionResponse> {
  const client = await Client.connect("Unmeshraj/dysarthric-transcriber");

  // Create a File object from the Blob (Gradio expects a Blob/File)
  const audioFile = new File([audioBlob], filename || "audio.wav", {
    type: audioBlob.type || "audio/wav",
  });

  const result = await client.predict("/transcribe", {
    audio_file: audioFile,
  });

  // Gradio returns data as an array — the transcript is the first element
  const data = result.data as string[];
  const transcript = Array.isArray(data) ? data[0] : String(data);

  return { transcript };
}
