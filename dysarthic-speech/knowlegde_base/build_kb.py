"""
build_kb.py — Construct a knowledge base from (model_output, correct_transcription) pairs.

Reads input.txt, sends the pairs to an LLM, and generates a speaker
knowledge base (correction rules + vocabulary + style) saved as JSON.

Usage:
    python3 build_kb.py --api-key YOUR_KEY
    python3 build_kb.py                      # uses OPENAI_API_KEY env var
    python3 build_kb.py --input my_data.txt  # custom input file
"""

import argparse
import json
import os
import sys
from datetime import datetime
from pathlib import Path

from kb.models import (
    CorrectionRule,
    CorrectionSource,
    Formality,
    SpeakerProfile,
    SpeakingStyle,
    VocabularyEntry,
)
from kb.storage import KnowledgeBaseStorage


# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
KB_DIR = "kb_data"
INPUT_FILE = "input.txt"


# ---------------------------------------------------------------------------
# User → Speaker ID mapping helpers
# ---------------------------------------------------------------------------

def _users_dir(kb_dir: str = KB_DIR) -> Path:
    """Return (and create) the users/ subdirectory inside kb_data/."""
    p = Path(kb_dir) / "users"
    p.mkdir(parents=True, exist_ok=True)
    return p


def save_user_mapping(username: str, speaker_id: str, kb_dir: str = KB_DIR) -> None:
    """Persist the username → speaker_id mapping to disk."""
    (_users_dir(kb_dir) / f"{username}.txt").write_text(speaker_id, encoding="utf-8")


def load_user_speaker_id(username: str, kb_dir: str = KB_DIR) -> str | None:
    """Return the speaker_id for a username, or None if not found."""
    path = _users_dir(kb_dir) / f"{username}.txt"
    return path.read_text(encoding="utf-8").strip() if path.exists() else None


# ---------------------------------------------------------------------------
# Input parser
# ---------------------------------------------------------------------------

def parse_input_file(filepath: str) -> list[tuple[str, str]]:
    """
    Parse input.txt → list of (model_output, correct_transcription) pairs.

    Expected format — a Python array of tuples:
        [
          ("raw stt output", "correct transcription"),
          ("another stt output", "another correct one"),
        ]
    """
    import ast

    path = Path(filepath)
    if not path.exists():
        print(f"❌ File not found: {filepath}")
        sys.exit(1)

    text = path.read_text(encoding="utf-8")

    try:
        data = ast.literal_eval(text)
    except (SyntaxError, ValueError) as e:
        print(f"❌ Failed to parse {filepath}: {e}")
        print(f"   Expected format: [(\"model_output\", \"correct_transcription\"), ...]")
        sys.exit(1)

    if not isinstance(data, list):
        print(f"❌ {filepath} must contain a list of tuples")
        sys.exit(1)

    pairs: list[tuple[str, str]] = []
    for i, item in enumerate(data):
        if not isinstance(item, (list, tuple)) or len(item) != 2:
            print(f"⚠️  Skipping item {i+1}: expected a (model_output, correct) tuple")
            continue
        pairs.append((str(item[0]), str(item[1])))

    return pairs


# ---------------------------------------------------------------------------
# LLM
# ---------------------------------------------------------------------------

KB_EXTRACTION_PROMPT = """\
You are an expert linguist analyzing speech-to-text (STT) transcription errors \
for a single speaker.

Below are pairs of (STT Model Output, Correct Transcription). Analyze ALL pairs \
holistically and produce a speaker knowledge base.

## Guidelines
- Focus on REAL transcription errors, NOT punctuation or formatting differences.
- Look for PATTERNS — recurring errors are the most valuable.
- Understand the PHONETIC reason for errors (e.g., "cube netties" ≈ "Kubernetes").
- Be SELECTIVE — only include genuine STT errors.

## Transcript Pairs
{pairs_text}

## Output
Return ONLY a JSON object (no markdown fences, no extra text):

{{
  "speaker_info": {{
    "domain": "tech/medical/legal/finance/general",
    "topics": ["topic1", "topic2"],
    "formality": "casual/professional/academic/mixed",
    "languages": ["en"],
    "preferred_spelling": "en-US",
    "style_notes": "observations about speaking style"
  }},
  "corrections": [
    {{
      "stt_output": "what STT incorrectly produces",
      "intended": "what was actually said",
      "frequency": "high/medium/low",
      "explanation": "why the STT makes this error"
    }}
  ],
  "vocabulary": [
    {{
      "term": "correct spelling",
      "category": "domain_term/proper_noun/acronym/general",
      "definition": "brief definition",
      "misheard_as": ["stt", "mistakes"]
    }}
  ]
}}"""


