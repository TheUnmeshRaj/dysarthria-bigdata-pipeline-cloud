import { Client } from "@gradio/client";

export interface TranscriptionResponse {
  transcript: string;
}

export async function transcribeAudio(audioBlob: Blob, filename?: string): Promise<TranscriptionResponse> {
  console.log(`[API] transcribeAudio starting for: ${filename}`);
  try {
    console.log(`[API] Client.connect connecting to Gradio space: Unmeshraj/dysarthric-transcriber...`);
    const client = await Client.connect("Unmeshraj/dysarthric-transcriber");
    console.log(`[API] Connected to Gradio successfully.`);

    // Create a File object from the Blob (Gradio expects a Blob/File)
    const audioFile = new File([audioBlob], filename || "audio.wav", {
      type: audioBlob.type || "audio/wav",
    });

    console.log(`[API] Calling client.predict("/transcribe") with file of size: ${audioFile.size} bytes`);
    const result = await client.predict("/transcribe", {
      audio_file: audioFile,
    });
    console.log(`[API] Predict result received:`, result);

    // Gradio returns data as an array — the transcript is the first element
    const data = result.data as string[];
    const transcript = Array.isArray(data) ? data[0] : String(data);
    console.log(`[API] Parsed transcript successfully: "${transcript}"`);

    return { transcript };
  } catch (err) {
    console.error(`[API] Exception caught in transcribeAudio:`, err);
    throw err;
  }
}

/**
 * Encodes a section of an AudioBuffer as a standard 16-bit mono PCM WAV file.
 */
function bufferToWav(buffer: AudioBuffer, startOffset: number, endOffset: number): Blob {
  const numChannels = 1; // Force mono for transcription models
  const sampleRate = buffer.sampleRate;
  const bitDepth = 16;
  const format = 1; // PCM
  
  const sampleLength = endOffset - startOffset;
  const byteRate = (sampleRate * numChannels * bitDepth) / 8;
  const blockAlign = (numChannels * bitDepth) / 8;
  
  const arrayBuffer = new ArrayBuffer(44 + sampleLength * 2);
  const view = new DataView(arrayBuffer);
  
  /* RIFF identifier */
  writeString(view, 0, 'RIFF');
  /* file length */
  view.setUint32(4, 36 + sampleLength * 2, true);
  /* RIFF type */
  writeString(view, 8, 'WAVE');
  /* format chunk identifier */
  writeString(view, 12, 'fmt ');
  /* format chunk length */
  view.setUint32(16, 16, true);
  /* sample format (raw) */
  view.setUint16(20, format, true);
  /* channel count */
  view.setUint16(22, numChannels, true);
  /* sample rate */
  view.setUint32(24, sampleRate, true);
  /* byte rate */
  view.setUint32(28, byteRate, true);
  /* block align */
  view.setUint16(32, blockAlign, true);
  /* bits per sample */
  view.setUint16(34, bitDepth, true);
  /* data chunk identifier */
  writeString(view, 36, 'data');
  /* data chunk length */
  view.setUint32(40, sampleLength * 2, true);
  
  // We use only the first channel for mono
  const channelData = buffer.getChannelData(0);
  
  let offset = 44;
  for (let i = startOffset; i < endOffset; i++) {
    let sample = channelData[i];
    // Clamp to [-1.0, 1.0]
    sample = Math.max(-1, Math.min(1, sample));
    // Convert to 16-bit signed integer
    const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
    view.setInt16(offset, intSample, true);
    offset += 2;
  }
  
  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function writeString(view: DataView, offset: number, string: string) {
  for (let i = 0; i < string.length; i++) {
    view.setUint8(offset + i, string.charCodeAt(i));
  }
}

/**
 * Decodes the input audio file, splits it into chunks of 15 seconds, transcribes them in parallel,
 * and concatenates the resulting text strings in sequential order.
 */
export async function transcribeAudioInChunks(
  audioBlob: Blob,
  filename?: string,
  onProgress?: (completed: number, total: number) => void,
  onChunkCompleted?: (text: string, index: number) => void
): Promise<TranscriptionResponse> {
  const arrayBuffer = await audioBlob.arrayBuffer();
  
  // Use OfflineAudioContext or normal AudioContext to decode
  const AudioContextClass = window.AudioContext || (window as Window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) {
    throw new Error("Web Audio API is not supported in this browser.");
  }
  
  const audioCtx = new AudioContextClass();
  let audioBuffer: AudioBuffer;
  try {
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
  } catch (err) {
    console.error("Browser audio decoding failed, falling back to direct upload", err);
    const result = await transcribeAudio(audioBlob, filename);
    onChunkCompleted?.(result.transcript.trim(), 0);
    return result;
  } finally {
    await audioCtx.close();
  }

  const duration = audioBuffer.duration;
  const CHUNK_DURATION = 15; // seconds
  
  if (duration <= CHUNK_DURATION) {
    onProgress?.(1, 1);
    const result = await transcribeAudio(audioBlob, filename);
    onChunkCompleted?.(result.transcript.trim(), 0);
    return result;
  }

  const numChunks = Math.ceil(duration / CHUNK_DURATION);
  let completedChunks = 0;
  
  // Initiate transcription for all chunks in parallel
  const chunkPromises = Array.from({ length: numChunks }).map(async (_, i) => {
    const startTime = i * CHUNK_DURATION;
    const endTime = Math.min((i + 1) * CHUNK_DURATION, duration);
    
    const startSample = Math.floor(startTime * audioBuffer.sampleRate);
    const endSample = Math.min(Math.floor(endTime * audioBuffer.sampleRate), audioBuffer.length);
    
    const chunkBlob = bufferToWav(audioBuffer, startSample, endSample);
    
    try {
      const result = await transcribeAudio(chunkBlob, `chunk_${i}_${filename || 'audio.wav'}`);
      const text = result.transcript.trim();
      completedChunks++;
      onProgress?.(completedChunks, numChunks);
      onChunkCompleted?.(text, i);
      return text;
    } catch (err) {
      console.error(`Error transcribing chunk ${i}:`, err);
      completedChunks++;
      onProgress?.(completedChunks, numChunks);
      onChunkCompleted?.("", i);
      return "";
    }
  });

  const transcripts = await Promise.all(chunkPromises);
  
  // Assemble the sequential transcripts
  const finalTranscript = transcripts
    .map(t => t.trim())
    .filter(t => t.length > 0)
    .join(" ");

  return { transcript: finalTranscript };
}
