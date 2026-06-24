// ═══════════════════════════════════════════════════
// Knowledge Base API Service
// Communicates with the FastAPI backend at port 8000
// ═══════════════════════════════════════════════════

const KB_API_BASE = import.meta.env.VITE_KB_API_BASE || 'http://127.0.0.1:8000';

export interface TranscriptPair {
  model_output: string;
  correct_transcription: string;
}

export interface BuildKBResponse {
  speaker_id: string;
  username: string;
  domain: string;
  corrections_count: number;
  vocabulary_count: number;
  message: string;
}

export interface CorrectResponse {
  corrected: string;
  username: string;
  used_kb: boolean;
}

export interface KBStatusResponse {
  exists: boolean;
  username: string;
  speaker_id?: string;
  domain?: string;
  corrections_count: number;
  vocabulary_count: number;
  topics: string[];
}

/**
 * Build (or rebuild) a knowledge base for a user from transcript pairs.
 */
export async function buildKnowledgeBase(
  username: string,
  pairs: TranscriptPair[],
  model = 'gpt-4o-mini'
): Promise<BuildKBResponse> {
  const response = await fetch(`${KB_API_BASE}/build-kb`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, pairs, model }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || `Build KB failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Correct raw STT text using the user's knowledge base + grammar fixes.
 */
export async function correctWithKB(
  username: string,
  rawText: string,
  model = 'gpt-4o-mini'
): Promise<CorrectResponse> {
  const response = await fetch(`${KB_API_BASE}/correct`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, raw_text: rawText, model }),
  });

  if (!response.ok) {
    const err = await response.json().catch(() => ({ detail: response.statusText }));
    throw new Error(err.detail || `Correction failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get the KB status for a username (existence + stats).
 */
export async function getKBStatus(username: string): Promise<KBStatusResponse> {
  const response = await fetch(`${KB_API_BASE}/kb-status/${encodeURIComponent(username)}`);

  if (!response.ok) {
    throw new Error(`Status check failed: ${response.status}`);
  }

  return response.json();
}

/**
 * Get a list of all usernames that have a KB.
 */
export async function getUsers(): Promise<string[]> {
  const response = await fetch(`${KB_API_BASE}/users`);
  
  if (!response.ok) {
    throw new Error(`Failed to fetch users: ${response.status}`);
  }
  
  return response.json();
}

/**
 * Check if the KB API server is reachable.
 */
export async function isKBServerReachable(): Promise<boolean> {
  try {
    const response = await fetch(`${KB_API_BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return response.ok;
  } catch {
    return false;
  }
}

// Active username stored in localStorage
export const KB_USERNAME_KEY = 'dysarthria_kb_username';

export function getActiveUsername(): string | null {
  return localStorage.getItem(KB_USERNAME_KEY) || null;
}

export function setActiveUsername(username: string): void {
  localStorage.setItem(KB_USERNAME_KEY, username.trim());
}

export function clearActiveUsername(): void {
  localStorage.removeItem(KB_USERNAME_KEY);
}
