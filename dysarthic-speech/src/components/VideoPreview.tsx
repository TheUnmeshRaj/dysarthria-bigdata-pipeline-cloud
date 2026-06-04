import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, Film, Clock, HardDrive } from 'lucide-react';
import { fadeInUp } from '../animations/variants';
import { formatFileSize, formatDuration, getFileExtension } from '../utils/fileUtils';

interface VideoPreviewProps {
  file: File;
}

export default function VideoPreview({ file }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setVideoUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
    } else {
      videoRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <motion.div variants={fadeInUp} initial="hidden" animate="visible" className="glass-card overflow-hidden">
      {/* Video Player */}
      <div className="relative group">
        {videoUrl && (
          <video
            ref={videoRef}
            src={videoUrl}
            className="w-full aspect-video object-cover bg-black/50"
            onLoadedMetadata={() => {
              if (videoRef.current) setDuration(videoRef.current.duration);
            }}
            onEnded={() => setIsPlaying(false)}
            playsInline
            muted
          />
        )}

        {/* Play/Pause Overlay */}
        <motion.button
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          whileTap={{ scale: 0.95 }}
        >
          <motion.div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{
              background: 'rgba(0,212,255,0.2)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(0,212,255,0.3)',
            }}
            whileHover={{ scale: 1.1 }}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 text-[var(--color-accent-cyan)]" />
            ) : (
              <Play className="w-6 h-6 text-[var(--color-accent-cyan)] ml-0.5" />
            )}
          </motion.div>
        </motion.button>
      </div>

      {/* Metadata */}
      <div className="p-4 space-y-2">
        <p className="text-sm font-medium text-[var(--color-text-primary)] truncate">{file.name}</p>
        <div className="flex flex-wrap gap-3 text-xs text-[var(--color-text-tertiary)]">
          <span className="flex items-center gap-1">
            <Film className="w-3 h-3" />
            {getFileExtension(file.name)}
          </span>
          <span className="flex items-center gap-1">
            <HardDrive className="w-3 h-3" />
            {formatFileSize(file.size)}
          </span>
          {duration > 0 && (
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatDuration(duration)}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}