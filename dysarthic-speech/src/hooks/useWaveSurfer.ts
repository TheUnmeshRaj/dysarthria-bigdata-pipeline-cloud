import { useEffect, useRef, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';

interface UseWaveSurferOptions {
  container: React.RefObject<HTMLDivElement | null>;
  audioUrl: string | null;
}

interface UseWaveSurferReturn {
  isReady: boolean;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  togglePlayPause: () => void;
  seekTo: (progress: number) => void;
}

export function useWaveSurfer({ container, audioUrl }: UseWaveSurferOptions): UseWaveSurferReturn {
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    if (!container.current || !audioUrl) return;

    let cancelled = false; // ✅ track if effect was cleaned up before WS was ready

    // Destroy previous instance first
    if (wavesurferRef.current) {
      try { wavesurferRef.current.destroy(); } catch (_) { }
      wavesurferRef.current = null;
      setIsReady(false);
    }

    const ws = WaveSurfer.create({
      container: container.current,
      waveColor: '#00D4FF',
      progressColor: '#7C3AED',
      cursorColor: '#F9FAFB',
      cursorWidth: 2,
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 80,
      normalize: true,
      backend: 'WebAudio',
    });

    // Catch the load promise to suppress AbortError when destroy() is
    // called during React StrictMode's double-invoked effect cleanup.
    ws.load(audioUrl).catch((err: unknown) => {
      if (cancelled) return; // expected during cleanup — silently ignore
      console.error('WaveSurfer load error:', err);
    });

    ws.on('ready', () => {
      if (cancelled) return; // ✅ don't set state if already torn down
      setIsReady(true);
      setDuration(ws.getDuration());
    });

    ws.on('audioprocess', () => {
      if (cancelled) return;
      setCurrentTime(ws.getCurrentTime());
    });

    ws.on('play', () => { if (!cancelled) setIsPlaying(true); });
    ws.on('pause', () => { if (!cancelled) setIsPlaying(false); });
    ws.on('finish', () => { if (!cancelled) setIsPlaying(false); });

    wavesurferRef.current = ws;

    return () => {
      cancelled = true; // ✅ mark as torn down before destroy
      try { ws.destroy(); } catch (_) { /* AbortError is expected here */ }
      wavesurferRef.current = null;
    };
  }, [audioUrl, container]);

  const togglePlayPause = useCallback(() => {
    wavesurferRef.current?.playPause();
  }, []);

  const seekTo = useCallback((progress: number) => {
    wavesurferRef.current?.seekTo(progress);
  }, []);

  return { isReady, isPlaying, currentTime, duration, togglePlayPause, seekTo };
}