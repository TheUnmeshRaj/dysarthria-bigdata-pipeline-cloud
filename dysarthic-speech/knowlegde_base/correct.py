"""
correct.py — Correct raw STT text using the knowledge base + grammar fixes.

Loads the knowledge base built by build_kb.py, then corrects the given
text by applying:
  1. Knowledge-based corrections (fix known STT errors for this speaker)
  2. Grammatical corrections (punctuation, capitalization, sentence structure)

Usage:
    python3 correct.py "your raw stt model output text here" --api-key YOUR_KEY
    python3 correct.py "your raw stt model output text here"  # uses OPENAI_API_KEY env var
"""

import argparse
import os
import sys

from kb.models import SpeakerProfile
from kb.storage import KnowledgeBaseStorage
from build_kb import load_user_speaker_id


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
KB_DIR = "kb_data"


# ---------------------------------------------------------------------------
# Correction prompt
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """\
You are an expert transcript corrector. You will correct a raw speech-to-text \
(STT) transcript by applying two types of fixes:

### 1. Knowledge-Based Corrections
Fix known STT errors using the speaker's correction rules and vocabulary below. \
These are errors this specific speaker's STT model makes repeatedly.

### 2. Grammar & Language Corrections
Fix all grammatical errors including:
- Punctuation (add commas, periods, question marks where needed)
- Capitalization (proper nouns, sentence starts, acronyms)
- Sentence structure and readability
- Word spacing and compound words
- Number formatting

## Rules
- Apply ALL matching corrections from the table below.
- Fix grammar and punctuation naturally.
- Use {spelling} spelling conventions.
- Do NOT add information that wasn't in the original speech.
- Do NOT summarize — output the FULL corrected transcript.
- Output ONLY the corrected text. No explanations, no labels.

## Known STT Errors for This Speaker
{corrections_table}

## Speaker's Vocabulary (correct spellings)
{vocabulary_list}"""


def load_profile_by_username(username: str, kb_dir: str = KB_DIR) -> SpeakerProfile | None:
    """Load the speaker profile for a given username. Returns None if not found."""
    speaker_id = load_user_speaker_id(username, kb_dir)
    if not speaker_id:
        return None
    storage = KnowledgeBaseStorage(kb_dir)
    return storage.load_speaker(speaker_id)


def load_profile(kb_dir: str = KB_DIR) -> SpeakerProfile:
    """Load the legacy current-speaker profile (CLI fallback)."""
    from pathlib import Path
    storage = KnowledgeBaseStorage(kb_dir)
    id_file = Path(kb_dir) / "current_speaker.txt"

    if not id_file.exists():
        print("❌ No knowledge base found. Run build_kb.py first.")
        sys.exit(1)

    speaker_id = id_file.read_text(encoding="utf-8").strip()
    profile = storage.load_speaker(speaker_id)

    if not profile:
        print(f"❌ Speaker profile '{speaker_id}' not found.")
        sys.exit(1)

    return profile


def build_system_prompt(profile: SpeakerProfile) -> str:
    """Build the system prompt from the speaker's KB."""

    # Corrections table
    if profile.corrections:
        lines = ["| STT Error | Correct |", "|---|---|"]
        for rule in sorted(profile.corrections, key=lambda r: r.confidence, reverse=True):
            lines.append(f"| {rule.stt_output} | {rule.intended} |")
        corrections_table = "\n".join(lines)
    else:
        corrections_table = "(none)"

    # Vocabulary
    if profile.vocabulary:
        vocab_lines = []
        for entry in profile.vocabulary:
            aliases = ", ".join(entry.aliases[:3]) if entry.aliases else ""
            alias_str = f" (STT may say: {aliases})" if aliases else ""
            vocab_lines.append(f"- **{entry.term}**{alias_str}")
        vocabulary_list = "\n".join(vocab_lines)
    else:
        vocabulary_list = "(none)"

    return SYSTEM_PROMPT.format(
        spelling=profile.style.preferred_spelling,
        corrections_table=corrections_table,
        vocabulary_list=vocabulary_list,
    )


def correct(
    raw_text: str,
    profile: SpeakerProfile,
    api_key: str,
    model: str = "gpt-4o-mini",
) -> str:
    """Send raw text + KB context to LLM for correction."""
    from openai import OpenAI

    client = OpenAI(api_key=api_key)

    system_prompt = build_system_prompt(profile)

    response = client.chat.completions.create(
        model=model,
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": raw_text},
        ],
        temperature=0.1,
    )

    return response.choices[0].message.content.strip()


def correct_for_user(
    username: str,
    raw_text: str,
    api_key: str,
    model: str = "gpt-4o-mini",
    kb_dir: str = KB_DIR,
) -> str:
    """Convenience function: load profile by username and correct text.

    Raises ValueError if no KB found for the user.
    """
    profile = load_profile_by_username(username, kb_dir)
    if not profile:
        raise ValueError(f"No knowledge base found for user '{username}'. Build one first.")
    return correct(raw_text, profile, api_key, model)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Correct raw STT text using the knowledge base")
    parser.add_argument("text", type=str, help="The raw STT model output to correct")
    parser.add_argument("--api-key", type=str, default=None, help="OpenAI API key")
    parser.add_argument("--model", type=str, default="gpt-4o-mini", help="LLM model (default: gpt-4o-mini)")
    parser.add_argument("--username", type=str, default=None, help="Username to look up KB profile (optional)")
    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("❌ API key required. Use --api-key or set OPENAI_API_KEY env var.")
        sys.exit(1)

    # Load KB
    if args.username:
        profile = load_profile_by_username(args.username)
        if not profile:
            print(f"❌ No KB found for username '{args.username}'. Run build_kb.py --username {args.username} first.")
            sys.exit(1)
    else:
        profile = load_profile()

    print(f"📋 Loaded KB: {len(profile.corrections)} corrections, {len(profile.vocabulary)} vocabulary entries")

    # Correct
    print(f"\n   INPUT:  {args.text}")
    corrected = correct(args.text, profile, api_key, args.model)
    print(f"\n   OUTPUT: {corrected}")


if __name__ == "__main__":
    main()
