// ═══════════════════════════════════════════════════
// File Utilities
// ═══════════════════════════════════════════════════

export type MediaType = 'audio' | 'video' | 'unknown';

export function detectMediaType(file: File): MediaType {
  if (file.type.startsWith('audio/')) return 'audio';
  if (file.type.startsWith('video/')) return 'video';
  // Fallback to extension
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  const audioExts = ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma', 'webm'];
  const videoExts = ['mp4', 'avi', 'mkv', 'mov', 'wmv', 'flv', 'webm', 'm4v'];
  if (audioExts.includes(ext)) return 'audio';
  if (videoExts.includes(ext)) return 'video';
  return 'unknown';
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
}

export function formatDuration(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toUpperCase() || 'UNKNOWN';
}

export async function getMediaDuration(file: File): Promise<number> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const el = file.type.startsWith('video/')
      ? document.createElement('video')
      : document.createElement('audio');
    el.src = url;
    el.addEventListener('loadedmetadata', () => {
      resolve(el.duration);
      URL.revokeObjectURL(url);
    });
    el.addEventListener('error', () => {
      reject(new Error('Failed to load media metadata'));
      URL.revokeObjectURL(url);
    });
  });
}

// Accepted file types for the dropzone
export const ACCEPTED_FILE_TYPES: Record<string, string[]> = {
  'audio/*': ['.mp3', '.wav', '.ogg', '.flac', '.aac', '.m4a', '.wma'],
  'video/*': ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v'],
};
