import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDropzone } from 'react-dropzone';
import { Upload, FileAudio, Play, CheckCircle2, Loader2, Database, AlertCircle } from 'lucide-react';
import { ACCEPTED_FILE_TYPES, formatFileSize } from '../utils/fileUtils';
import { fadeInUp, staggerContainer } from '../animations/variants';

import { transcribeAudio } from '../services/api';

interface BatchFile {
  id: string;
  file: File;
  status: 'queued' | 'processing' | 'completed' | 'error';
  progress: number;
  transcript?: string;
  error?: string;
  processingTime?: number;
}

export default function BatchSimulator() {
  const [files, setFiles] = useState<BatchFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newBatch = acceptedFiles.map((file) => ({
      id: Math.random().toString(36).substring(7),
      file,
      status: 'queued' as const,
      progress: 0,
    }));
    setFiles((prev) => [...prev, ...newBatch]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    multiple: true,
    disabled: isProcessing,
  });

  const startBatch = async () => {
    if (files.length === 0 || isProcessing) return;
    
    setIsProcessing(true);
    setCompletedCount(0);
    
    // Reset all files to queued
    setFiles((prev) => prev.map(f => ({ ...f, status: 'queued', progress: 0, transcript: undefined, error: undefined, processingTime: undefined })));

    // Process all files simultaneously through the Hugging Face API
    const promises = files.map(async (batchFile) => {
      setFiles(prev => prev.map(f => f.id === batchFile.id ? { ...f, status: 'processing', progress: 50 } : f));
      
      const startTime = Date.now();
      try {
        const response = await transcribeAudio(batchFile.file, batchFile.file.name);
        const duration = Date.now() - startTime;
        
        setFiles(prev => prev.map(f => {
          if (f.id === batchFile.id) {
            return { 
              ...f, 
              status: 'completed', 
              progress: 100,
              transcript: response.transcript,
              processingTime: duration
            };
          }
          return f;
        }));
      } catch (err: any) {
        setFiles(prev => prev.map(f => {
          if (f.id === batchFile.id) {
            return { 
              ...f, 
              status: 'error', 
              progress: 100,
              error: err.message || 'Transcription failed'
            };
          }
          return f;
        }));
      }
      setCompletedCount(prev => prev + 1);
    });

    await Promise.all(promises);
    setIsProcessing(false);
  };

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id));
  };

  const clearCompleted = () => {
    setFiles(prev => prev.filter(f => f.status !== 'completed'));
  };

  return (
    <motion.div
      className="max-w-6xl mx-auto px-4 py-8 space-y-8"
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
    >
      <motion.div variants={fadeInUp} className="text-center max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-[var(--color-text-primary)] mb-3 flex items-center justify-center gap-3">
          <Database className="w-6 h-6 text-blue-400" />
          Big Data Batch Simulator
        </h2>
        <p className="text-sm text-[var(--color-text-secondary)]">
          Upload multiple audio files to simulate the parallel feature extraction and analytics processing capabilities of the Apache Spark pipeline. No costly AI inference is run during this simulation.
        </p>
      </motion.div>

      {/* Upload Zone */}
      <motion.div variants={fadeInUp}>
        <div
          {...getRootProps()}
          className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer overflow-hidden ${
            isDragActive
              ? 'border-blue-400 bg-blue-900/10'
              : isProcessing
              ? 'border-slate-800 bg-slate-900/50 cursor-not-allowed opacity-50'
              : 'border-[var(--color-border-default)] bg-[var(--color-bg-secondary)] hover:border-slate-600 hover:bg-slate-800/30'
          }`}
        >
          <input {...getInputProps()} />
          <div className="relative z-10 flex flex-col items-center gap-4">
            <div className={`p-4 rounded-full ${isDragActive ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
              <Upload className="w-8 h-8" />
            </div>
            <div>
              <p className="text-base font-semibold text-[var(--color-text-primary)]">
                Drop multiple audio files here, or click to browse
              </p>
              <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                Supports multiple .wav, .mp3, .m4a files
              </p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Action Bar */}
      {files.length > 0 && (
        <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 glass-card rounded-xl border border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]/50">
          <div className="text-sm text-[var(--color-text-secondary)] font-medium flex items-center gap-2">
            <FileAudio className="w-4 h-4 text-slate-400" />
            {files.length} files queued
            {isProcessing && <span className="ml-2 px-2 py-0.5 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/20">Processing {completedCount}/{files.length}</span>}
          </div>
          
          <div className="flex gap-3">
            <button
              onClick={clearCompleted}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 transition-colors disabled:opacity-50"
            >
              Clear Completed
            </button>
            <button
              onClick={startBatch}
              disabled={isProcessing || files.length === 0}
              className={`flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg border transition-all shadow-sm ${
                isProcessing
                  ? 'bg-slate-800 border-slate-700 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-500/10 border-blue-500/30 text-blue-400 hover:bg-blue-500/20'
              }`}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Simulating Cluster...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Batch Processing
                </>
              )}
            </button>
          </div>
        </motion.div>
      )}

      {/* File Grid */}
      <AnimatePresence>
        {files.length > 0 && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {files.map((f) => (
              <motion.div 
                key={f.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-4 rounded-xl border transition-all ${
                  f.status === 'completed' ? 'border-green-500/30 bg-green-500/5' :
                  f.status === 'processing' ? 'border-blue-500/30 bg-blue-500/5' :
                  'border-[var(--color-border-default)] bg-[var(--color-bg-secondary)]'
                }`}
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileAudio className={`w-4 h-4 shrink-0 ${
                      f.status === 'completed' ? 'text-green-400' :
                      f.status === 'processing' ? 'text-blue-400' : 'text-slate-400'
                    }`} />
                    <span className="text-xs font-medium text-[var(--color-text-primary)] truncate" title={f.file.name}>
                      {f.file.name}
                    </span>
                  </div>
                  {f.status === 'queued' && !isProcessing && (
                    <button onClick={() => removeFile(f.id)} className="text-slate-500 hover:text-red-400 transition-colors">
                      <AlertCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                  {f.status === 'processing' && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />}
                  {f.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 shrink-0" />}
                </div>

                <div className="space-y-2">
                  <div className="w-full bg-slate-900 rounded-full h-1.5 overflow-hidden">
                    <motion.div 
                      className={`h-full ${f.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${f.progress}%` }}
                      transition={{ duration: 0.2 }}
                    />
                  </div>
                  
                  <div className="flex flex-col gap-2 text-[10px]">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">{formatFileSize(f.file.size)}</span>
                      {f.status === 'completed' && f.processingTime && (
                        <span className="font-mono text-slate-500">{f.processingTime}ms</span>
                      )}
                    </div>
                    
                    {f.status === 'completed' && f.transcript && (
                      <div className="mt-1 p-2 bg-slate-900/50 rounded border border-green-500/20 text-green-400 font-medium">
                        "{f.transcript}"
                      </div>
                    )}
                    {f.status === 'error' && (
                      <div className="mt-1 p-2 bg-red-500/10 rounded border border-red-500/20 text-red-400">
                        {f.error || 'Failed'}
                      </div>
                    )}
                    {f.status === 'processing' && (
                      <span className="text-blue-400 animate-pulse">Extracting features...</span>
                    )}
                    {f.status === 'queued' && (
                      <span className="text-slate-500">Waiting for workers</span>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
