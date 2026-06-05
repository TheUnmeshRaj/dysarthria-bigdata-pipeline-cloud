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

Rules:
- Fix grammar, spelling, punctuation, and capitalization.
- Correct misheard words and phrases.
- Replace words that are semantically implausible with more likely alternatives based on context.
- Prefer natural, fluent English over literal transcription.
- If several corrections are possible, choose the most common real-world phrasing.
- Preserve the original meaning.

Return only the corrected sentence.

Transcript:
${transcript}`
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