def build_kb(
    pairs: list[tuple[str, str]],
    api_key: str,
    model: str = "gpt-4o-mini",
    username: str = "speaker",
    kb_dir: str = KB_DIR,
) -> SpeakerProfile:
    """Build the knowledge base from (model_output, correct_transcription) pairs.

    Args:
        pairs:    List of (stt_output, correct_transcription) tuples.
        api_key:  OpenAI API key.
        model:    LLM model name.
        username: Human-readable name for the speaker (used as profile name + lookup key).
        kb_dir:   Directory where kb_data is stored.

    Returns:
        Fully constructed SpeakerProfile saved to disk.
    """
    import random
    from openai import OpenAI

    client = OpenAI(api_key=api_key)

    # Sample to keep costs low — 100 pairs is enough to capture patterns
    max_pairs = 100
    if len(pairs) > max_pairs:
        print(f"  📉 Sampling {max_pairs} pairs from {len(pairs)} to keep costs low...")
        pairs = random.sample(pairs, max_pairs)

    n = len(pairs)
    batch_size = 50
    total_batches = (n + batch_size - 1) // batch_size

    print(f"\n🔧 Building knowledge base from {n} pairs ({total_batches} batches of {batch_size})...")

    all_corrections: list[dict] = []
    all_vocabulary: list[dict] = []
    speaker_info: dict = {}


    for batch_start in range(0, n, batch_size):
        batch_end = min(batch_start + batch_size, n)
        batch = pairs[batch_start:batch_end]
        batch_num = (batch_start // batch_size) + 1

        pairs_text = "\n\n".join(
            f"**Pair {i+1}:**\n"
            f"  MODEL OUTPUT: {stt}\n"
            f"  CORRECT:      {correct}"
            for i, (stt, correct) in enumerate(batch)
        )

        prompt = KB_EXTRACTION_PROMPT.format(pairs_text=pairs_text)

        print(f"  📦 Batch {batch_num}/{total_batches} (pairs {batch_start+1}-{batch_end})...", end=" ", flush=True)

        try:
            response = client.chat.completions.create(
                model=model,
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
            )
            text = response.choices[0].message.content.strip()

            # Strip markdown fences
            if text.startswith("```"):
                lines = text.split("\n")
                text = "\n".join(lines[1:])
                if text.rstrip().endswith("```"):
                    text = text.rstrip()[:-3]
                text = text.strip()

            data = json.loads(text)

            batch_corr = data.get("corrections", [])
            batch_vocab = data.get("vocabulary", [])
            all_corrections.extend(batch_corr)
            all_vocabulary.extend(batch_vocab)

            if "speaker_info" in data:
                speaker_info = data["speaker_info"]

            print(f"✅ {len(batch_corr)} corrections, {len(batch_vocab)} vocab")

        except Exception as e:
            print(f"⚠️  failed: {e}")
            continue

    # Deduplicate corrections
    freq_to_conf = {"high": 0.9, "medium": 0.7, "low": 0.5}
    seen_corrections: dict[str, CorrectionRule] = {}
    for item in all_corrections:
        stt = item.get("stt_output", "").strip()
        intended = item.get("intended", "").strip()
        if not stt or not intended:
            continue
        key = f"{stt.lower()}→{intended.lower()}"
        if key in seen_corrections:
            seen_corrections[key].confidence = min(1.0, seen_corrections[key].confidence + 0.1)
        else:
            seen_corrections[key] = CorrectionRule(
                stt_output=stt,
                intended=intended,
                confidence=freq_to_conf.get(item.get("frequency", "medium"), 0.7),
                source=CorrectionSource.LLM_SUGGESTED,
                context_hint=item.get("explanation"),
            )
    corrections = sorted(seen_corrections.values(), key=lambda r: r.confidence, reverse=True)

    # Deduplicate vocabulary
    seen_vocab: dict[str, VocabularyEntry] = {}
    for item in all_vocabulary:
        term = item.get("term", "").strip()
        if not term:
            continue
        key = term.lower()
        if key not in seen_vocab:
            seen_vocab[key] = VocabularyEntry(
                term=term,
                category=item.get("category", "general"),
                definition=item.get("definition"),
                aliases=item.get("misheard_as", []),
            )
        else:
            for alias in item.get("misheard_as", []):
                if alias.lower() not in {a.lower() for a in seen_vocab[key].aliases}:
                    seen_vocab[key].aliases.append(alias)
    vocabulary = list(seen_vocab.values())

    # Build style
    formality_map = {
        "casual": Formality.CASUAL,
        "professional": Formality.PROFESSIONAL,
        "academic": Formality.ACADEMIC,
        "mixed": Formality.MIXED,
    }

    profile = SpeakerProfile(
        name=username,
        domain=speaker_info.get("domain", "general"),
        topics=speaker_info.get("topics", []),
        vocabulary=vocabulary,
        corrections=corrections,
        style=SpeakingStyle(
            formality=formality_map.get(speaker_info.get("formality", "professional"), Formality.PROFESSIONAL),
            languages=speaker_info.get("languages", ["en"]),
            preferred_spelling=speaker_info.get("preferred_spelling", "en-US"),
            notes=speaker_info.get("style_notes"),
        ),
    )

    # Save profile and username → speaker_id mapping
    storage = KnowledgeBaseStorage(kb_dir)
    storage.save_speaker(profile)
    save_user_mapping(username, profile.speaker_id, kb_dir)

    return profile


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------

def main():
    parser = argparse.ArgumentParser(description="Build a knowledge base from input.txt")
    parser.add_argument("--input", type=str, default=INPUT_FILE, help="Input file (default: input.txt)")
    parser.add_argument("--api-key", type=str, default=None, help="OpenAI API key")
    parser.add_argument("--model", type=str, default="gpt-4o-mini", help="LLM model (default: gpt-4o-mini)")
    parser.add_argument("--username", type=str, default="speaker", help="Speaker/user name (default: speaker)")
    args = parser.parse_args()

    api_key = args.api_key or os.environ.get("OPENAI_API_KEY")
    if not api_key:
        print("❌ API key required. Use --api-key or set OPENAI_API_KEY env var.")
        sys.exit(1)

    # Parse input
    pairs = parse_input_file(args.input)
    if not pairs:
        print(f"❌ No valid pairs found in {args.input}")
        sys.exit(1)
    print(f"📄 Loaded {len(pairs)} pairs from {args.input}")

    # Build KB
    print(f"\n🔧 Building knowledge base...")
    profile = build_kb(pairs, api_key, args.model, args.username)

    # Print summary
    print(f"\n✅ Knowledge base built and saved!")
    print(f"   Speaker ID: {profile.speaker_id}")
    print(f"   Username: {profile.name}")
    print(f"   Domain: {profile.domain}")
    print(f"   Corrections: {len(profile.corrections)}")
    print(f"   Vocabulary: {len(profile.vocabulary)}")

    print(f"\n   Correction rules:")
    for r in sorted(profile.corrections, key=lambda x: x.confidence, reverse=True):
        print(f"     \"{r.stt_output}\" → \"{r.intended}\" ({r.confidence:.0%})")

    print(f"\n   Vocabulary:")
    for v in profile.vocabulary:
        aliases = ", ".join(v.aliases[:3]) if v.aliases else "—"
        print(f"     • {v.term} [{v.category}] — misheard as: {aliases}")

    print(f"\n🎯 Now run: python3 correct.py \"your raw stt text here\" --username {profile.name}")


if __name__ == "__main__":
    main()
