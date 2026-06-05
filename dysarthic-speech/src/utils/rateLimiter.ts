/**
 * Simple client-side sliding window rate limiter backed by localStorage.
 * Prevents spamming the free-tier API endpoints.
 */
export function checkRateLimit(limit = 3, windowMs = 60000): { allowed: boolean; waitTimeRemaining: number } {
  try {
    const now = Date.now();
    const storageKey = 'speech_transcriber_rate_limit_timestamps';
    const rawTimestamps = localStorage.getItem(storageKey);
    let timestamps: number[] = rawTimestamps ? JSON.parse(rawTimestamps) : [];
    
    // Filter out timestamps outside the window
    timestamps = timestamps.filter((t) => now - t < windowMs);
    
    if (timestamps.length >= limit) {
      // Find when the oldest request in the window expires
      const oldestTimestamp = timestamps[0];
      const timeElapsedSinceOldest = now - oldestTimestamp;
      const waitTimeRemaining = Math.max(0, windowMs - timeElapsedSinceOldest);
      
      return { allowed: false, waitTimeRemaining };
    }
    
    // Record the current request timestamp
    timestamps.push(now);
    localStorage.setItem(storageKey, JSON.stringify(timestamps));
    
    return { allowed: true, waitTimeRemaining: 0 };
  } catch (err) {
    console.warn('LocalStorage rate limiter failed, failing open:', err);
    return { allowed: true, waitTimeRemaining: 0 };
  }
}
