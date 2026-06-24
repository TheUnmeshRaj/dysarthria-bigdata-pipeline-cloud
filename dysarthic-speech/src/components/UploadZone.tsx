// ═══════════════════════════════════════════════════
// Upload Zone — Drag & Drop File Upload
// ═══════════════════════════════════════════════════

import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, FileAudio, FileVideo, X, Sparkles, User } from 'lucide-react';
import { ACCEPTED_FILE_TYPES, formatFileSize, detectMediaType } from '../utils/fileUtils';
import { fadeInScale } from '../animations/variants';
import type { AppStage } from '../hooks/useAppState';
import { getUsers, getActiveUsername, setActiveUsername } from '../services/kbApi';

interface UploadZoneProps {
  onFileSelected: (file: File) => void;
  currentFile: File | null;
  stage: AppStage;
  onReset: () => void;
}

export default function UploadZone({ onFileSelected, currentFile, stage, onReset }: UploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileSelected(acceptedFiles[0]);
      }
    },
    [onFileSelected],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    multiple: false,
    disabled: stage !== 'idle' && stage !== 'completed' && stage !== 'error',
  });

  const isDisabled = stage !== 'idle' && stage !== 'completed' && stage !== 'error';
  const mediaType = currentFile ? detectMediaType(currentFile) : null;
  const isActive = stage !== 'idle' && stage !== 'completed' && stage !== 'error';

  const [users, setUsers] = useState<string[]>([]);
  const [activeUser, setActiveUserLocal] = useState<string>(getActiveUsername() || '');

  useEffect(() => {
    getUsers()
      .then((data) => setUsers(data))
      .catch((err) => console.error('Failed to load users:', err));
  }, []);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setActiveUserLocal(val);
    if (val) {
      setActiveUsername(val);
    } else {
      localStorage.removeItem('dysarthria_kb_username');
    }
  };

  // Separate dropzone props to avoid Framer Motion conflicts

  const { onAnimationStart: _, onDragStart: _d, onDrag: _dg, onDragEnd: _de, ...rootProps } = getRootProps() as ReturnType<typeof getRootProps> & {
    onAnimationStart?: unknown;
    onDragStart?: unknown;
    onDrag?: unknown;
    onDragEnd?: unknown;
  };

  return (
    <motion.div variants={fadeInScale} initial="hidden" animate="visible" className="w-full max-w-3xl mx-auto px-4">
      <AnimatePresence mode="wait">
        {!currentFile || stage === 'idle' ? (
          <motion.div
            key="upload-container"
            className="flex flex-col gap-4 w-full"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* User Selector */}
            {users.length > 0 && (
              <div className="flex items-center justify-center gap-3 glass-card p-3 mx-auto w-full max-w-sm rounded-xl" onClick={(e) => e.stopPropagation()}>
                <User className="w-4 h-4 text-[var(--color-accent-cyan)]" />
                <select
                  value={activeUser}
                  onChange={handleUserChange}
                  className="bg-transparent text-sm font-semibold text-[var(--color-text-primary)] outline-none cursor-pointer flex-1"
                >
                  <option value="" className="bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]">No active speaker (Default STT)</option>
                  {users.map((u) => (
                    <option key={u} value={u} className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
                      Speaker: @{u}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <motion.div
              key="dropzone"
              {...rootProps}
              className={`upload-zone relative flex flex-col items-center justify-center p-10 md:p-14 transition-all ${
                isDragActive ? 'drag-active' : ''
              } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{
                opacity: 1,
                scale: isDragActive ? 1.02 : 1,
                borderColor: isDragActive ? 'rgba(0,212,255,0.6)' : 'rgba(0,212,255,0.2)',
              }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              whileHover={!isDisabled ? { scale: 1.01 } : undefined}
            >
            <input {...getInputProps()} id="file-upload-input" />

            <motion.div
              animate={
                isDragActive
                  ? {
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0],
                    }
                  : {}
              }
              transition={{ duration: 0.6, ease: 'easeInOut' }}
            >
              <Upload
                className={`w-12 h-12 mb-4 transition-colors ${
                  isDragActive ? 'text-[var(--color-accent-cyan)]' : 'text-[var(--color-text-tertiary)]'
                }`}
              />
            </motion.div>

            <p className="text-lg font-medium mb-1 text-[var(--color-text-primary)]">
              {isDragActive ? 'Drop your file here' : 'Drag & drop audio or video'}
            </p>
            <p className="text-sm text-[var(--color-text-tertiary)]">
              Supports MP3, WAV, MP4, AVI, MKV, and more
            </p>

            {isDragActive && (
              <motion.div
                className="absolute inset-0 rounded-[20px]"
                style={{
                  background: 'radial-gradient(circle at center, rgba(0,212,255,0.08), transparent 70%)',
                }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              />
            )}
            </motion.div>
          </motion.div>
        ) : (
          <motion.div
            key="file-info"
            className="glass-card p-5 flex items-center gap-4"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <motion.div
              className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center"
              style={{
                background:
                  mediaType === 'video'
                    ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.2))'
                    : 'linear-gradient(135deg, rgba(0,212,255,0.2), rgba(59,130,246,0.2))',
              }}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300, damping: 20 }}
            >
              {mediaType === 'video' ? (
                <FileVideo className="w-6 h-6 text-[var(--color-accent-purple)]" />
              ) : (
                <FileAudio className="w-6 h-6 text-[var(--color-accent-cyan)]" />
              )}
            </motion.div>

            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate text-[var(--color-text-primary)]">{currentFile.name}</p>
              <p className="text-xs text-[var(--color-text-tertiary)] flex items-center gap-2">
                <span>{formatFileSize(currentFile.size)}</span>
                <span>·</span>
                <span className="uppercase font-mono text-[10px] tracking-wider px-1.5 py-0.5 rounded bg-[var(--color-bg-tertiary)]">
                  {mediaType}
                </span>
              </p>
            </div>

            {(stage === 'completed' || stage === 'error') && (
              <motion.button
                onClick={(e) => {
                  e.stopPropagation();
                  onReset();
                }}
                className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-error)] transition-colors cursor-pointer"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-4 h-4" />
              </motion.button>
            )}

            {isActive && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-5 h-5 text-[var(--color-accent-cyan)]" />
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
