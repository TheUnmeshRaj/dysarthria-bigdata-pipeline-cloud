// ═══════════════════════════════════════════════════
// FFmpeg Hook — In-Browser Video → Audio Extraction
// ═══════════════════════════════════════════════════

import { useState, useRef, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL, fetchFile } from '@ffmpeg/util';

interface UseFFmpegReturn {
  loaded: boolean;
  loading: boolean;
  progress: number;
  extractAudio: (videoFile: File) => Promise<{ blob: Blob; url: string }>;
  error: string | null;
}

export function useFFmpeg(): UseFFmpegReturn {
  const ffmpegRef = useRef<FFmpeg | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const loadFFmpeg = useCallback(async () => {
    if (ffmpegRef.current && loaded) return;

    setLoading(true);
    setError(null);

    try {
      const ffmpeg = new FFmpeg();

      ffmpeg.on('progress', ({ progress: p }) => {
        setProgress(Math.round(p * 100));
      });

      // Single-threaded core — no SharedArrayBuffer / COOP-COEP headers needed
      const baseURL = 'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/esm';
      await ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`,   'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
      });

      ffmpegRef.current = ffmpeg;
      setLoaded(true);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to load FFmpeg';
      setError(msg);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [loaded]);

  const extractAudio = useCallback(
    async (videoFile: File): Promise<{ blob: Blob; url: string }> => {
      await loadFFmpeg();

      const ffmpeg = ffmpegRef.current;
      if (!ffmpeg) throw new Error('FFmpeg not loaded');

      setProgress(0);
      setError(null);

      try {
        const inputName = 'input' + (videoFile.name.substring(videoFile.name.lastIndexOf('.')) || '.mp4');
        await ffmpeg.writeFile(inputName, await fetchFile(videoFile));

        await ffmpeg.exec(['-i', inputName, '-vn', '-acodec', 'pcm_s16le', '-ar', '16000', '-ac', '1', 'output.wav']);

        const data = await ffmpeg.readFile('output.wav');
        // .slice() creates a new Uint8Array backed by a plain ArrayBuffer,
        // satisfying the BlobPart constraint in TS 6.0.
        const bytes = (data as Uint8Array).slice();
        const audioBlob = new Blob([bytes], { type: 'audio/wav' });
        const audioUrl = URL.createObjectURL(audioBlob);

        await ffmpeg.deleteFile(inputName);
        await ffmpeg.deleteFile('output.wav');

        setProgress(100);
        return { blob: audioBlob, url: audioUrl };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Audio extraction failed';
        setError(msg);
        throw err;
      }
    },
    [loadFFmpeg],
  );

  return { loaded, loading, progress, extractAudio, error };
}