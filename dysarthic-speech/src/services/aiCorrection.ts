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
          role: 'user',
          content: `Correct grammatical, spelling, and semantic errors in the following sentence. Preserve the original meaning. If the sentence is already correct, return it unchanged. Output only the corrected sentence. ${transcript}`,
        },
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
