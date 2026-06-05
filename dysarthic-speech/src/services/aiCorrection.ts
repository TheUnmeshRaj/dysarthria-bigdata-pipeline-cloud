// ═══════════════════════════════════════════════════
// Hugging Face Router API Service for Correction
// ═══════════════════════════════════════════════════

declare const process: {
  env: {
    HF_TOKEN?: string;
  };
};

/**
 * Call Hugging Face Router to correct grammatical, spelling,
 * and semantic errors in the predicted transcript.
 */
export async function correctTranscript(transcript: string): Promise<string> {
  const token = (process.env.HF_TOKEN || '').trim();
  if (!token) {
    throw new Error('Hugging Face API token is missing. Please define HF_TOKEN in your .env.local file.');
  }

  const response = await fetch('https://router.huggingface.co/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model: 'deepseek-ai/DeepSeek-V4-Flash',
      messages: [
        {
          role: "user",
          content: `You are correcting noisy speech-to-text output.

Your task is to reconstruct the most likely sentence the speaker intended to say.

The transcript is a noisy phonetic approximation of spoken English.

Rules:
- Fix grammar, spelling, punctuation, and capitalization.
- Correct misheard words and phrases.
- Preserve the original meaning whenever it can be reasonably inferred.
- Prefer natural, fluent English over literal transcription.
- Treat unusual or nonsensical words as potential speech-recognition errors.
- When replacing a word or phrase, prefer alternatives that sound similar to the original transcript.
- Do not replace a word with a contextually plausible alternative if its pronunciation is substantially different from the original, unless the intended wording is overwhelmingly obvious from context.
- Minimize unnecessary changes.
- Keep as much of the original wording as possible.
- If multiple corrections are plausible, choose the one that best satisfies the following order of priority:
  1. Phonetic similarity to the original transcript.
  2. Contextual plausibility.
  3. Grammatical correctness.
  4. Natural real-world phrasing.
- Favor corrections that could realistically have been misheard by a speech-to-text system.

Return only the corrected sentence.

Transcript: ${transcript}`
        }
      ],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Hugging Face Router API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  let corrected = data.choices?.[0]?.message?.content?.trim();

  if (!corrected) {
    throw new Error('Empty response from Hugging Face Router API.');
  }

  // Defensively strip any wrapper quotes deepseek might have added
  if (corrected.startsWith('"') && corrected.endsWith('"')) {
    corrected = corrected.slice(1, -1).trim();
  } else if (corrected.startsWith("'") && corrected.endsWith("'")) {
    corrected = corrected.slice(1, -1).trim();
  }

  return corrected;
}
